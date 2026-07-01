import { DateTime } from "luxon";

/**
 * Common timezone identifiers for reference and validation.
 * These represent frequently used timezones across different regions.
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
 * Formats a DateTime object according to the specified format string.
 *
 * @param dt - The DateTime object to format
 * @param format - The format identifier (iso, rfc2822, http, sql, local, localeString, short, medium, long, full, or custom Luxon format string)
 * @param locale - Optional locale string for locale-aware formatting (e.g., 'en-US', 'fr-FR')
 * @returns The formatted datetime string, or empty string if formatting fails
 *
 * @example
 * ```typescript
 * const dt = DateTime.now();
 * formatDateTime(dt, 'iso');        // "2024-12-25T15:00:00.000-05:00"
 * formatDateTime(dt, 'short');      // "12/25/2024, 3:00 PM"
 * formatDateTime(dt, 'full', 'de'); // "Mittwoch, 25. Dezember 2024 um 15:00:00 GMT-05:00"
 * ```
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
 * Gets the current time, optionally in a specified timezone.
 *
 * @param timezone - Optional IANA timezone identifier (e.g., 'America/New_York')
 * @returns A DateTime object representing the current time
 *
 * @example
 * ```typescript
 * getCurrentTime();                           // Current time in system timezone
 * getCurrentTime('Asia/Tokyo');              // Current time in Tokyo
 * ```
 */
export function getCurrentTime(timezone?: string): DateTime {
	const now = DateTime.now();
	return timezone ? now.setZone(timezone) : now;
}

/**
 * Parses a date/time string using multiple strategies.
 * Attempts ISO, RFC2822, HTTP, SQL formats, then falls back to common custom formats.
 *
 * @param dateString - The datetime string to parse
 * @param timezone - Optional timezone to apply to the parsed datetime
 * @returns A valid DateTime object
 * @throws Error if the string cannot be parsed by any strategy
 *
 * @example
 * ```typescript
 * parseDateTime('2024-12-25T15:00:00Z');              // ISO format
 * parseDateTime('Wed, 25 Dec 2024 15:00:00 GMT');    // RFC2822 format
 * parseDateTime('2024-12-25 15:00:00', 'UTC');       // With timezone override
 * ```
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
 * Formats a duration in milliseconds to a human-readable string.
 * Breaks down the duration into years, days, hours, minutes, and seconds.
 *
 * @param milliseconds - The duration in milliseconds (can be negative)
 * @returns A human-readable duration string (e.g., "2 days, 5 hours, 30 minutes")
 *
 * @example
 * ```typescript
 * formatDuration(90061000);     // "1 day, 1 hour, 1 minute, 1 second"
 * formatDuration(-3600000);     // "-1 hour"
 * formatDuration(0);            // "0 seconds"
 * ```
 */
export function formatDuration(milliseconds: number): string {
	const absMs = Math.abs(milliseconds);
	const isNegative = milliseconds < 0;

	// Calculate all units
	const years = Math.floor(absMs / (1000 * 60 * 60 * 24 * 365.25));
	const remainingAfterYears = absMs % (1000 * 60 * 60 * 24 * 365.25);
	const days = Math.floor(remainingAfterYears / (1000 * 60 * 60 * 24));
	const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
	const minutes = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));
	const seconds = Math.floor((absMs % (1000 * 60)) / 1000);

	const parts: string[] = [];

	// Add years if significant (more than 1 year)
	if (years > 0) parts.push(`${years} year${years !== 1 ? "s" : ""}`);

	// For very large spans (>10 years), only show years and days for readability
	if (years >= 10) {
		if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
	} else {
		// For smaller spans, show more detail
		if (days > 0) parts.push(`${days} day${days !== 1 ? "s" : ""}`);
		if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? "s" : ""}`);
		if (minutes > 0) parts.push(`${minutes} minute${minutes !== 1 ? "s" : ""}`);
		if (seconds > 0) parts.push(`${seconds} second${seconds !== 1 ? "s" : ""}`);
	}

	if (parts.length === 0) return "0 seconds";

	const result = parts.join(", ");
	return isNegative ? `-${result}` : result;
}

/**
 * Validates whether a string is a valid IANA timezone identifier.
 *
 * @param timezone - The timezone string to validate
 * @returns True if the timezone is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTimezone('America/New_York');  // true
 * isValidTimezone('Invalid/Timezone');  // false
 * isValidTimezone('UTC');               // true
 * ```
 */
export function isValidTimezone(timezone: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}

/**
 * Normalizes a DateTime object to UTC for consistent duration calculations.
 * This ensures that timezone differences don't affect duration/difference calculations.
 *
 * @param dt - The DateTime object to normalize
 * @returns A new DateTime object in UTC, or the original if invalid
 *
 * @example
 * ```typescript
 * const nyTime = DateTime.now().setZone('America/New_York');
 * const tokyoTime = DateTime.now().setZone('Asia/Tokyo');
 * normalizeToUTC(nyTime);      // UTC normalized version
 * normalizeToUTC(tokyoTime);   // Same UTC moment
 * ```
 */
export function normalizeToUTC(dt: DateTime): DateTime {
	if (!dt.isValid) {
		return dt; // Return invalid DateTime as-is
	}
	return dt.toUTC();
}

/**
 * Normalizes an array of DateTime objects to UTC.
 * Convenience wrapper around normalizeToUTC for batch operations.
 *
 * @param datetimes - Array of DateTime objects to normalize
 * @returns Array of UTC-normalized DateTime objects
 */
export function normalizeAllToUTC(datetimes: DateTime[]): DateTime[] {
	return datetimes.map(normalizeToUTC);
}
