import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DateTime } from "luxon";
import { z } from "zod";

const MAX_OPERATIONS = 10000;

interface OperationPlan {
	interaction_mode: string;
	operation_count: number;
	base_times: string[];
	compare_times?: string[];
}

function planOperations(
	base_time: string | string[] | undefined,
	compare_time: string | string[] | undefined,
	interaction_mode: string,
): OperationPlan {
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
	} else if (interaction_mode === "pairwise") {
		const minLength = Math.min(baseTimes.length, compareTimes.length);
		finalBaseTimes = baseTimes.slice(0, minLength);
		finalCompareTimes = compareTimes.slice(0, minLength);
		operationCount = minLength;
	} else if (interaction_mode === "cross_product") {
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
		throw new Error(
			`Operation count (${operationCount}) exceeds maximum allowed (${MAX_OPERATIONS}) for interaction mode '${actualMode}'`,
		);
	}

	return {
		interaction_mode: actualMode,
		operation_count: operationCount,
		base_times: finalBaseTimes,
		compare_times: finalCompareTimes,
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
			if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
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
): DateTime[] {
	const timesArray = safelyParseTimeArray(times);

	const parsedTimes: DateTime[] = [];

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
			throw new Error(
				`Invalid ${fieldName} format: ${timeStr} - ${dt.invalidReason}`,
			);
		}

		parsedTimes.push(dt);
	}

	return parsedTimes;
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
): DateTime[] {
	const results: DateTime[] = [];

	for (const timestamp of timestamps) {
		const resultTime =
			operation === "add"
				? timestamp.plus(duration)
				: timestamp.minus(duration);

		if (!resultTime.isValid) {
			throw new Error(
				`Invalid result from ${operation}: ${resultTime.invalidReason}`,
			);
		}

		results.push(resultTime);
	}

	return results;
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
			const result = operation(baseTime, compareTime);
			results.push(result);
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
		.enum(["auto_detect", "pairwise", "cross_product", "aggregate"])
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
				enum: ["auto_detect", "pairwise", "cross_product", "aggregate"],
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
		return {
			content: [
				{
					type: "text" as const,
					text: `Invalid arguments: ${parseResult.error.message}`,
				},
			],
		};
	}

	const validatedArgs = parseResult.data;

	try {
		// Plan and validate operations before processing
		const plan = planOperations(
			validatedArgs.base_time,
			validatedArgs.compare_time,
			validatedArgs.interaction_mode || "auto_detect",
		);

		// Parse base times using utility function
		const baseTimes = parseTimestamps(
			validatedArgs.base_time,
			validatedArgs.timezone,
			"base_time",
		);

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
			metadata: {
				calculation_time: string;
				base_timezone: string;
				compare_timezone: string;
				operation_count: number;
			};
		}

		const result: CalculationResult = {
			operation: validatedArgs.operation,
			interaction_mode: plan.interaction_mode,
			input: {
				base_time:
					baseTimes.length === 1
						? baseTimes[0]?.toISO() || ""
						: baseTimes.map((dt) => dt.toISO() || ""),
			},
			result: null,
			metadata: {
				calculation_time: "",
				base_timezone: "",
				compare_timezone: "",
				operation_count: plan.operation_count,
			},
		};

		switch (validatedArgs.operation) {
			case "add":
			case "subtract": {
				// Build duration object from provided values
				const duration: DurationObject = {};
				if (validatedArgs.years !== undefined)
					duration.years = validatedArgs.years;
				if (validatedArgs.months !== undefined)
					duration.months = validatedArgs.months;
				if (validatedArgs.days !== undefined)
					duration.days = validatedArgs.days;
				if (validatedArgs.hours !== undefined)
					duration.hours = validatedArgs.hours;
				if (validatedArgs.minutes !== undefined)
					duration.minutes = validatedArgs.minutes;
				if (validatedArgs.seconds !== undefined)
					duration.seconds = validatedArgs.seconds;

				if (Object.keys(duration).length === 0) {
					throw new Error(
						`No duration specified for ${validatedArgs.operation} operation`,
					);
				}

				// Apply duration to base times
				const baseResults = applyDuration(
					baseTimes,
					duration,
					validatedArgs.operation,
				);

				// Handle compare_time if provided
				let compareResults: DateTime[] | undefined;
				if (validatedArgs.compare_time) {
					const compareTimes = parseTimestamps(
						validatedArgs.compare_time,
						validatedArgs.compare_time_timezone || validatedArgs.timezone,
						"compare_time",
					);
					compareResults = applyDuration(
						compareTimes,
						duration,
						validatedArgs.operation,
					);

					// Update input to include compare_time
					result.input.compare_time =
						compareTimes.length === 1
							? compareTimes[0]?.toISO() || ""
							: compareTimes.map((dt) => dt.toISO() || "");
				}

				result.input.duration = duration;

				// Format results based on whether compare_time is provided
				if (compareResults) {
					// Both base and compare provided - return structured output
					result.result = {
						base_results: formatResults(baseResults, false),
						compare_results: formatResults(compareResults, false),
					};
				} else {
					// Only base_time provided - return simple format (maintain backward compatibility)
					const shouldReturnSingle = baseTimes.length === 1;
					if (shouldReturnSingle) {
						result.result = formatResults(baseResults, true);
						result.result_timezone = baseResults[0]?.zoneName || "unknown";
					} else {
						result.result = formatResults(baseResults, false);
					}
				}
				break;
			}

			case "diff":
			case "duration_between": {
				if (!validatedArgs.compare_time) {
					throw new Error(
						`compare_time is required for ${validatedArgs.operation} operation`,
					);
				}

				const compareTimezone =
					validatedArgs.compare_time_timezone || validatedArgs.timezone;

				// For now, handle single compare_time (TODO: add array processing)
				const compareTimesArray = safelyParseTimeArray(validatedArgs.compare_time);
				const compareTimeStr = compareTimesArray[0] || "";

				if (!compareTimeStr) {
					throw new Error(
						"compare_time is required when provided as an array but array is empty",
					);
				}

				let compareTime: DateTime;
				// If timezone is specified and compare_time has no timezone info, parse it in that timezone
				// Check for timezone indicators: Z, +, or - after the time part (not in date part)
				const hasCompareTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(
					compareTimeStr,
				);
				if (compareTimezone && !hasCompareTimezone) {
					compareTime = DateTime.fromISO(compareTimeStr, {
						zone: compareTimezone,
					});
				} else {
					compareTime = DateTime.fromISO(compareTimeStr);
					// Apply timezone conversion if specified and time has timezone info
					if (compareTimezone) {
						compareTime = compareTime.setZone(compareTimezone);
					}
				}

				if (!compareTime.isValid) {
					throw new Error(
						`Invalid compare_time format: ${compareTimeStr} - ${compareTime.invalidReason}`,
					);
				}

				const diff = compareTime.diff(baseTimes[0] || DateTime.now(), [
					"years",
					"months",
					"days",
					"hours",
					"minutes",
					"seconds",
					"milliseconds",
				]);

				result.input.compare_time = compareTime.toISO() || "";

				if (validatedArgs.operation === "diff") {
					// Simple diff in milliseconds
					result.result = {
						milliseconds: diff.milliseconds,
						seconds: Math.floor(diff.milliseconds / 1000),
						minutes: Math.floor(diff.milliseconds / (1000 * 60)),
						hours: Math.floor(diff.milliseconds / (1000 * 60 * 60)),
						days: Math.floor(diff.milliseconds / (1000 * 60 * 60 * 24)),
					};
				} else {
					// Detailed duration breakdown
					result.result = {
						years: Math.floor(diff.years),
						months: Math.floor(diff.months),
						days: Math.floor(diff.days),
						hours: Math.floor(diff.hours),
						minutes: Math.floor(diff.minutes),
						seconds: Math.floor(diff.seconds),
						milliseconds: diff.milliseconds,
						total_milliseconds: diff.milliseconds,
						human_readable: diff.toHuman(),
					};
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
						total_span_human: DateTime.fromMillis(max)
							.diff(DateTime.fromMillis(min))
							.toHuman(),
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
							mean_interval_human:
								DateTime.fromMillis(intervalMean).toRelative() ?? "Unknown",
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
							? ((sortedDurations[mid - 1] ?? 0) +
									(sortedDurations[mid] ?? 0)) /
								2
							: (sortedDurations[mid] ?? 0);

					const varianceDuration =
						durations.reduce((sum, val) => sum + (val - meanDuration) ** 2, 0) /
						durations.length;
					const stdDevDuration = Math.sqrt(varianceDuration);

					stats.duration_analysis = {
						pair_count: minLength,
						min_duration_ms: minDuration,
						min_duration_human:
							DateTime.fromMillis(Math.abs(minDuration)).toRelative() ??
							"Unknown",
						max_duration_ms: maxDuration,
						max_duration_human:
							DateTime.fromMillis(Math.abs(maxDuration)).toRelative() ??
							"Unknown",
						mean_duration_ms: Math.round(meanDuration),
						mean_duration_human:
							DateTime.fromMillis(Math.abs(meanDuration)).toRelative() ??
							"Unknown",
						median_duration_ms: Math.round(medianDuration),
						median_duration_human:
							DateTime.fromMillis(Math.abs(medianDuration)).toRelative() ??
							"Unknown",
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
						total_span_human: DateTime.fromMillis(totalSpan).toRelative(),
						timezone_used: parseTimezone || "system",
					},
				};

				result.input.base_time = validatedArgs.base_time;
				result.result = sortResult;
				break;
			}

			default:
				throw new Error(`Unsupported operation: ${validatedArgs.operation}`);
		}

		result.metadata = {
			calculation_time: DateTime.now().toISO() || "",
			base_timezone: validatedArgs.timezone || "system",
			compare_timezone:
				validatedArgs.compare_time_timezone ||
				validatedArgs.timezone ||
				"system",
			operation_count: plan.operation_count,
		};

		return {
			content: [
				{
					type: "text" as const,
					text: JSON.stringify(result, null, 2),
				},
			],
		};
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error in time calculation: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			],
		};
	}
}
