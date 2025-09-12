import { DateTime } from "luxon";
import { describe, expect, it, vi } from "vitest";
import { handleGetTime } from "./get-time.js";

// Helper function to safely parse JSON from result
function parseResult(result: Awaited<ReturnType<typeof handleGetTime>>) {
	expect(result.content).toHaveLength(1);
	const text = result.content[0]?.text;
	expect(text).toBeDefined();
	return JSON.parse(text as string);
}

describe("handleGetTime", () => {
	describe("basetime output", () => {
		it("should return current time as baseTime when no datetime provided", async () => {
			// Mock DateTime.now() to return a fixed time
			const fixedTime = DateTime.fromISO("2024-12-25T15:00:00.000Z");
			vi.spyOn(DateTime, "now").mockReturnValue(fixedTime as DateTime<true>);

			const result = await handleGetTime({});

			expect(result.content).toHaveLength(1);
			expect(result.content[0]?.type).toBe("text");

			const parsed = parseResult(result);
			expect(parsed.baseTime).toMatch(/2024-12-25T\d{2}:00:00\.000/);

			vi.restoreAllMocks();
		});

		it("should handle invalid datetime format", async () => {
			const result = await handleGetTime({ datetime: "invalid-date" });

			expect(result.content).toHaveLength(1);
			expect(result.content[0]?.type).toBe("text");
			expect(result.content[0]?.text).toMatch(/Error parsing datetime/);
		});
	});

	describe("timezone conversions", () => {
		it("should convert time to multiple timezones", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";
			const timezones = ["America/New_York", "Europe/London", "Asia/Tokyo"];

			const result = await handleGetTime({
				datetime: inputDateTime,
				timezones,
			});

			expect(result.content).toHaveLength(1);
			const parsed = parseResult(result);

			// baseTime shows input converted to local system timezone
			expect(parsed.baseTime).toBe("2024-12-25T10:00:00.000-05:00");
			expect(parsed["America/New_York"]).toBe("2024-12-25T10:00:00.000");
			expect(parsed["Europe/London"]).toBe("2024-12-25T15:00:00.000");
			expect(parsed["Asia/Tokyo"]).toBe("2024-12-26T00:00:00.000");
		});

		it("should include UTC offsets when requested", async () => {
			const inputDateTime = "2024-07-15T12:00:00Z"; // Summer time
			const timezones = ["America/New_York", "Europe/Paris"];

			const result = await handleGetTime({
				datetime: inputDateTime,
				timezones,
				includeOffsets: true,
			});

			const parsed = parseResult(result);

			expect(parsed["America/New_York"]).toBe("2024-07-15T08:00:00.000-04:00"); // EDT in summer
			expect(parsed["Europe/Paris"]).toBe("2024-07-15T14:00:00.000+02:00"); // CEST in summer
		});

		it("should handle invalid timezones gracefully", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";
			const timezones = ["Invalid/Timezone", "America/New_York"];

			const result = await handleGetTime({
				datetime: inputDateTime,
				timezones,
			});

			const parsed = parseResult(result);

			expect(parsed["Invalid/Timezone"]).toBe(
				"Invalid timezone: Invalid/Timezone",
			);
			expect(parsed["America/New_York"]).toBe("2024-12-25T10:00:00.000");
		});

		it("should work with current time and timezones", async () => {
			const fixedTime = DateTime.fromISO("2024-06-15T18:30:00Z");
			vi.spyOn(DateTime, "now").mockReturnValue(fixedTime as DateTime<true>);

			const timezones = ["UTC", "America/Los_Angeles", "Asia/Shanghai"];

			const result = await handleGetTime({ timezones });

			const parsed = parseResult(result);

			expect(parsed.UTC).toBe("2024-06-15T18:30:00.000");
			expect(parsed["America/Los_Angeles"]).toBe("2024-06-15T11:30:00.000"); // PDT
			expect(parsed["Asia/Shanghai"]).toBe("2024-06-16T02:30:00.000"); // CST

			vi.restoreAllMocks();
		});

		it("should handle DST transitions correctly", async () => {
			// Test during DST transition period
			const inputDateTime = "2024-03-10T07:00:00Z"; // Spring forward day in US
			const timezones = ["America/New_York", "America/Los_Angeles"];

			const result = await handleGetTime({
				datetime: inputDateTime,
				timezones,
				includeOffsets: true,
			});

			const parsed = parseResult(result);

			// Actual behavior: NY switches to EDT, LA is still PST this early in the morning
			expect(parsed["America/New_York"]).toBe("2024-03-10T03:00:00.000-04:00");
			expect(parsed["America/Los_Angeles"]).toBe(
				"2024-03-09T23:00:00.000-08:00",
			);
		});

		it("should handle empty timezones array", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				timezones: [],
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime).toBeDefined();
			expect(Object.keys(parsed)).toHaveLength(1); // Only baseTime
		});
	});

	describe("format support", () => {
		it("should format baseTime in multiple formats", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";
			const formats = ["iso", "rfc2822", "localeString"];

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats,
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime).toBeDefined();
			expect(parsed.baseTime_iso).toBe("2024-12-25T10:00:00.000-05:00");
			expect(parsed.baseTime_rfc2822).toBe("Wed, 25 Dec 2024 10:00:00 -0500");
			expect(parsed.baseTime_localeString).toMatch(/12\/25\/2024/); // Locale-dependent
		});

		it("should handle single format", async () => {
			const inputDateTime = "2024-07-15T12:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["sql"],
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime).toBeDefined();
			expect(parsed.baseTime_sql).toBe("2024-07-15 08:00:00.000 -04:00");
		});

		it("should work with formats and timezones together", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["iso", "short"],
				timezones: ["America/New_York"],
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime).toBeDefined();
			expect(parsed.baseTime_iso).toBe("2024-12-25T10:00:00.000-05:00");
			expect(parsed.baseTime_short).toMatch(/12\/25\/2024/);
			expect(parsed["America/New_York"]).toBe("2024-12-25T10:00:00.000");
		});
	});

	describe("locale support", () => {
		it("should apply locale to localeString format", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["localeString"],
				locale: "fr-FR",
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime_localeString).toMatch(/25\/12\/2024/); // French date format
		});

		it("should apply locale to short format", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["short"],
				locale: "de-DE",
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime_short).toMatch(/25\.12\.2024/); // German date format
		});

		it("should apply locale to medium format", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["medium"],
				locale: "en-GB",
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime_medium).toMatch(/25 Dec 2024/); // British format
		});

		it("should apply locale to long format", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["long"],
				locale: "es-ES",
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime_long).toMatch(/25 de diciembre de 2024/); // Spanish format
		});

		it("should apply locale to full format", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["full"],
				locale: "ja-JP",
			});

			const parsed = parseResult(result);

			expect(parsed.baseTime_full).toMatch(/2024年12月25日/); // Japanese format
		});

		it("should fall back to system locale when no locale specified", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["short", "localeString"],
			});

			const parsed = parseResult(result);

			// Should work without errors and use system locale
			expect(parsed.baseTime_short).toBeDefined();
			expect(parsed.baseTime_localeString).toBeDefined();
		});

		it("should apply locale to multiple formats simultaneously", async () => {
			const inputDateTime = "2024-12-25T15:00:00Z";

			const result = await handleGetTime({
				datetime: inputDateTime,
				formats: ["short", "medium", "long", "full", "localeString"],
				locale: "fr-FR",
			});

			const parsed = parseResult(result);

			// All should use French locale formatting
			expect(parsed.baseTime_short).toMatch(/25\/12\/2024/);
			expect(parsed.baseTime_medium).toMatch(/25 déc\. 2024/);
			expect(parsed.baseTime_long).toMatch(/25 décembre 2024/);
			expect(parsed.baseTime_full).toMatch(/25 décembre 2024 à \d{2}:\d{2}/); // Includes time in full format
			expect(parsed.baseTime_localeString).toMatch(/25\/12\/2024/);
		});
	});
});
