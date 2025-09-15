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
 * Parse a date/time string in a specific timezone
 */
export function parseDateTime(dateString: string, timezone?: string): DateTime {
	// Try multiple parsing strategies
	let dt: DateTime;

	// First try ISO format
	dt = DateTime.fromISO(dateString, { zone: timezone });
	if (dt.isValid) return dt;

	// Try RFC2822 format
	dt = DateTime.fromRFC2822(dateString);
	if (dt.isValid && timezone) {
		return dt.setZone(timezone);
	}
	if (dt.isValid) return dt;

	// Try HTTP format
	dt = DateTime.fromHTTP(dateString);
	if (dt.isValid && timezone) {
		return dt.setZone(timezone);
	}
	if (dt.isValid) return dt;

	// Try SQL format
	dt = DateTime.fromSQL(dateString, { zone: timezone });
	if (dt.isValid) return dt;

	// Try common formats
	const formats = [
		"yyyy-MM-dd HH:mm:ss",
		"yyyy-MM-dd HH:mm",
		"yyyy-MM-dd",
		"MM/dd/yyyy HH:mm:ss",
		"MM/dd/yyyy HH:mm",
		"MM/dd/yyyy",
		"dd/MM/yyyy HH:mm:ss",
		"dd/MM/yyyy HH:mm",
		"dd/MM/yyyy",
	];

	for (const format of formats) {
		dt = DateTime.fromFormat(dateString, format, { zone: timezone });
		if (dt.isValid) return dt;
	}

	// If all else fails, throw an error
	throw new Error(`Unable to parse datetime string: ${dateString}`);
}

/**
 * Format duration in milliseconds to human-readable string
 */
export function formatDuration(milliseconds: number): string {
	const absMs = Math.abs(milliseconds);
	const isNegative = milliseconds < 0;

	const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
	const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

	const parts: string[] = [];

	if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
	if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
	if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
	if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);

	if (parts.length === 0) return "0 seconds";

	const result = parts.join(", ");
	return isNegative ? `-${result}` : result;
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
