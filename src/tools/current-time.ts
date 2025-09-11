import { z } from "zod";
import type { ToolSchema } from "@modelcontextprotocol/sdk/types.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { getCurrentTime, formatDateTime } from "../utils/date-utils.js";
import { TimezoneSchema, DateTimeFormatSchema, LocaleSchema } from "../utils/validation.js";

export const CurrentTimeParamsSchema = z
	.object({
		timezone: TimezoneSchema.optional(),
		format: DateTimeFormatSchema,
		locale: LocaleSchema,
	})
	.describe("Get current time in specified timezone and format");

type ToolInput = z.infer<typeof ToolSchema.shape.inputSchema>;

export const currentTimeTool = {
	name: "current_time",
	description: "Get the current date and time in any timezone with various formatting options",
	inputSchema: z.toJSONSchema(CurrentTimeParamsSchema) as ToolInput,
};

export async function handleCurrentTime(params: unknown) {
	const parsed = CurrentTimeParamsSchema.safeParse(params);
	if (!parsed.success) {
		throw new McpError(
			ErrorCode.InvalidParams,
			`Invalid arguments for current_time: ${parsed.error.message}`
		);
	}

	const { timezone, format, locale } = parsed.data;

	try {
		const currentTime = getCurrentTime(timezone);
		const formattedTime = formatDateTime(currentTime, format, locale);

		const timezoneInfo = timezone ? `in ${timezone}` : "in local timezone";
		const displayFormat = format === "iso" ? "ISO format" : `${format} format`;

		return {
			content: [
				{
					type: "text" as const,
					text: `Current time ${timezoneInfo} (${displayFormat}): ${formattedTime}`,
				},
			],
		};
	} catch (error) {
		throw new McpError(
			ErrorCode.InternalError,
			`Failed to get current time: ${error instanceof Error ? error.message : "Unknown error"}`
		);
	}
}