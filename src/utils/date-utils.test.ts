import { DateTime, Settings, type Zone } from "luxon";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
	COMMON_TIMEZONES,
	formatDateTime,
	formatDuration,
	getCurrentTime,
	isValidTimezone,
	normalizeAllToUTC,
	normalizeToUTC,
	parseDateTime,
} from "./date-utils.js";

describe("date-utils", () => {
	let originalDefaultZone: Zone | string;

	beforeAll(() => {
		originalDefaultZone = Settings.defaultZone;
		Settings.defaultZone = "America/New_York";
	});

	afterAll(() => {
		if (originalDefaultZone) {
			Settings.defaultZone = originalDefaultZone;
		} else {
			Settings.defaultZone = "system";
		}
	});

	describe("COMMON_TIMEZONES", () => {
		it("should contain expected timezones", () => {
			expect(COMMON_TIMEZONES).toContain("UTC");
			expect(COMMON_TIMEZONES).toContain("America/New_York");
			expect(COMMON_TIMEZONES).toContain("Europe/London");
			expect(COMMON_TIMEZONES).toContain("Asia/Tokyo");
		});
	});

	describe("formatDateTime", () => {
		const testDate = DateTime.fromISO("2024-12-25T15:00:00.000Z");

		it("should format as ISO", () => {
			const result = formatDateTime(testDate, "iso");
			expect(result).toMatch(/2024-12-25T\d{2}:00:00\.000/);
		});

		it("should format as RFC2822", () => {
			const result = formatDateTime(testDate, "rfc2822");
			expect(result).toMatch(/Wed, 25 Dec 2024/);
		});

		it("should format as SQL", () => {
			const result = formatDateTime(testDate, "sql");
			expect(result).toMatch(/2024-12-25 \d{2}:00:00\.000/);
		});

		it("should format as local string", () => {
			const result = formatDateTime(testDate, "local");
			expect(result).toContain("2024");
		});

		it("should apply locale for localeString", () => {
			const result = formatDateTime(testDate, "localeString", "fr-FR");
			expect(result).toContain("2024");
		});

		it("should format as short", () => {
			const result = formatDateTime(testDate, "short");
			expect(result).toContain("2024");
		});

		it("should format as medium", () => {
			const result = formatDateTime(testDate, "medium");
			expect(result).toContain("Dec");
		});

		it("should format as long", () => {
			const result = formatDateTime(testDate, "long");
			expect(result).toContain("December");
		});

		it("should format as full", () => {
			const result = formatDateTime(testDate, "full");
			expect(result).toContain("December");
		});

		it("should use custom format string", () => {
			const result = formatDateTime(testDate, "yyyy-MM-dd");
			expect(result).toBe("2024-12-25");
		});
	});

	describe("getCurrentTime", () => {
		it("should return current time in system timezone when no timezone specified", () => {
			const result = getCurrentTime();
			expect(result.isValid).toBe(true);
		});

		it("should return current time in specified timezone", () => {
			const result = getCurrentTime("UTC");
			expect(result.isValid).toBe(true);
			expect(result.zoneName).toBe("UTC");
		});

		it("should return current time in different timezone", () => {
			const result = getCurrentTime("Asia/Tokyo");
			expect(result.isValid).toBe(true);
			expect(result.zoneName).toBe("Asia/Tokyo");
		});
	});

	describe("parseDateTime", () => {
		it("should parse ISO format", () => {
			const result = parseDateTime("2024-12-25T15:00:00Z");
			expect(result.isValid).toBe(true);
			expect(result.toUTC().toISO()).toBe("2024-12-25T15:00:00.000Z");
		});

		it("should parse ISO format with timezone", () => {
			const result = parseDateTime("2024-12-25T15:00:00", "UTC");
			expect(result.isValid).toBe(true);
			expect(result.zoneName).toBe("UTC");
		});

		it("should parse RFC2822 format", () => {
			const result = parseDateTime("Wed, 25 Dec 2024 15:00:00 GMT");
			expect(result.isValid).toBe(true);
		});

		it("should parse SQL format", () => {
			const result = parseDateTime("2024-12-25 15:00:00");
			expect(result.isValid).toBe(true);
		});

		it("should parse common date formats", () => {
			const result1 = parseDateTime("2024-12-25");
			expect(result1.isValid).toBe(true);

			const result2 = parseDateTime("12/25/2024");
			expect(result2.isValid).toBe(true);

			const result3 = parseDateTime("25/12/2024");
			expect(result3.isValid).toBe(true);
		});

		it("should throw error for invalid format", () => {
			expect(() => parseDateTime("not-a-date")).toThrow(
				"Unable to parse datetime string",
			);
		});
	});

	describe("formatDuration", () => {
		it("should format seconds", () => {
			expect(formatDuration(5000)).toBe("5 seconds");
			expect(formatDuration(1000)).toBe("1 second");
		});

		it("should format minutes", () => {
			expect(formatDuration(60000)).toBe("1 minute");
			expect(formatDuration(120000)).toBe("2 minutes");
		});

		it("should format hours", () => {
			expect(formatDuration(3600000)).toBe("1 hour");
			expect(formatDuration(7200000)).toBe("2 hours");
		});

		it("should format days", () => {
			expect(formatDuration(86400000)).toBe("1 day");
			expect(formatDuration(172800000)).toBe("2 days");
		});

		it("should format years", () => {
			const oneYear = 365.25 * 24 * 60 * 60 * 1000;
			// formatDuration includes remaining hours from the .25 days
			expect(formatDuration(oneYear)).toBe("1 year, 6 hours");
			expect(formatDuration(oneYear * 2)).toBe("2 years, 12 hours");
		});

		it("should format complex durations", () => {
			// 1 day, 1 hour, 1 minute, 1 second
			const duration = 86400000 + 3600000 + 60000 + 1000;
			expect(formatDuration(duration)).toBe(
				"1 day, 1 hour, 1 minute, 1 second",
			);
		});

		it("should handle zero duration", () => {
			expect(formatDuration(0)).toBe("0 seconds");
		});

		it("should handle negative durations", () => {
			expect(formatDuration(-3600000)).toBe("-1 hour");
			expect(formatDuration(-86400000)).toBe("-1 day");
		});

		it("should handle large spans (>10 years) with reduced detail", () => {
			const fifteenYears = 15 * 365.25 * 24 * 60 * 60 * 1000;
			const result = formatDuration(fifteenYears);
			expect(result).toContain("years");
			// Should not contain hours/minutes/seconds for large spans
			expect(result).not.toContain("hour");
			expect(result).not.toContain("minute");
			expect(result).not.toContain("second");
		});
	});

	describe("isValidTimezone", () => {
		it("should return true for valid timezones", () => {
			expect(isValidTimezone("UTC")).toBe(true);
			expect(isValidTimezone("America/New_York")).toBe(true);
			expect(isValidTimezone("Europe/London")).toBe(true);
			expect(isValidTimezone("Asia/Tokyo")).toBe(true);
		});

		it("should return false for invalid timezones", () => {
			expect(isValidTimezone("Invalid/Timezone")).toBe(false);
			expect(isValidTimezone("NotAZone")).toBe(false);
			expect(isValidTimezone("")).toBe(false);
		});
	});

	describe("normalizeToUTC", () => {
		it("should convert valid DateTime to UTC", () => {
			const nyTime = DateTime.now().setZone("America/New_York");
			const utcTime = normalizeToUTC(nyTime);
			expect(utcTime.zoneName).toBe("UTC");
			expect(utcTime.isValid).toBe(true);
		});

		it("should return invalid DateTime as-is", () => {
			const invalid = DateTime.fromISO("invalid");
			const result = normalizeToUTC(invalid);
			expect(result.isValid).toBe(false);
		});

		it("should produce same UTC moment for different timezones", () => {
			const isoString = "2024-12-25T15:00:00Z";
			const nyTime = DateTime.fromISO(isoString).setZone("America/New_York");
			const tokyoTime = DateTime.fromISO(isoString).setZone("Asia/Tokyo");

			const nyUTC = normalizeToUTC(nyTime);
			const tokyoUTC = normalizeToUTC(tokyoTime);

			expect(nyUTC.toISO()).toBe(tokyoUTC.toISO());
		});
	});

	describe("normalizeAllToUTC", () => {
		it("should convert array of DateTimes to UTC", () => {
			const times = [
				DateTime.now().setZone("America/New_York"),
				DateTime.now().setZone("Asia/Tokyo"),
				DateTime.now().setZone("Europe/London"),
			];

			const utcTimes = normalizeAllToUTC(times);

			expect(utcTimes).toHaveLength(3);
			for (const dt of utcTimes) {
				expect(dt.zoneName).toBe("UTC");
				expect(dt.isValid).toBe(true);
			}
		});

		it("should handle empty array", () => {
			const result = normalizeAllToUTC([]);
			expect(result).toEqual([]);
		});

		it("should handle single item array", () => {
			const times = [DateTime.now().setZone("America/New_York")];
			const result = normalizeAllToUTC(times);
			expect(result).toHaveLength(1);
			expect(result[0]?.zoneName).toBe("UTC");
		});
	});
});
