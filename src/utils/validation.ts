import { z } from "zod";

export const TimezoneSchema = z
	.string()
	.describe("IANA timezone identifier (e.g., 'America/New_York', 'UTC')")
	.refine(
		(tz) => {
			try {
				Intl.DateTimeFormat(undefined, { timeZone: tz });
				return true;
			} catch {
				return false;
			}
		},
		{ message: "Invalid timezone identifier" }
	);

export const DateTimeFormatSchema = z
	.enum([
		"iso",
		"rfc2822", 
		"http",
		"sql",
		"local",
		"localeString",
		"short",
		"medium",
		"long",
		"full"
	])
	.default("iso")
	.describe("Output format for datetime");

export const LocaleSchema = z
	.string()
	.optional()
	.describe("Locale for formatting (e.g., 'en-US', 'fr-FR')");