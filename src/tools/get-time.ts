import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { DateTime } from "luxon";
import { z } from "zod";

export const GetTimeSchema = z.object({
	datetime: z
		.string()
		.optional()
		.describe(
			"Optional. ISO datetime string (e.g., '2024-12-25T15:00:00'). If not provided, current time is used",
		),
	timezones: z
		.array(z.string())
		.optional()
		.describe(
			"List of timezone names (e.g., ['America/New_York', 'Asia/Tokyo'])",
		),
	formats: z
		.array(
			z.enum([
				"iso",
				"rfc2822",
				"sql",
				"local",
				"localeString",
				"short",
				"medium",
				"long",
				"full",
			]),
		)
		.optional()
		.describe(
			"List of output formats for the base datetime only (not applied to individual timezones)",
		),
	locale: z
		.string()
		.optional()
		.describe("Locale for formatting (e.g., 'en-US', 'fr-FR')"),
	includeOffsets: z
		.boolean()
		.default(false)
		.describe("Include UTC offsets (+09:00, -04:00)"),
	comparisons: z
		.array(z.string())
		.optional()
		.describe(
			"List of ISO datetime strings to compare with the base time (e.g., ['2024-12-25T10:00:00', '2024-12-26T15:30:00'])",
		),
});

export const getTimeTool: Tool = {
	name: "MAGIC TIME SPHERE",
	description:
		"Get current time or compare/convert times across timezones with flexible formatting. Defaults to current time in system timezone when no parameters provided. Use timezones array to get multiple zones, formats array for multiple output formats, and comparison input datetimes for relative time analysis.",
	inputSchema: {
		type: "object",
		properties: {
			datetime: {
				type: "string",
				description:
					"Optional. ISO datetime string (e.g., '2024-12-25T15:00:00'). If not provided, current time is used.",
			},
			timezones: {
				type: "array",
				items: { type: "string" },
				description:
					"List of timezone names to include in output. Examples: ['America/New_York', 'Asia/Tokyo', 'Europe/London']",
			},
			formats: {
				type: "array",
				items: {
					type: "string",
					enum: [
						"iso",
						"rfc2822",
						"sql",
						"local",
						"localeString",
						"short",
						"medium",
						"long",
						"full",
					],
				},
				description:
					"Output formats for the base datetime only (not applied to individual timezones). Creates separate entries for each format.",
			},
			locale: {
				type: "string",
				description:
					"Locale for formatting (e.g., 'en-US', 'fr-FR', 'ja-JP'). Affects localeString and relative formats.",
			},
			includeOffsets: {
				type: "boolean",
				default: false,
				description: "Include UTC offsets like +09:00, -04:00 in output",
			},
			comparisons: {
				type: "array",
				items: { type: "string" },
				description:
					"List of ISO datetime strings to compare with the base time. Examples: ['2024-12-25T10:00:00', '2024-12-26T15:30:00']",
			},
		},
		additionalProperties: false,
		examples: [
			{
				description: "Get current time (no parameters)",
				value: {},
			},
			{
				description: "Get time in multiple timezones",
				value: {
					timezones: ["America/New_York", "Asia/Tokyo", "Europe/London"],
				},
			},
			{
				description:
					"Convert specific time with multiple formats and compare other datetimes",
				value: {
					datetime: "2024-12-25T15:00:00",
					timezones: ["America/Los_Angeles", "Asia/Tokyo"],
					formats: ["iso", "localeString"],
					comparisons: ["2024-12-25T10:00:00", "2024-12-26T08:00:00"],
					includeOffsets: true,
				},
			},
		],
	},
};

export async function handleGetTime(args: any) {
	// Validate and parse arguments with Zod
	const parseResult = GetTimeSchema.safeParse(args);

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

	// Determine base time - use provided datetime or current time
	let baseTime: DateTime;
	try {
		if (validatedArgs.datetime) {
			baseTime = DateTime.fromISO(validatedArgs.datetime);
			// Check if the DateTime is valid
			if (!baseTime.isValid) {
				throw new Error(
					`Invalid datetime format: ${validatedArgs.datetime} - ${baseTime.invalidReason}`,
				);
			}
		} else {
			baseTime = DateTime.now();
		}
	} catch (error) {
		return {
			content: [
				{
					type: "text" as const,
					text: `Error parsing datetime: ${error instanceof Error ? error.message : "Unknown error"}`,
				},
			],
		};
	}

	const result: any = {
		baseTime: baseTime.toISO(),
	};

	// Add timezone conversions
	if (validatedArgs.timezones) {
		for (const timezone of validatedArgs.timezones) {
			try {
				const convertedTime = baseTime.setZone(timezone);
				if (!convertedTime.isValid) {
					result[timezone] = `Invalid timezone: ${timezone}`;
				} else {
					// Include offset if requested
					if (validatedArgs.includeOffsets) {
						result[timezone] = convertedTime.toISO();
					} else {
						result[timezone] = convertedTime.toISO({ includeOffset: false });
					}
				}
			} catch (error) {
				result[timezone] =
					`Error converting to ${timezone}: ${error instanceof Error ? error.message : "Unknown error"}`;
			}
		}
	}

	// TODO: Add format conversions
	if (validatedArgs.formats) {
		// Will add format handling later
	}

	// TODO: Add comparisons
	if (validatedArgs.comparisons && validatedArgs.comparisons.length > 0) {
		result.comparisons = {};
		for (const datetime of validatedArgs.comparisons) {
			result.comparisons[datetime] = `TODO: comparison for ${datetime}`;
		}
	}

	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(result, null, 2),
			},
		],
	};
}
