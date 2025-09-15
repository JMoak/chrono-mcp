import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DateTime } from "luxon";
import { z } from "zod";
import { configManager } from "../utils/config.js";
import { formatDuration } from "../utils/date-utils.js";

const MAX_OPERATIONS = 10000;

interface TimeCalculatorResponse {
	success: boolean;
	operation: string;
	result?: unknown;
	error?: string;
	warnings?: string[];
	metadata?: {
		calculation_time: string;
		calculation_timezone: string;
		processed_count?: number;
		failed_count?: number;
	};
}

type ParseResult<T> =
	| { success: true; data: T }
	| { success: false; error: string };

type OperationResult<T> =
	| { success: true; data: T; warnings?: string[] }
	| { success: false; error: string };

function createResponse(response: TimeCalculatorResponse) {
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(response, null, 2),
			},
		],
	};
}

function createErrorResponse(operation: string, error: string) {
	const response: TimeCalculatorResponse = {
		success: false,
		operation,
		error,
	};

	if (configManager.isDebugMode()) {
		response.metadata = {
			calculation_time: DateTime.now().toISO() || "",
			calculation_timezone: DateTime.now().zoneName || "system",
		};
	}

	return createResponse(response);
}

interface OperationPlan {
	interaction_mode: string;
	base_times: string[];
	compare_times?: string[];
}

function planOperations(
	base_time: string | string[] | undefined,
	compare_time: string | string[] | undefined,
	interaction_mode: string,
): ParseResult<OperationPlan> {
	// Normalize inputs to arrays using safe parsing
	const baseTimes = base_time ? safelyParseTimeArray(base_time) : [];
	const compareTimes = compare_time ? safelyParseTimeArray(compare_time) : [];

	let actualMode = interaction_mode;
	let operationCount = 0;
	let finalBaseTimes = baseTimes;
	let finalCompareTimes = compareTimes;

	if (interaction_mode === "auto_detect") {
		// Auto-detect based on input patterns
		if (baseTimes.length <= 1 && compareTimes.length <= 1) {
			actualMode = "single_to_single";
			operationCount = Math.max(baseTimes.length, compareTimes.length);
		} else if (baseTimes.length === 1 && compareTimes.length > 1) {
			actualMode = "single_to_many";
			operationCount = compareTimes.length;
		} else if (baseTimes.length > 1 && compareTimes.length <= 1) {
			actualMode = "many_to_single";
			operationCount = baseTimes.length;
		} else {
			// Both are arrays with multiple items - default to pairwise
			actualMode = "pairwise";
			const minLength = Math.min(baseTimes.length, compareTimes.length);
			finalBaseTimes = baseTimes.slice(0, minLength);
			finalCompareTimes = compareTimes.slice(0, minLength);
			operationCount = minLength;
		}
	} else if (interaction_mode === "single_to_many") {
		if (baseTimes.length !== 1 || compareTimes.length <= 1) {
			return {
				success: false,
				error:
					"single_to_many mode requires exactly 1 base_time and multiple compare_times",
			};
		}
		operationCount = compareTimes.length;
	} else if (interaction_mode === "many_to_single") {
		if (baseTimes.length <= 1 || compareTimes.length !== 1) {
			return {
				success: false,
				error:
					"many_to_single mode requires multiple base_times and exactly 1 compare_time",
			};
		}
		operationCount = baseTimes.length;
	} else if (interaction_mode === "pairwise") {
		if (baseTimes.length === 0 || compareTimes.length === 0) {
			return {
				success: false,
				error: "pairwise mode requires both base_time and compare_time arrays",
			};
		}
		const minLength = Math.min(baseTimes.length, compareTimes.length);
		finalBaseTimes = baseTimes.slice(0, minLength);
		finalCompareTimes = compareTimes.slice(0, minLength);
		operationCount = minLength;
	} else if (interaction_mode === "cross_product") {
		if (baseTimes.length === 0 || compareTimes.length === 0) {
			return {
				success: false,
				error:
					"cross_product mode requires both base_time and compare_time arrays",
			};
		}
		operationCount = baseTimes.length * compareTimes.length;
	} else if (interaction_mode === "aggregate") {
		// For now, treat as pairwise until aggregate is better defined
		const minLength = Math.min(baseTimes.length, compareTimes.length);
		finalBaseTimes = baseTimes.slice(0, minLength);
		finalCompareTimes = compareTimes.slice(0, minLength);
		operationCount = minLength;
	}

	// Enforce maximum operations
	if (operationCount > MAX_OPERATIONS) {
		return {
			success: false,
			error: `Operation count (${operationCount}) exceeds maximum allowed (${MAX_OPERATIONS}) for interaction mode '${actualMode}'`,
		};
	}

	return {
		success: true,
		data: {
			interaction_mode: actualMode,
			base_times: finalBaseTimes,
			compare_times: finalCompareTimes,
		},
	};
}

// Reusable utility functions
function safelyParseTimeArray(times: string | string[] | undefined): string[] {
	if (!times) {
		return [DateTime.now().toISO() || ""];
	}

	if (Array.isArray(times)) {
		return times;
	}

	// If it's a string that looks like JSON array, try to parse it
	if (typeof times === "string" && times.trim().startsWith("[")) {
		try {
			const parsed = JSON.parse(times);
			if (
				Array.isArray(parsed) &&
				parsed.every((item) => typeof item === "string")
			) {
				return parsed;
			}
		} catch {
			// If JSON parsing fails, treat as single string
		}
	}

	// Fallback: treat as single string
	return [times];
}

function parseTimestamps(
	times: string | string[] | undefined,
	timezone?: string,
	fieldName: string = "time",
	allowInvalidForPairwise: boolean = false,
): ParseResult<DateTime[]> {
	const timesArray = safelyParseTimeArray(times);
	const parsedTimes: DateTime[] = [];
	const invalidTimes: string[] = [];

	for (const timeStr of timesArray) {
		// Check for timezone indicators: Z, +, or - after the time part
		const hasTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(timeStr);
		let dt: DateTime;

		if (timezone && !hasTimezone) {
			dt = DateTime.fromISO(timeStr, { zone: timezone });
		} else {
			dt = DateTime.fromISO(timeStr);
			// Apply timezone conversion if specified and time has timezone info
			if (timezone) {
				dt = dt.setZone(timezone);
			}
		}

		if (!dt.isValid) {
			invalidTimes.push(`${timeStr} (${dt.invalidReason})`);
		}

		// Always add to parsed times (invalid ones will be handled gracefully by callers)
		parsedTimes.push(dt);
	}

	// For pairwise operations, allow invalid timestamps to pass through
	// Individual pairs will handle errors gracefully in _executePairwise
	if (allowInvalidForPairwise && invalidTimes.length > 0) {
		return {
			success: true,
			data: parsedTimes, // Include invalid DateTime objects
		};
	}

	// For non-pairwise operations, fail if any timestamps are invalid
	if (invalidTimes.length > 0) {
		return {
			success: false,
			error: `Invalid ${fieldName} format(s): ${invalidTimes.join(", ")}`,
		};
	}

	return {
		success: true,
		data: parsedTimes,
	};
}

interface DurationObject {
	years?: number;
	months?: number;
	days?: number;
	hours?: number;
	minutes?: number;
	seconds?: number;
}

function applyDuration(
	timestamps: DateTime[],
	duration: DurationObject,
	operation: "add" | "subtract",
): OperationResult<DateTime[]> {
	const results: DateTime[] = [];
	const errors: string[] = [];

	for (let i = 0; i < timestamps.length; i++) {
		const timestamp = timestamps[i];
		if (!timestamp || !timestamp.isValid) {
			errors.push(
				`Timestamp at index ${i} is invalid: ${timestamp?.invalidReason || "undefined timestamp"}`,
			);
			continue;
		}

		const resultTime =
			operation === "add"
				? timestamp.plus(duration)
				: timestamp.minus(duration);

		if (!resultTime.isValid) {
			errors.push(
				`Invalid result from ${operation} at index ${i}: ${resultTime.invalidReason}`,
			);
			continue;
		}

		results.push(resultTime);
	}

	if (errors.length > 0) {
		return {
			success: false,
			error: errors.join("; "),
		};
	}

	return {
		success: true,
		data: results,
	};
}

interface ResultFormat {
	count: number;
	results: string[];
	timezone: string;
}

interface StatsResult {
	input_analysis: {
		base_time_count: number;
		compare_time_count: number;
	};
	timestamp_analysis?: {
		earliest: string;
		latest: string;
		total_span_ms: number;
		total_span_human: string;
		mean_timestamp: string;
		median_timestamp: string;
		std_deviation_ms: number;
	};
	interval_analysis?: {
		interval_count: number;
		mean_interval_ms: number;
		mean_interval_human: string;
		min_interval_ms: number;
		max_interval_ms: number;
		total_intervals_span_ms: number;
	};
	duration_analysis?: {
		pair_count: number;
		min_duration_ms: number;
		min_duration_human: string;
		max_duration_ms: number;
		max_duration_human: string;
		mean_duration_ms: number;
		mean_duration_human: string;
		median_duration_ms: number;
		median_duration_human: string;
		std_deviation_ms: number;
		total_duration_ms: number;
	};
}

function formatResults(
	timestamps: DateTime[],
	returnSingle: boolean = false,
): string | ResultFormat {
	const resultISOs = timestamps.map((dt) => dt.toISO() || "");

	if (returnSingle && timestamps.length === 1) {
		return resultISOs[0] || "";
	}

	return {
		count: timestamps.length,
		results: resultISOs,
		timezone: timestamps[0]?.zoneName || "unknown",
	};
}

// Reusable interaction mode functions for complex operations
type OperationFunction = (baseTime: DateTime, compareTime: DateTime) => unknown;

function _executePairwise(
	baseTimes: DateTime[],
	compareTimes: DateTime[],
	operation: OperationFunction,
): unknown[] {
	const results: unknown[] = [];
	const minLength = Math.min(baseTimes.length, compareTimes.length);

	for (let i = 0; i < minLength; i++) {
		const baseTime = baseTimes[i];
		const compareTime = compareTimes[i];

		if (baseTime && compareTime) {
			try {
				if (!baseTime.isValid) {
					throw new Error(
						`Invalid base_time at index ${i}: ${baseTime.invalidReason}`,
					);
				}
				if (!compareTime.isValid) {
					throw new Error(
						`Invalid compare_time at index ${i}: ${compareTime.invalidReason}`,
					);
				}

				const result = operation(baseTime, compareTime);
				results.push(result);
			} catch (error) {
				results.push({
					error:
						error instanceof Error
							? error.message
							: "Unknown calculation error",
					index: i,
					base_time: baseTime.toISO() || "Invalid DateTime",
					compare_time: compareTime.toISO() || "Invalid DateTime",
				});
			}
		} else {
			results.push({
				error: "Missing timestamp",
				index: i,
				base_time: baseTime?.toISO() || "undefined",
				compare_time: compareTime?.toISO() || "undefined",
			});
		}
	}

	return results;
}

function _executeCrossProduct(
	baseTimes: DateTime[],
	compareTimes: DateTime[],
	operation: OperationFunction,
): unknown[] {
	const results: unknown[] = [];

	for (const baseTime of baseTimes) {
		for (const compareTime of compareTimes) {
			const result = operation(baseTime, compareTime);
			results.push(result);
		}
	}

	return results;
}

function _executeSingleToMany(
	baseTimes: DateTime[],
	compareTimes: DateTime[],
	operation: OperationFunction,
): unknown[] {
	const results: unknown[] = [];
	const baseTime = baseTimes[0];

	if (baseTime) {
		for (const compareTime of compareTimes) {
			const result = operation(baseTime, compareTime);
			results.push(result);
		}
	}

	return results;
}

function _executeManyToSingle(
	baseTimes: DateTime[],
	compareTimes: DateTime[],
	operation: OperationFunction,
): unknown[] {
	const results: unknown[] = [];
	const compareTime = compareTimes[0];

	if (compareTime) {
		for (const baseTime of baseTimes) {
			const result = operation(baseTime, compareTime);
			results.push(result);
		}
	}

	return results;
}

export const TimeCalculatorSchema = z.object({
	operation: z
		.enum(["add", "subtract", "diff", "duration_between", "stats", "sort"])
		.describe("Type of calculation to perform"),
	interaction_mode: z
		.enum([
			"auto_detect",
			"single_to_many",
			"many_to_single",
			"pairwise",
			"cross_product",
			"aggregate",
		])
		.optional()
		.describe(
			"How base_time and compare_time arrays interact. 'auto_detect' handles single-to-single, single-to-many, many-to-single automatically. Defaults to 'auto_detect'",
		),
	base_time: z
		.union([z.string(), z.array(z.string()).min(1)])
		.optional()
		.describe(
			"Base ISO datetime(s). Single string or array. Defaults to current time if not provided",
		),
	compare_time: z
		.union([z.string(), z.array(z.string()).min(1)])
		.optional()
		.describe(
			"Compare ISO datetime(s) for diff/duration_between operations. Single string or array",
		),
	timezone: z
		.string()
		.optional()
		.describe("Timezone for base_time (e.g., 'America/New_York')"),
	compare_time_timezone: z
		.string()
		.optional()
		.describe(
			"Timezone for compare_time. If not provided, base_time timezone is used",
		),
	years: z.number().optional().describe("Years to add/subtract"),
	months: z.number().optional().describe("Months to add/subtract"),
	days: z.number().optional().describe("Days to add/subtract"),
	hours: z.number().optional().describe("Hours to add/subtract"),
	minutes: z.number().optional().describe("Minutes to add/subtract"),
	seconds: z.number().optional().describe("Seconds to add/subtract"),
});

export const timeCalculatorTool: Tool = {
	name: "TIME CALCULATOR",
	description:
		"Perform time arithmetic operations including duration calculations, date math, interval operations, statistical analysis, and sorting. Use for adding/subtracting time periods, calculating differences between dates, analyzing time-based datasets, or sorting arrays of timestamps.",
	inputSchema: {
		type: "object",
		properties: {
			operation: {
				type: "string",
				enum: ["add", "subtract", "diff", "duration_between", "stats", "sort"],
				description: "Type of calculation to perform",
			},
			interaction_mode: {
				type: "string",
				enum: [
					"auto_detect",
					"single_to_many",
					"many_to_single",
					"pairwise",
					"cross_product",
					"aggregate",
				],
				description:
					"How base_time and compare_time arrays interact. 'auto_detect' handles single-to-single, single-to-many, many-to-single automatically. Defaults to 'auto_detect'",
			},
			base_time: {
				oneOf: [
					{ type: "string" },
					{ type: "array", items: { type: "string" }, minItems: 1 },
				],
				description:
					"Base ISO datetime(s). Single string or array. Defaults to current time if not provided",
			},
			compare_time: {
				oneOf: [
					{ type: "string" },
					{ type: "array", items: { type: "string" }, minItems: 1 },
				],
				description:
					"Compare ISO datetime(s) for diff/duration_between operations. Single string or array",
			},
			timezone: {
				type: "string",
				description: "Timezone for base_time (e.g., 'America/New_York')",
			},
			compare_time_timezone: {
				type: "string",
				description:
					"Timezone for compare_time. If not provided, base_time timezone is used",
			},
			years: {
				type: "number",
				description: "Years to add/subtract",
			},
			months: {
				type: "number",
				description: "Months to add/subtract",
			},
			days: {
				type: "number",
				description: "Days to add/subtract",
			},
			hours: {
				type: "number",
				description: "Hours to add/subtract",
			},
			minutes: {
				type: "number",
				description: "Minutes to add/subtract",
			},
			seconds: {
				type: "number",
				description: "Seconds to add/subtract",
			},
		},
		required: ["operation"],
		additionalProperties: false,
		examples: [
			{
				description: "Add 5 days and 3 hours to a specific time",
				value: {
					operation: "add",
					base_time: "2024-12-25T10:00:00Z",
					days: 5,
					hours: 3,
				},
			},
			{
				description: "Calculate difference between two dates",
				value: {
					operation: "diff",
					base_time: "2024-01-01T00:00:00Z",
					compare_time: "2024-12-25T15:30:00Z",
				},
			},
			{
				description: "Multi-timezone duration calculation",
				value: {
					operation: "duration_between",
					base_time: "2024-12-25T09:00:00",
					timezone: "America/New_York",
					compare_time: "2024-12-25T18:00:00",
					compare_time_timezone: "Europe/London",
				},
			},
			{
				description: "Subtract 2 months from current time",
				value: {
					operation: "subtract",
					months: 2,
					timezone: "America/New_York",
				},
			},
			{
				description: "Compare one base time to multiple compare times",
				value: {
					operation: "diff",
					base_time: "2024-01-01T00:00:00Z",
					compare_time: [
						"2024-01-15T12:00:00Z",
						"2024-02-01T08:30:00Z",
						"2024-03-01T16:45:00Z",
					],
				},
			},
			{
				description: "Pairwise comparison of time arrays",
				value: {
					operation: "duration_between",
					interaction_mode: "pairwise",
					base_time: ["2024-01-01T09:00:00Z", "2024-02-01T10:00:00Z"],
					compare_time: ["2024-01-01T17:30:00Z", "2024-02-01T18:45:00Z"],
				},
			},
			{
				description: "Statistical analysis of time intervals",
				value: {
					operation: "stats",
					base_time: [
						"2024-01-01T08:00:00Z",
						"2024-01-02T09:15:00Z",
						"2024-01-03T07:45:00Z",
						"2024-01-04T08:30:00Z",
					],
					compare_time: [
						"2024-01-01T17:00:00Z",
						"2024-01-02T18:30:00Z",
						"2024-01-03T16:15:00Z",
						"2024-01-04T17:45:00Z",
					],
				},
			},
			{
				description: "Sort array of timestamps chronologically",
				value: {
					operation: "sort",
					base_time: [
						"2024-03-15T10:30:00Z",
						"2024-01-01T08:00:00Z",
						"2024-02-14T14:45:00Z",
						"2024-01-15T09:30:00Z",
					],
				},
			},
		],
	},
};

export async function handleTimeCalculator(args: unknown) {
	// Validate and parse arguments with Zod
	const parseResult = TimeCalculatorSchema.safeParse(args);

	if (!parseResult.success) {
		return createErrorResponse(
			"unknown",
			`Invalid arguments: ${parseResult.error.message}`,
		);
	}

	const validatedArgs = parseResult.data;

	// Plan and validate operations before processing
	const planResult = planOperations(
		validatedArgs.base_time,
		validatedArgs.compare_time,
		validatedArgs.interaction_mode || "auto_detect",
	);

	if (!planResult.success) {
		return createErrorResponse(validatedArgs.operation, planResult.error);
	}

	const plan = planResult.data;

	// Parse base times using utility function
	const isPairwise = plan.interaction_mode === "pairwise";
	const baseTimesResult = parseTimestamps(
		validatedArgs.base_time,
		validatedArgs.timezone,
		"base_time",
		isPairwise,
	);

	// For non-pairwise operations, fail if any timestamps are invalid
	if (!baseTimesResult.success) {
		return createErrorResponse(validatedArgs.operation, baseTimesResult.error);
	}

	const baseTimes = baseTimesResult.data;

	interface CalculationResult {
		operation: string;
		interaction_mode: string;
		input: {
			base_time: string | string[];
			compare_time?: string | string[];
			duration?: DurationObject;
		};
		result: unknown;
		result_timezone?: string;
		metadata?: {
			calculation_time: string;
			calculation_timezone: string;
		};
	}

	const result: CalculationResult = {
		operation: validatedArgs.operation,
		interaction_mode: plan.interaction_mode,
		input: {
			base_time:
				baseTimes.length === 1
					? baseTimes[0]?.toISO() || (validatedArgs.base_time as string) || ""
					: baseTimes.map((dt, _i) => {
							// Try to get ISO string from parsed DateTime first
							const isoString = dt?.toISO();
							if (isoString) {
								return isoString;
							}
							// If parsing failed, return a placeholder
							return "Invalid timestamp";
						}),
		},
		result: null,
	};

	switch (validatedArgs.operation) {
		case "add":
		case "subtract": {
			// Calculate operation count for add/subtract: sum of both array lengths
			let operationCount = baseTimes.length;
			if (validatedArgs.compare_time) {
				const compareTimes = safelyParseTimeArray(validatedArgs.compare_time);
				operationCount += compareTimes.length;
			}

			// Enforce maximum operations
			if (operationCount > MAX_OPERATIONS) {
				return createErrorResponse(
					validatedArgs.operation,
					`Operation count (${operationCount}) exceeds maximum allowed (${MAX_OPERATIONS}) for ${validatedArgs.operation} operation`,
				);
			}

			// Build duration object from provided values
			const duration: DurationObject = {};
			if (validatedArgs.years !== undefined)
				duration.years = validatedArgs.years;
			if (validatedArgs.months !== undefined)
				duration.months = validatedArgs.months;
			if (validatedArgs.days !== undefined) duration.days = validatedArgs.days;
			if (validatedArgs.hours !== undefined)
				duration.hours = validatedArgs.hours;
			if (validatedArgs.minutes !== undefined)
				duration.minutes = validatedArgs.minutes;
			if (validatedArgs.seconds !== undefined)
				duration.seconds = validatedArgs.seconds;

			if (Object.keys(duration).length === 0) {
				return createErrorResponse(
					validatedArgs.operation,
					`No duration specified for ${validatedArgs.operation} operation`,
				);
			}

			// Apply duration to base times
			const baseResults = applyDuration(
				baseTimes,
				duration,
				validatedArgs.operation,
			);

			if (!baseResults.success) {
				return createErrorResponse(validatedArgs.operation, baseResults.error);
			}

			// Handle compare_time if provided
			let compareResults: DateTime[] | undefined;
			if (validatedArgs.compare_time) {
				const compareTimesResult = parseTimestamps(
					validatedArgs.compare_time,
					validatedArgs.compare_time_timezone || validatedArgs.timezone,
					"compare_time",
				);

				if (!compareTimesResult.success) {
					return createErrorResponse(
						validatedArgs.operation,
						compareTimesResult.error,
					);
				}

				const compareDurationResult = applyDuration(
					compareTimesResult.data,
					duration,
					validatedArgs.operation,
				);

				if (!compareDurationResult.success) {
					return createErrorResponse(
						validatedArgs.operation,
						compareDurationResult.error,
					);
				}

				compareResults = compareDurationResult.data;

				// Update input to include compare_time
				result.input.compare_time =
					compareTimesResult.data.length === 1
						? compareTimesResult.data[0]?.toISO() || ""
						: compareTimesResult.data.map((dt) => dt.toISO() || "Invalid timestamp");
			}

			result.input.duration = duration;

			// Format results based on whether compare_time is provided
			if (compareResults) {
				// Both base and compare provided - return structured output
				result.result = {
					base_results: formatResults(baseResults.data, false),
					compare_results: formatResults(compareResults, false),
				};
			} else {
				// Only base_time provided - return simple format (maintain backward compatibility)
				const shouldReturnSingle = baseTimes.length === 1;
				if (shouldReturnSingle) {
					result.result = formatResults(baseResults.data, true);
					// Always show result_timezone for single results since metadata is hidden in normal mode
					result.result_timezone = baseResults.data[0]?.zoneName || "unknown";
				} else {
					result.result = formatResults(baseResults.data, false);
				}
			}
			break;
		}

		case "diff":
		case "duration_between": {
			if (!validatedArgs.compare_time) {
				return createErrorResponse(
					validatedArgs.operation,
					`compare_time is required for ${validatedArgs.operation} operation`,
				);
			}

			const compareTimezone =
				validatedArgs.compare_time_timezone || validatedArgs.timezone;

			// Parse compare times using utility function
			const compareTimesResult = parseTimestamps(
				validatedArgs.compare_time,
				compareTimezone,
				"compare_time",
				isPairwise,
			);

			// For non-pairwise operations, fail if any timestamps are invalid
			if (!compareTimesResult.success) {
				return createErrorResponse(
					validatedArgs.operation,
					compareTimesResult.error,
				);
			}

			const compareTimes = compareTimesResult.data;

			// Update input to show the compare times properly
			result.input.compare_time =
				compareTimes.length === 1
					? compareTimes[0]?.toISO() ||
						(validatedArgs.compare_time as string) ||
						""
					: compareTimes.map((dt, _i) => {
							// Try to get ISO string from parsed DateTime first
							const isoString = dt?.toISO();
							if (isoString) {
								return isoString;
							}
							// If parsing failed, return a placeholder
							return "Invalid timestamp";
						});

			// Handle different interaction modes for batch operations
			const diffOperation = (baseTime: DateTime, compareTime: DateTime) => {
				const diff = compareTime.diff(baseTime, [
					"years",
					"months",
					"days",
					"hours",
					"minutes",
					"seconds",
					"milliseconds",
				]);

				const totalMs = compareTime.diff(baseTime).as("milliseconds");

				if (validatedArgs.operation === "diff") {
					// Decomposed time units that add up to the total time difference
					return {
						days: Math.floor(diff.days),
						hours: Math.floor(diff.hours),
						minutes: Math.floor(diff.minutes),
						seconds: Math.floor(diff.seconds),
						milliseconds: Math.floor(diff.milliseconds),
						total_milliseconds: totalMs,
					};
				} else {
					// Detailed duration breakdown with years/months
					return {
						years: Math.floor(diff.years),
						months: Math.floor(diff.months),
						days: Math.floor(diff.days),
						hours: Math.floor(diff.hours),
						minutes: Math.floor(diff.minutes),
						seconds: Math.floor(diff.seconds),
						milliseconds: Math.floor(diff.milliseconds),
						total_milliseconds: totalMs,
						human_readable: diff.toHuman(),
					};
				}
			};

			// Execute based on interaction mode
			let diffResults: unknown[] = [];

			switch (plan.interaction_mode) {
				case "single_to_single":
					if (baseTimes[0] && compareTimes[0]) {
						diffResults = [diffOperation(baseTimes[0], compareTimes[0])];
					}
					break;
				case "single_to_many":
					diffResults = _executeSingleToMany(
						baseTimes,
						compareTimes,
						diffOperation,
					);
					break;
				case "many_to_single":
					diffResults = _executeManyToSingle(
						baseTimes,
						compareTimes,
						diffOperation,
					);
					break;
				case "pairwise":
					diffResults = _executePairwise(
						baseTimes,
						compareTimes,
						diffOperation,
					);
					break;
				case "cross_product":
					diffResults = _executeCrossProduct(
						baseTimes,
						compareTimes,
						diffOperation,
					);
					break;
				default:
					// Fallback to pairwise
					diffResults = _executePairwise(
						baseTimes,
						compareTimes,
						diffOperation,
					);
					break;
			}

			// Format result based on count
			if (diffResults.length === 1) {
				result.result = diffResults[0];
			} else {
				const batchResult: {
					count: number;
					results: unknown[];
					interaction_mode: string;
				} = {
					count: diffResults.length,
					results: diffResults,
					interaction_mode: plan.interaction_mode,
				};

				result.result = batchResult;
			}
			break;
		}

		case "stats": {
			// Stats operation requires arrays of times for meaningful analysis
			if (!validatedArgs.base_time) {
				throw new Error("stats operation requires base_time");
			}

			const baseTimes = safelyParseTimeArray(validatedArgs.base_time);
			if (baseTimes.length < 2) {
				throw new Error("stats operation requires at least 2 timestamps");
			}
			const compareTimes = validatedArgs.compare_time
				? safelyParseTimeArray(validatedArgs.compare_time)
				: undefined;

			// Parse all base times
			const baseTimestamps: number[] = [];
			const parseTimezone = validatedArgs.timezone;

			for (const timeStr of baseTimes) {
				const hasTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(timeStr);
				let dt: DateTime;
				if (parseTimezone && !hasTimezone) {
					dt = DateTime.fromISO(timeStr, { zone: parseTimezone });
				} else {
					dt = DateTime.fromISO(timeStr);
					if (parseTimezone) dt = dt.setZone(parseTimezone);
				}
				if (!dt.isValid) {
					throw new Error(`Invalid time format in base_time: ${timeStr}`);
				}
				baseTimestamps.push(dt.toMillis());
			}

			const stats: StatsResult = {
				input_analysis: {
					base_time_count: baseTimes.length,
					compare_time_count: compareTimes?.length || 0,
				},
			};

			// If only base_time is provided, analyze the timestamps themselves
			if (!compareTimes || compareTimes.length === 0) {
				if (baseTimestamps.length === 0) {
					throw new Error("No valid timestamps found in base_time");
				}

				const sorted = [...baseTimestamps].sort((a, b) => a - b);
				const min = sorted[0];
				const max = sorted[sorted.length - 1];

				if (min === undefined || max === undefined) {
					throw new Error("Invalid timestamp data for stats calculation");
				}

				const mean =
					baseTimestamps.reduce((sum, val) => sum + val, 0) /
					baseTimestamps.length;

				// Calculate median
				const mid = Math.floor(sorted.length / 2);
				const median =
					sorted.length % 2 === 0
						? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
						: (sorted[mid] ?? 0);

				// Calculate standard deviation
				const variance =
					baseTimestamps.reduce((sum, val) => sum + (val - mean) ** 2, 0) /
					baseTimestamps.length;
				const stdDev = Math.sqrt(variance);

				// Calculate intervals between consecutive timestamps
				const intervals: number[] = [];
				for (let i = 1; i < sorted.length; i++) {
					const current = sorted[i];
					const previous = sorted[i - 1];
					if (current !== undefined && previous !== undefined) {
						intervals.push(current - previous);
					}
				}

				stats.timestamp_analysis = {
					earliest: DateTime.fromMillis(min).toISO() ?? "Invalid Date",
					latest: DateTime.fromMillis(max).toISO() ?? "Invalid Date",
					total_span_ms: max - min,
					total_span_human: formatDuration(max - min),
					mean_timestamp: DateTime.fromMillis(mean).toISO() ?? "Invalid Date",
					median_timestamp:
						DateTime.fromMillis(median).toISO() ?? "Invalid Date",
					std_deviation_ms: Math.round(stdDev),
				};

				if (intervals.length > 0) {
					const intervalMean =
						intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
					const intervalMin = Math.min(...intervals);
					const intervalMax = Math.max(...intervals);

					stats.interval_analysis = {
						interval_count: intervals.length,
						mean_interval_ms: Math.round(intervalMean),
						mean_interval_human: formatDuration(Math.round(intervalMean)),
						min_interval_ms: intervalMin,
						max_interval_ms: intervalMax,
						total_intervals_span_ms: intervals.reduce(
							(sum, val) => sum + val,
							0,
						),
					};
				}
			} else {
				// If both base_time and compare_time are provided, analyze durations
				const durations: number[] = [];
				const minLength = Math.min(baseTimes.length, compareTimes.length);

				const compareTimezone =
					validatedArgs.compare_time_timezone || validatedArgs.timezone;

				for (let i = 0; i < minLength; i++) {
					const baseTimeStr = baseTimes[i];
					const compareTimeStr = compareTimes[i];

					if (!baseTimeStr || !compareTimeStr) {
						continue;
					}

					// Parse base time
					const hasBaseTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(baseTimeStr);
					let baseTime: DateTime;
					if (parseTimezone && !hasBaseTimezone) {
						baseTime = DateTime.fromISO(baseTimeStr, { zone: parseTimezone });
					} else {
						baseTime = DateTime.fromISO(baseTimeStr);
						if (parseTimezone) baseTime = baseTime.setZone(parseTimezone);
					}

					// Parse compare time
					const hasCompareTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(
						compareTimeStr,
					);
					let compareTime: DateTime;
					if (compareTimezone && !hasCompareTimezone) {
						compareTime = DateTime.fromISO(compareTimeStr, {
							zone: compareTimezone,
						});
					} else {
						compareTime = DateTime.fromISO(compareTimeStr);
						if (compareTimezone)
							compareTime = compareTime.setZone(compareTimezone);
					}

					if (!baseTime.isValid) {
						throw new Error(
							`Invalid base_time format at index ${i}: ${baseTimeStr}`,
						);
					}
					if (!compareTime.isValid) {
						throw new Error(
							`Invalid compare_time format at index ${i}: ${compareTimeStr}`,
						);
					}

					const duration = compareTime.diff(baseTime).milliseconds;
					durations.push(duration);
				}

				// Calculate duration statistics
				if (durations.length === 0) {
					throw new Error("No valid duration pairs found");
				}

				const sortedDurations = [...durations].sort((a, b) => a - b);
				const minDuration = sortedDurations[0];
				const maxDuration = sortedDurations[sortedDurations.length - 1];

				if (minDuration === undefined || maxDuration === undefined) {
					throw new Error("Invalid duration data for stats calculation");
				}

				const meanDuration =
					durations.reduce((sum, val) => sum + val, 0) / durations.length;

				const mid = Math.floor(sortedDurations.length / 2);
				const medianDuration =
					sortedDurations.length % 2 === 0
						? ((sortedDurations[mid - 1] ?? 0) + (sortedDurations[mid] ?? 0)) /
							2
						: (sortedDurations[mid] ?? 0);

				const varianceDuration =
					durations.reduce((sum, val) => sum + (val - meanDuration) ** 2, 0) /
					durations.length;
				const stdDevDuration = Math.sqrt(varianceDuration);

				stats.duration_analysis = {
					pair_count: minLength,
					min_duration_ms: minDuration,
					min_duration_human: formatDuration(minDuration),
					max_duration_ms: maxDuration,
					max_duration_human: formatDuration(maxDuration),
					mean_duration_ms: Math.round(meanDuration),
					mean_duration_human: formatDuration(Math.round(meanDuration)),
					median_duration_ms: Math.round(medianDuration),
					median_duration_human: formatDuration(Math.round(medianDuration)),
					std_deviation_ms: Math.round(stdDevDuration),
					total_duration_ms: durations.reduce((sum, val) => sum + val, 0),
				};
			}

			result.input.base_time = validatedArgs.base_time;
			if (compareTimes) {
				result.input.compare_time = compareTimes;
			}
			result.result = stats;
			break;
		}

		case "sort": {
			// Sort operation requires arrays of times
			if (!validatedArgs.base_time) {
				throw new Error("sort operation requires base_time");
			}

			const baseTimes = safelyParseTimeArray(validatedArgs.base_time);
			if (baseTimes.length < 2) {
				throw new Error("sort operation requires at least 2 timestamps");
			}
			const parseTimezone = validatedArgs.timezone;

			// Parse all timestamps and create sortable objects
			interface SortableTime {
				original: string;
				timestamp: number;
				parsed: DateTime;
			}

			const sortableItems: SortableTime[] = [];

			for (const timeStr of baseTimes) {
				const hasTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(timeStr);
				let dt: DateTime;
				if (parseTimezone && !hasTimezone) {
					dt = DateTime.fromISO(timeStr, { zone: parseTimezone });
				} else {
					dt = DateTime.fromISO(timeStr);
					if (parseTimezone) dt = dt.setZone(parseTimezone);
				}

				if (!dt.isValid) {
					throw new Error(
						`Invalid time format in base_time: ${timeStr} - ${dt.invalidReason}`,
					);
				}

				sortableItems.push({
					original: timeStr,
					timestamp: dt.toMillis(),
					parsed: dt,
				});
			}

			// Sort by timestamp (chronological order)
			sortableItems.sort((a, b) => a.timestamp - b.timestamp);

			// Extract sorted results
			const sortedOriginal = sortableItems.map((item) => item.original);
			const sortedISO = sortableItems.map((item) => item.parsed.toISO());
			const sortedTimestamps = sortableItems.map((item) => item.timestamp);

			// Calculate some useful metadata about the sort
			const earliest = sortableItems[0];
			const latest = sortableItems[sortableItems.length - 1];

			if (!earliest || !latest) {
				throw new Error("Invalid sortable items for metadata calculation");
			}

			const totalSpan = latest.timestamp - earliest.timestamp;

			const sortResult = {
				input_count: baseTimes.length,
				sorted_original_format: sortedOriginal,
				sorted_iso_format: sortedISO,
				sorted_timestamps: sortedTimestamps,
				sort_metadata: {
					earliest_time: earliest.parsed.toISO(),
					latest_time: latest.parsed.toISO(),
					total_span_ms: totalSpan,
					total_span_human: formatDuration(totalSpan),
					timezone_used: parseTimezone || "system",
				},
			};

			result.input.base_time = validatedArgs.base_time;
			result.result = sortResult;
			break;
		}

		default:
			return createErrorResponse(
				validatedArgs.operation,
				`Unsupported operation: ${validatedArgs.operation}`,
			);
	}

	// Set metadata for successful response only if debug mode is enabled
	if (configManager.isDebugMode()) {
		result.metadata = {
			calculation_time: DateTime.now().toISO() || "",
			calculation_timezone: DateTime.now().zoneName || "system",
		};
	}

	// Return the CalculationResult directly for backward compatibility
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(result, null, 2),
			},
		],
	};
}
