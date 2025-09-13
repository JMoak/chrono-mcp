import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DateTime } from "luxon";
import { z } from "zod";

export const TimeCalculatorSchema = z.object({
	operation: z
		.enum(["add", "subtract", "diff", "duration_between"])
		.describe("Type of calculation to perform"),
	base_time: z
		.string()
		.optional()
		.describe(
			"Base ISO datetime string (e.g., '2024-12-25T15:00:00'). If not provided, current time is used",
		),
	target_time: z
		.string()
		.optional()
		.describe(
			"Target ISO datetime string for diff/duration_between operations",
		),
	timezone: z
		.string()
		.optional()
		.describe("Timezone for base_time (e.g., 'America/New_York')"),
	target_time_timezone: z
		.string()
		.optional()
		.describe(
			"Timezone for target_time. If not provided, base_time timezone is used",
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
		"Perform time arithmetic operations including duration calculations, date math, and interval operations. Use for adding/subtracting time periods or calculating differences between dates.",
	inputSchema: {
		type: "object",
		properties: {
			operation: {
				type: "string",
				enum: ["add", "subtract", "diff", "duration_between"],
				description: "Type of calculation to perform",
			},
			base_time: {
				type: "string",
				description:
					"Base ISO datetime string (e.g., '2024-12-25T15:00:00'). If not provided, current time is used",
			},
			target_time: {
				type: "string",
				description:
					"Target ISO datetime string for diff/duration_between operations",
			},
			timezone: {
				type: "string",
				description: "Timezone for base_time (e.g., 'America/New_York')",
			},
			target_time_timezone: {
				type: "string",
				description:
					"Timezone for target_time. If not provided, base_time timezone is used",
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
					target_time: "2024-12-25T15:30:00Z",
				},
			},
			{
				description: "Multi-timezone duration calculation",
				value: {
					operation: "duration_between",
					base_time: "2024-12-25T09:00:00",
					timezone: "America/New_York",
					target_time: "2024-12-25T18:00:00",
					target_time_timezone: "Europe/London",
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
		// Determine base time
		let baseTime: DateTime;
		if (validatedArgs.base_time) {
			// If timezone is specified and base_time has no timezone info, parse it in that timezone
			// Check for timezone indicators: Z, +, or - after the time part (not in date part)
			const hasTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(
				validatedArgs.base_time,
			);
			if (validatedArgs.timezone && !hasTimezone) {
				baseTime = DateTime.fromISO(validatedArgs.base_time, {
					zone: validatedArgs.timezone,
				});
			} else {
				baseTime = DateTime.fromISO(validatedArgs.base_time);
				// Apply timezone conversion if specified and time has timezone info
				if (validatedArgs.timezone) {
					baseTime = baseTime.setZone(validatedArgs.timezone);
				}
			}
			if (!baseTime.isValid) {
				throw new Error(
					`Invalid base_time format: ${validatedArgs.base_time} - ${baseTime.invalidReason}`,
				);
			}
		} else {
			baseTime = DateTime.now();
			// Apply timezone if specified for current time
			if (validatedArgs.timezone) {
				baseTime = baseTime.setZone(validatedArgs.timezone);
				if (!baseTime.isValid) {
					throw new Error(`Invalid timezone: ${validatedArgs.timezone}`);
				}
			}
		}

		interface CalculationResult {
			operation: string;
			input: {
				base_time: string;
				target_time?: string;
				duration?: Record<string, number>;
			};
			result: unknown;
			result_timezone?: string;
			metadata: {
				calculation_time: string;
				base_timezone: string;
				target_timezone: string;
			};
		}

		const result: CalculationResult = {
			operation: validatedArgs.operation,
			input: {
				base_time: baseTime.toISO() || "",
			},
			result: null,
			metadata: {
				calculation_time: "",
				base_timezone: "",
				target_timezone: "",
			},
		};

		switch (validatedArgs.operation) {
			case "add":
			case "subtract": {
				// Build duration object from provided values
				const duration: Record<string, number> = {};
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

				// Apply the operation
				const resultTime =
					validatedArgs.operation === "add"
						? baseTime.plus(duration)
						: baseTime.minus(duration);

				if (!resultTime.isValid) {
					throw new Error(
						`Invalid result from ${validatedArgs.operation}: ${resultTime.invalidReason}`,
					);
				}

				result.input.duration = duration;
				result.result = resultTime.toISO() || "";
				result.result_timezone = resultTime.zoneName || "unknown";
				break;
			}

			case "diff":
			case "duration_between": {
				if (!validatedArgs.target_time) {
					throw new Error(
						`target_time is required for ${validatedArgs.operation} operation`,
					);
				}

				const targetTimezone =
					validatedArgs.target_time_timezone || validatedArgs.timezone;

				let targetTime: DateTime;
				// If timezone is specified and target_time has no timezone info, parse it in that timezone
				// Check for timezone indicators: Z, +, or - after the time part (not in date part)
				const hasTargetTimezone = /[Z]$|[+-]\d{2}:?\d{2}$/.test(
					validatedArgs.target_time,
				);
				if (targetTimezone && !hasTargetTimezone) {
					targetTime = DateTime.fromISO(validatedArgs.target_time, {
						zone: targetTimezone,
					});
				} else {
					targetTime = DateTime.fromISO(validatedArgs.target_time);
					// Apply timezone conversion if specified and time has timezone info
					if (targetTimezone) {
						targetTime = targetTime.setZone(targetTimezone);
					}
				}

				if (!targetTime.isValid) {
					throw new Error(
						`Invalid target_time format: ${validatedArgs.target_time} - ${targetTime.invalidReason}`,
					);
				}

				const diff = targetTime.diff(baseTime, [
					"years",
					"months",
					"days",
					"hours",
					"minutes",
					"seconds",
					"milliseconds",
				]);

				result.input.target_time = targetTime.toISO() || "";

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

			default:
				throw new Error(`Unsupported operation: ${validatedArgs.operation}`);
		}

		result.metadata = {
			calculation_time: DateTime.now().toISO() || "",
			base_timezone: validatedArgs.timezone || "system",
			target_timezone:
				validatedArgs.target_time_timezone ||
				validatedArgs.timezone ||
				"system",
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
