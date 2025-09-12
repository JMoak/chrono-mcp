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
});
