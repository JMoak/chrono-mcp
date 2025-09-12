import { DateTime } from "luxon";

/**
 * Common timezone identifiers
 */
export const COMMON_TIMEZONES = [
	"UTC",
	"America/New_York",
	"America/Chicago",
	"America/Denver",
	"America/Los_Angeles",
	"Europe/London",
	"Europe/Paris",
	"Europe/Berlin",
	"Asia/Tokyo",
	"Asia/Shanghai",
	"Australia/Sydney",
] as const;

/**
 * Format a DateTime object according to the specified format
 */
export function formatDateTime(
	dt: DateTime,
	format: string,
	locale?: string,
): string {
	switch (format) {
		case "iso":
			return dt.toISO() ?? "";
		case "rfc2822":
			return dt.toRFC2822() ?? "";
		case "http":
			return dt.toHTTP() ?? "";
		case "sql":
			return dt.toSQL() ?? "";
		case "local":
			return dt.toString();
		case "localeString":
			return dt.toLocaleString(DateTime.DATETIME_FULL, { locale });
		case "short":
			return dt.toLocaleString(DateTime.DATETIME_SHORT, { locale });
		case "medium":
			return dt.toLocaleString(DateTime.DATETIME_MED, { locale });
		case "long":
			return dt.toLocaleString(DateTime.DATETIME_FULL, { locale });
		case "full":
			return dt.toLocaleString(DateTime.DATETIME_HUGE, { locale });
		default:
			return dt.toFormat(format, { locale });
	}
}

/**
 * Get current time in specified timezone
 */
export function getCurrentTime(timezone?: string): DateTime {
	const now = DateTime.now();
	return timezone ? now.setZone(timezone) : now;
}

/**
 * Validate if a string is a valid timezone
 */
export function isValidTimezone(timezone: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}
