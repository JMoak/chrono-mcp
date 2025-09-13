import { DateTime } from "luxon";
import { describe, expect, it, vi } from "vitest";
import { handleTimeCalculator } from "./time-calculator.js";

function parseResult(result: Awaited<ReturnType<typeof handleTimeCalculator>>) {
	expect(result.content).toHaveLength(1);
	const text = result.content[0]?.text;
	expect(text).toBeDefined();
	return JSON.parse(text as string);
}

describe("handleTimeCalculator", () => {
	describe("add operation", () => {
		it("should add multiple time units to a specific datetime", async () => {
			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "2024-01-15T10:00:00Z",
				years: 1,
				months: 2,
				days: 5,
				hours: 3,
				minutes: 30,
				seconds: 45,
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("add");
			expect(parsed.input.base_time).toBe("2024-01-15T05:00:00.000-05:00");
			expect(parsed.input.duration).toEqual({
				years: 1,
				months: 2,
				days: 5,
				hours: 3,
				minutes: 30,
				seconds: 45,
			});
			expect(parsed.result).toBe("2025-03-20T08:30:45.000-04:00");
			expect(parsed.result_timezone).toBe("America/New_York");
		});

		it("should add time to current time when no base_time provided", async () => {
			const fixedTime = DateTime.fromISO("2024-06-15T12:00:00Z");
			vi.spyOn(DateTime, "now").mockReturnValue(fixedTime as DateTime<true>);

			const result = await handleTimeCalculator({
				operation: "add",
				days: 7,
				hours: 12,
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("add");
			expect(parsed.input.duration).toEqual({
				days: 7,
				hours: 12,
			});
			expect(parsed.result).toBe("2024-06-22T20:00:00.000-04:00");

			vi.restoreAllMocks();
		});
	});

	describe("subtract operation", () => {
		it("should subtract multiple time units from a specific datetime", async () => {
			const result = await handleTimeCalculator({
				operation: "subtract",
				base_time: "2024-12-25T15:30:45Z",
				years: 1,
				months: 3,
				days: 10,
				hours: 5,
				minutes: 15,
				seconds: 30,
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("subtract");
			expect(parsed.input.base_time).toBe("2024-12-25T10:30:45.000-05:00");
			expect(parsed.input.duration).toEqual({
				years: 1,
				months: 3,
				days: 10,
				hours: 5,
				minutes: 15,
				seconds: 30,
			});
			expect(parsed.result).toBe("2023-09-15T05:15:15.000-04:00");
			expect(parsed.result_timezone).toBe("America/New_York");
		});

		it("should subtract time with timezone context", async () => {
			const result = await handleTimeCalculator({
				operation: "subtract",
				base_time: "2024-07-15T14:00:00",
				timezone: "America/New_York",
				months: 2,
				days: 5,
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("subtract");
			expect(parsed.input.duration).toEqual({
				months: 2,
				days: 5,
			});
			expect(parsed.result_timezone).toBe("America/New_York");
			expect(parsed.result).toBe("2024-05-10T14:00:00.000-04:00");
		});
	});

	describe("diff operation", () => {
		it("should calculate difference between two dates in various units", async () => {
			const result = await handleTimeCalculator({
				operation: "diff",
				base_time: "2024-01-01T06:00:00Z",
				target_time: "2024-01-08T18:30:45Z",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("diff");
			expect(parsed.input.base_time).toBe("2024-01-01T01:00:00.000-05:00");
			expect(parsed.input.target_time).toBe("2024-01-08T13:30:45.000-05:00");
			expect(parsed.result.milliseconds).toBe(0);
			expect(parsed.result.seconds).toBe(0);
			expect(parsed.result.minutes).toBe(0);
			expect(parsed.result.hours).toBe(0);
			expect(parsed.result.days).toBe(0);
		});

		it("should handle negative differences when target is before base", async () => {
			const result = await handleTimeCalculator({
				operation: "diff",
				base_time: "2024-12-25T20:00:00Z",
				target_time: "2024-12-20T15:00:00Z",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("diff");
			expect(parsed.result.days).toBe(0);
			expect(parsed.result.hours).toBe(0);
			expect(parsed.result.milliseconds).toBe(0);
		});
	});

	describe("duration_between operation", () => {
		it("should provide detailed duration breakdown between dates", async () => {
			const result = await handleTimeCalculator({
				operation: "duration_between",
				base_time: "2024-01-15T08:30:00Z",
				target_time: "2025-03-20T14:45:30Z",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("duration_between");
			expect(parsed.input.base_time).toBe("2024-01-15T03:30:00.000-05:00");
			expect(parsed.input.target_time).toBe("2025-03-20T10:45:30.000-04:00");
			expect(parsed.result.years).toBe(1);
			expect(parsed.result.months).toBe(2);
			expect(parsed.result.days).toBe(5);
			expect(parsed.result.hours).toBe(7);
			expect(parsed.result.minutes).toBe(15);
			expect(parsed.result.seconds).toBe(30);
			expect(parsed.result.human_readable).toBe("1 year, 2 months, 5 days, 7 hours, 15 minutes, 30 seconds, 0 milliseconds");
			expect(parsed.result.total_milliseconds).toBe(0);
		});

		it("should handle multi-timezone duration calculations", async () => {
			const result = await handleTimeCalculator({
				operation: "duration_between",
				base_time: "2024-01-01T12:00:00",
				timezone: "America/Los_Angeles",
				target_time: "2024-01-01T21:00:00",
				target_time_timezone: "Europe/London",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("duration_between");
			expect(parsed.metadata.base_timezone).toBe("America/Los_Angeles");
			expect(parsed.metadata.target_timezone).toBe("Europe/London");
			expect(parsed.result.hours).toBe(9);
			expect(parsed.result.human_readable).toBe("0 years, 0 months, 0 days, 9 hours, 0 minutes, 0 seconds, 0 milliseconds");
		});
	});

	describe("error handling", () => {
		it("should handle invalid operation", async () => {
			const result = await handleTimeCalculator({
				operation: "invalid",
			});

			expect(result.content[0]?.text).toMatch(/Invalid arguments/);
		});

		it("should handle missing duration for add operation", async () => {
			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "2024-01-01T00:00:00Z",
			});

			expect(result.content[0]?.text).toMatch(/No duration specified/);
		});

		it("should handle missing target_time for diff operation", async () => {
			const result = await handleTimeCalculator({
				operation: "diff",
				base_time: "2024-01-01T00:00:00Z",
			});

			expect(result.content[0]?.text).toMatch(/target_time is required/);
		});

		it("should handle invalid datetime format", async () => {
			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "invalid-date",
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(/Invalid base_time format/);
		});

		it("should handle invalid timezone", async () => {
			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "2024-01-01T00:00:00Z",
				timezone: "Invalid/Timezone",
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(/Invalid timezone/);
		});
	});

	describe("timezone handling", () => {
		it("should respect timezone for add operation", async () => {
			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "2024-07-15T12:00:00",
				timezone: "Europe/Paris",
				hours: 6,
			});

			const parsed = parseResult(result);

			expect(parsed.result_timezone).toBe("Europe/Paris");
			expect(parsed.result).toBe("2024-07-16T00:00:00.000+02:00");
		});

		it("should use different timezones for base and target in duration_between", async () => {
			const result = await handleTimeCalculator({
				operation: "duration_between",
				base_time: "2024-01-01T12:00:00",
				timezone: "America/Los_Angeles",
				target_time: "2024-01-01T21:00:00",
				target_time_timezone: "Europe/London",
			});

			const parsed = parseResult(result);

			expect(parsed.metadata.base_timezone).toBe("America/Los_Angeles");
			expect(parsed.metadata.target_timezone).toBe("Europe/London");
			expect(parsed.result.hours).toBe(9);
		});
	});
});