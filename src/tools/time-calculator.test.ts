import { DateTime, Settings, type Zone } from "luxon";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { configManager } from "../utils/config.js";
import { handleTimeCalculator } from "./time-calculator.js";

function parseResult(result: Awaited<ReturnType<typeof handleTimeCalculator>>) {
	expect(result.content).toHaveLength(1);
	const text = result.content[0]?.text;
	expect(text).toBeDefined();
	return JSON.parse(text as string);
}

describe("handleTimeCalculator", () => {
	let originalDefaultZone: Zone | string;

	beforeAll(() => {
		// Save original timezone and set consistent timezone for tests
		originalDefaultZone = Settings.defaultZone;
		Settings.defaultZone = "America/New_York";
	});

	afterAll(() => {
		// Restore original timezone settings
		if (originalDefaultZone) {
			Settings.defaultZone = originalDefaultZone;
		} else {
			Settings.defaultZone = "system";
		}
	});
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
			// metadata should not be present in normal mode
			expect(parsed.metadata).toBeUndefined();
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
			// metadata should not be present in normal mode
			expect(parsed.metadata).toBeUndefined();
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
			// metadata should not be present in normal mode
			expect(parsed.metadata).toBeUndefined();
		});

		it("should add time to multiple base times (bulk operation)", async () => {
			const result = await handleTimeCalculator({
				operation: "add",
				base_time: [
					"2024-01-01T10:00:00Z",
					"2024-02-15T14:30:00Z",
					"2024-03-20T08:45:00Z",
				],
				days: 5,
				hours: 3,
				minutes: 30,
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("add");
			expect(parsed.input.base_time).toEqual([
				"2024-01-01T05:00:00.000-05:00",
				"2024-02-15T09:30:00.000-05:00",
				"2024-03-20T04:45:00.000-04:00",
			]);
			expect(parsed.input.duration).toEqual({
				days: 5,
				hours: 3,
				minutes: 30,
			});
			expect(parsed.result.count).toBe(3);
			expect(parsed.result.results).toEqual([
				"2024-01-06T08:30:00.000-05:00",
				"2024-02-20T13:00:00.000-05:00",
				"2024-03-25T08:15:00.000-04:00",
			]);
		});

		it("should subtract time from multiple base times (bulk operation)", async () => {
			const result = await handleTimeCalculator({
				operation: "subtract",
				base_time: ["2024-06-15T12:00:00Z", "2024-07-20T16:30:00Z"],
				months: 2,
				days: 10,
				hours: 4,
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("subtract");
			expect(parsed.input.base_time).toEqual([
				"2024-06-15T08:00:00.000-04:00",
				"2024-07-20T12:30:00.000-04:00",
			]);
			expect(parsed.input.duration).toEqual({
				months: 2,
				days: 10,
				hours: 4,
			});
			expect(parsed.result.count).toBe(2);
			expect(parsed.result.results).toEqual([
				"2024-04-05T04:00:00.000-04:00",
				"2024-05-10T08:30:00.000-04:00",
			]);
		});
	});

	describe("diff operation", () => {
		it("should calculate difference between two dates in decomposed units", async () => {
			const result = await handleTimeCalculator({
				operation: "diff",
				base_time: "2024-01-01T06:00:00Z",
				compare_time: "2024-01-08T18:30:45Z",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("diff");
			expect(parsed.input.base_time).toBe("2024-01-01T01:00:00.000-05:00");
			expect(parsed.input.compare_time).toBe("2024-01-08T13:30:45.000-05:00");

			// Should return decomposed time units that add up to the total
			// 7 days, 12 hours, 30 minutes, 45 seconds
			expect(parsed.result.days).toBe(7);
			expect(parsed.result.hours).toBe(12);
			expect(parsed.result.minutes).toBe(30);
			expect(parsed.result.seconds).toBe(45);
			expect(parsed.result.milliseconds).toBe(0);

			// Should also include total milliseconds for reference
			const expectedTotalMs =
				7 * 24 * 60 * 60 * 1000 +
				12 * 60 * 60 * 1000 +
				30 * 60 * 1000 +
				45 * 1000;
			expect(parsed.result.total_milliseconds).toBe(expectedTotalMs);
		});

		it("should handle negative differences when target is before base", async () => {
			const result = await handleTimeCalculator({
				operation: "diff",
				base_time: "2024-12-25T20:00:00Z",
				compare_time: "2024-12-20T15:00:00Z",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("diff");
			// This should be a negative difference
			expect(parsed.result.days).toBeLessThan(0);
			expect(parsed.result.hours).toBeLessThan(0);
			expect(parsed.result.total_milliseconds).toBeLessThan(0);
		});
	});

	describe("duration_between operation", () => {
		it("should provide detailed duration breakdown between dates", async () => {
			const result = await handleTimeCalculator({
				operation: "duration_between",
				base_time: "2024-01-15T08:30:00Z",
				compare_time: "2025-03-20T14:45:30Z",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("duration_between");
			expect(parsed.input.base_time).toBe("2024-01-15T03:30:00.000-05:00");
			expect(parsed.input.compare_time).toBe("2025-03-20T10:45:30.000-04:00");
			expect(parsed.result.years).toBe(1);
			expect(parsed.result.months).toBe(2);
			expect(parsed.result.days).toBe(5);
			expect(parsed.result.hours).toBe(6);
			expect(parsed.result.minutes).toBe(15);
			expect(parsed.result.seconds).toBe(30);
			expect(parsed.result.human_readable).toBe(
				"1 year, 2 months, 5 days, 6 hours, 15 minutes, 30 seconds, 0 milliseconds",
			);
			expect(parsed.result.total_milliseconds).toBeGreaterThan(0);
		});

		it("should handle multi-timezone duration calculations", async () => {
			const result = await handleTimeCalculator({
				operation: "duration_between",
				base_time: "2024-01-01T12:00:00",
				timezone: "America/Los_Angeles",
				compare_time: "2024-01-01T21:00:00",
				compare_time_timezone: "Europe/London",
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("duration_between");
			// metadata should not be present in normal mode
			expect(parsed.metadata).toBeUndefined();
			expect(parsed.result.hours).toBe(1);
			expect(parsed.result.human_readable).toBe(
				"0 years, 0 months, 0 days, 1 hour, 0 minutes, 0 seconds, 0 milliseconds",
			);
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

		it("should handle missing compare_time for diff operation", async () => {
			const result = await handleTimeCalculator({
				operation: "diff",
				base_time: "2024-01-01T00:00:00Z",
			});

			expect(result.content[0]?.text).toMatch(/compare_time is required/);
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

			expect(result.content[0]?.text).toMatch(
				/unsupported zone|Invalid timezone/,
			);
		});
	});

	describe("operation count limits", () => {
		it("should flag add operation when base_time array exceeds maximum operations", async () => {
			// Create an array larger than MAX_OPERATIONS (10000)
			const largeTimes = Array(10001).fill("2024-01-01T00:00:00Z");

			const result = await handleTimeCalculator({
				operation: "add",
				base_time: largeTimes,
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(
				/Operation count \(10001\) exceeds maximum allowed \(10000\) for interaction mode 'many_to_single'/,
			);
		});

		it("should flag subtract operation when base_time array exceeds maximum operations", async () => {
			// Create an array larger than MAX_OPERATIONS (10000)
			const largeTimes = Array(10001).fill("2024-01-01T00:00:00Z");

			const result = await handleTimeCalculator({
				operation: "subtract",
				base_time: largeTimes,
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(
				/Operation count \(10001\) exceeds maximum allowed \(10000\) for interaction mode 'many_to_single'/,
			);
		});

		it("should flag add operation when compare_time array exceeds maximum operations", async () => {
			// Create an array larger than MAX_OPERATIONS (10000)
			const largeTimes = Array(10001).fill("2024-01-01T00:00:00Z");

			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "2024-01-01T00:00:00Z",
				compare_time: largeTimes,
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(
				/Operation count \(10001\) exceeds maximum allowed \(10000\) for interaction mode 'single_to_many'/,
			);
		});

		it("should flag subtract operation when combined arrays exceed maximum operations", async () => {
			// Create arrays that when combined exceed MAX_OPERATIONS (10000)
			const baseTimes = Array(5001).fill("2024-01-01T00:00:00Z");
			const compareTimes = Array(5001).fill("2024-01-02T00:00:00Z");

			const result = await handleTimeCalculator({
				operation: "subtract",
				base_time: baseTimes,
				compare_time: compareTimes,
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(
				/Operation count \(10002\) exceeds maximum allowed \(10000\) for subtract operation/,
			);
		});

		it("should allow add operation when operation count is exactly at the limit", async () => {
			// Create an array exactly at MAX_OPERATIONS (10000)
			const maxTimes = Array(10000).fill("2024-01-01T00:00:00Z");

			const result = await handleTimeCalculator({
				operation: "add",
				base_time: maxTimes,
				days: 1,
			});

			const parsed = parseResult(result);
			expect(parsed.operation).toBe("add");
			expect(parsed.result.count).toBe(10000);
		});

		it("should flag add operation when add/subtract specific operation count exceeds limit", async () => {
			// Test the add/subtract specific operation count check (lines 578-590)
			// Use arrays that together exceed the limit but individually don't trigger planOperations
			const baseTimes = Array(5001).fill("2024-01-01T00:00:00Z");
			const compareTimes = Array(5002).fill("2024-01-02T00:00:00Z");

			const result = await handleTimeCalculator({
				operation: "add",
				base_time: baseTimes,
				compare_time: compareTimes,
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(
				/Operation count \(10003\) exceeds maximum allowed \(10000\) for add operation/,
			);
		});

		it("should flag subtract operation when add/subtract specific operation count exceeds limit", async () => {
			// Test the add/subtract specific operation count check (lines 578-590)
			// Use arrays that together exceed the limit but individually don't trigger planOperations
			const baseTimes = Array(5001).fill("2024-01-01T00:00:00Z");
			const compareTimes = Array(5002).fill("2024-01-02T00:00:00Z");

			const result = await handleTimeCalculator({
				operation: "subtract",
				base_time: baseTimes,
				compare_time: compareTimes,
				days: 1,
			});

			expect(result.content[0]?.text).toMatch(
				/Operation count \(10003\) exceeds maximum allowed \(10000\) for subtract operation/,
			);
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
			expect(parsed.result).toBe("2024-07-15T18:00:00.000+02:00");
		});

		it("should use different timezones for base and compare in duration_between", async () => {
			const result = await handleTimeCalculator({
				operation: "duration_between",
				base_time: "2024-01-01T12:00:00",
				timezone: "America/Los_Angeles",
				compare_time: "2024-01-01T21:00:00",
				compare_time_timezone: "Europe/London",
			});

			const parsed = parseResult(result);

			// metadata should not be present in normal mode
			expect(parsed.metadata).toBeUndefined();
			expect(parsed.result.hours).toBe(1);
		});
	});

	describe("interaction modes", () => {
		describe("single_to_many mode", () => {
			it("should calculate diff from one base time to multiple compare times", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "single_to_many",
					base_time: "2024-01-01T12:00:00Z",
					compare_time: [
						"2024-01-01T15:00:00Z",
						"2024-01-01T18:00:00Z",
						"2024-01-01T21:00:00Z",
					],
				});

				const parsed = parseResult(result);

				expect(parsed.operation).toBe("diff");
				expect(parsed.interaction_mode).toBe("single_to_many");
				expect(parsed.result.count).toBe(3);
				expect(parsed.result.results).toHaveLength(3);
				expect(parsed.result.results[0].hours).toBe(3);
				expect(parsed.result.results[1].hours).toBe(6);
				expect(parsed.result.results[2].hours).toBe(9);
			});

			it("should fail when not exactly 1 base_time provided", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "single_to_many",
					base_time: ["2024-01-01T12:00:00Z", "2024-01-02T12:00:00Z"],
					compare_time: ["2024-01-01T15:00:00Z", "2024-01-01T18:00:00Z"],
				});

				expect(result.content[0]?.text).toMatch(
					/single_to_many mode requires exactly 1 base_time and multiple compare_times/,
				);
			});
		});

		describe("many_to_single mode", () => {
			it("should calculate diff from multiple base times to one compare time", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "many_to_single",
					base_time: [
						"2024-01-01T09:00:00Z",
						"2024-01-01T12:00:00Z",
						"2024-01-01T15:00:00Z",
					],
					compare_time: "2024-01-01T18:00:00Z",
				});

				const parsed = parseResult(result);

				expect(parsed.operation).toBe("diff");
				expect(parsed.interaction_mode).toBe("many_to_single");
				expect(parsed.result.count).toBe(3);
				expect(parsed.result.results).toHaveLength(3);
				expect(parsed.result.results[0].hours).toBe(9);
				expect(parsed.result.results[1].hours).toBe(6);
				expect(parsed.result.results[2].hours).toBe(3);
			});

			it("should fail when not exactly 1 compare_time provided", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "many_to_single",
					base_time: ["2024-01-01T12:00:00Z", "2024-01-02T12:00:00Z"],
					compare_time: ["2024-01-01T15:00:00Z", "2024-01-01T18:00:00Z"],
				});

				expect(result.content[0]?.text).toMatch(
					/many_to_single mode requires multiple base_times and exactly 1 compare_time/,
				);
			});
		});

		describe("cross_product mode", () => {
			it("should calculate diff for all combinations of base times and compare times", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "cross_product",
					base_time: ["2024-01-01T12:00:00Z", "2024-01-01T15:00:00Z"],
					compare_time: ["2024-01-01T14:00:00Z", "2024-01-01T18:00:00Z"],
				});

				const parsed = parseResult(result);

				expect(parsed.operation).toBe("diff");
				expect(parsed.interaction_mode).toBe("cross_product");
				expect(parsed.result.count).toBe(4);
				expect(parsed.result.results).toHaveLength(4);

				// Cross product should produce:
				// base[0] to compare[0]: 12:00 to 14:00 = 2 hours
				// base[0] to compare[1]: 12:00 to 18:00 = 6 hours
				// base[1] to compare[0]: 15:00 to 14:00 = -1 hour
				// base[1] to compare[1]: 15:00 to 18:00 = 3 hours
				expect(parsed.result.results[0].hours).toBe(2);
				expect(parsed.result.results[1].hours).toBe(6);
				expect(parsed.result.results[2].hours).toBe(-1);
				expect(parsed.result.results[3].hours).toBe(3);
			});

			it("should fail when either array is missing", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "cross_product",
					base_time: "2024-01-01T12:00:00Z",
					// compare_time missing
				});

				expect(result.content[0]?.text).toMatch(
					/cross_product mode requires both base_time and compare_time arrays/,
				);
			});
		});

		describe("pairwise mode validation", () => {
			it("should calculate diff pairwise between matching indices", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "pairwise",
					base_time: [
						"2024-01-01T10:00:00Z",
						"2024-01-01T12:00:00Z",
						"2024-01-01T14:00:00Z",
					],
					compare_time: [
						"2024-01-01T13:00:00Z",
						"2024-01-01T16:00:00Z",
						"2024-01-01T19:00:00Z",
					],
				});

				const parsed = parseResult(result);

				expect(parsed.operation).toBe("diff");
				expect(parsed.interaction_mode).toBe("pairwise");
				expect(parsed.result.count).toBe(3);
				expect(parsed.result.results).toHaveLength(3);
				expect(parsed.result.results[0].hours).toBe(3);
				expect(parsed.result.results[1].hours).toBe(4);
				expect(parsed.result.results[2].hours).toBe(5);
			});

			it("should fail when either array is missing", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "pairwise",
					base_time: "2024-01-01T12:00:00Z",
					// compare_time missing
				});

				expect(result.content[0]?.text).toMatch(
					/pairwise mode requires both base_time and compare_time arrays/,
				);
			});

			it("should handle individual invalid timestamps in pairwise batch", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "pairwise",
					base_time: [
						"2024-01-01T10:00:00Z",
						"invalid-date-format", // This should fail
						"2024-01-03T10:00:00Z",
					],
					compare_time: [
						"2024-01-01T12:00:00Z",
						"2024-01-02T12:00:00Z",
						"2024-01-03T14:00:00Z",
					],
				});

				const parsed = parseResult(result);

				expect(parsed.operation).toBe("diff");
				expect(parsed.interaction_mode).toBe("pairwise");
				expect(parsed.result.count).toBe(3);
				expect(parsed.result.results).toHaveLength(3);

				// First pair should succeed
				expect(parsed.result.results[0].hours).toBe(2);

				// Second pair should be an error object
				expect(parsed.result.results[1]).toHaveProperty("error");
				expect(parsed.result.results[1].index).toBe(1);
				expect(parsed.result.results[1].error).toMatch(
					/Invalid base_time at index 1/,
				);

				// Third pair should succeed
				expect(parsed.result.results[2].hours).toBe(4);
			});

			it("should handle invalid timestamps in compare_time array", async () => {
				const result = await handleTimeCalculator({
					operation: "duration_between",
					interaction_mode: "pairwise",
					base_time: [
						"2024-01-01T10:00:00Z",
						"2024-01-02T10:00:00Z",
						"2024-01-03T10:00:00Z",
					],
					compare_time: [
						"2024-01-01T12:00:00Z",
						"definitely-not-a-date", // This should fail
						"2024-01-03T15:30:00Z",
					],
				});

				const parsed = parseResult(result);

				expect(parsed.operation).toBe("duration_between");
				expect(parsed.interaction_mode).toBe("pairwise");
				expect(parsed.result.count).toBe(3);

				// First result should succeed
				expect(parsed.result.results[0].hours).toBe(2);

				// Second result should be error
				expect(parsed.result.results[1]).toHaveProperty("error");
				expect(parsed.result.results[1].index).toBe(1);
				expect(parsed.result.results[1].error).toMatch(
					/Invalid compare_time at index 1/,
				);

				// Third result should succeed
				expect(parsed.result.results[2].hours).toBe(5);
				expect(parsed.result.results[2].minutes).toBe(30);
			});

			it("should handle multiple invalid timestamps in same batch", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "pairwise",
					base_time: [
						"invalid-base-1",
						"2024-01-02T10:00:00Z",
						"invalid-base-2",
					],
					compare_time: [
						"2024-01-01T12:00:00Z",
						"invalid-compare",
						"2024-01-03T15:00:00Z",
					],
				});

				const parsed = parseResult(result);

				expect(parsed.result.count).toBe(3);
				expect(parsed.result.results).toHaveLength(3);

				// All should be errors since at least one timestamp in each pair is invalid
				expect(parsed.result.results[0]).toHaveProperty("error");
				expect(parsed.result.results[1]).toHaveProperty("error");
				expect(parsed.result.results[2]).toHaveProperty("error");
			});

			it("should handle completely successful pairwise batch", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "pairwise",
					base_time: [
						"2024-01-01T09:00:00Z",
						"2024-01-02T11:00:00Z",
						"2024-01-03T13:00:00Z",
						"2024-01-04T15:00:00Z",
					],
					compare_time: [
						"2024-01-01T10:00:00Z", // 1 hour
						"2024-01-02T13:00:00Z", // 2 hours
						"2024-01-03T16:00:00Z", // 3 hours
						"2024-01-04T19:00:00Z", // 4 hours
					],
				});

				const parsed = parseResult(result);

				expect(parsed.result.count).toBe(4);
				expect(parsed.result.results[0].hours).toBe(1);
				expect(parsed.result.results[1].hours).toBe(2);
				expect(parsed.result.results[2].hours).toBe(3);
				expect(parsed.result.results[3].hours).toBe(4);
			});

			it("should handle non-pairwise batch modes correctly", async () => {
				const result = await handleTimeCalculator({
					operation: "diff",
					interaction_mode: "single_to_many",
					base_time: "2024-01-01T12:00:00Z",
					compare_time: ["2024-01-01T15:00:00Z", "2024-01-01T18:00:00Z"],
				});

				const parsed = parseResult(result);

				expect(parsed.result.count).toBe(2);
				expect(parsed.result.results).toHaveLength(2);
				expect(parsed.result.results[0].hours).toBe(3);
				expect(parsed.result.results[1].hours).toBe(6);
			});
		});
	});

	describe("debug mode configuration", () => {
		it("should not include metadata by default (debug disabled)", async () => {
			// Ensure debug mode is disabled
			configManager.setDebugMode(false);

			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "2024-01-01T12:00:00Z",
				hours: 2,
			});

			const parsed = parseResult(result);

			expect(parsed.metadata).toBeUndefined();
			expect(parsed.result_timezone).toBe("America/New_York");
		});

		it("should include full metadata when debug mode is enabled", async () => {
			// Enable debug mode
			configManager.setDebugMode(true);

			const result = await handleTimeCalculator({
				operation: "add",
				base_time: "2024-01-01T12:00:00Z",
				hours: 2,
			});

			const parsed = parseResult(result);

			expect(parsed.metadata).toBeDefined();
			expect(parsed.metadata.calculation_timezone).toBeDefined();
			expect(parsed.metadata.calculation_time).toBeDefined();
			expect(typeof parsed.metadata.calculation_time).toBe("string");
			// Should be a valid ISO timestamp
			expect(() => new Date(parsed.metadata.calculation_time)).not.toThrow();

			// Disable debug mode for other tests
			configManager.setDebugMode(false);
		});

		it("should not include metadata in error responses by default", async () => {
			// Ensure debug mode is disabled
			configManager.setDebugMode(false);

			const result = await handleTimeCalculator({
				operation: "invalid_operation" as "add",
			});

			const parsed = parseResult(result);

			expect(parsed.success).toBe(false);
			expect(parsed.metadata).toBeUndefined();
		});

		it("should include metadata in error responses when debug mode is enabled", async () => {
			// Enable debug mode
			configManager.setDebugMode(true);

			const result = await handleTimeCalculator({
				operation: "invalid_operation" as "add",
			});

			const parsed = parseResult(result);

			expect(parsed.success).toBe(false);
			expect(parsed.metadata).toBeDefined();
			expect(parsed.metadata.calculation_timezone).toBeDefined();
			expect(parsed.metadata.calculation_time).toBeDefined();
			expect(typeof parsed.metadata.calculation_time).toBe("string");

			// Disable debug mode for other tests
			configManager.setDebugMode(false);
		});
	});

	describe("stats operation - human-readable formatting", () => {
		it("should display correct human-readable durations instead of relative times", async () => {
			const result = await handleTimeCalculator({
				operation: "stats",
				base_time: [
					"2024-01-01T00:00:00Z",
					"2024-01-01T00:00:00Z",
					"2024-01-01T00:00:00Z",
				],
				compare_time: [
					"2024-01-08T00:00:00Z", // 7 days
					"2024-01-15T00:00:00Z", // 14 days
					"2024-01-22T00:00:00Z", // 21 days
				],
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("stats");
			expect(parsed.result.duration_analysis).toBeDefined();

			// Should show proper duration formatting, not relative times like "55 years ago"
			expect(parsed.result.duration_analysis.min_duration_human).toBe("7 days");
			expect(parsed.result.duration_analysis.max_duration_human).toBe(
				"21 days",
			);
			expect(parsed.result.duration_analysis.mean_duration_human).toBe(
				"14 days",
			);
			expect(parsed.result.duration_analysis.median_duration_human).toBe(
				"14 days",
			);

			// Verify the mathematical calculations are correct
			expect(parsed.result.duration_analysis.min_duration_ms).toBe(604800000); // 7 days in ms
			expect(parsed.result.duration_analysis.max_duration_ms).toBe(1814400000); // 21 days in ms
			expect(parsed.result.duration_analysis.mean_duration_ms).toBe(1209600000); // 14 days in ms
			expect(parsed.result.duration_analysis.std_deviation_ms).toBeGreaterThan(
				0,
			); // Should have variation
		});

		it("should format complex durations with multiple time units", async () => {
			const result = await handleTimeCalculator({
				operation: "stats",
				base_time: ["2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z"],
				compare_time: [
					"2024-01-01T01:30:45Z", // 1 hour, 30 minutes, 45 seconds
					"2024-01-03T14:45:30Z", // 2 days, 14 hours, 45 minutes, 30 seconds
				],
			});

			const parsed = parseResult(result);

			expect(parsed.result.duration_analysis.min_duration_human).toBe(
				"1 hour, 30 minutes, 45 seconds",
			);
			expect(parsed.result.duration_analysis.max_duration_human).toBe(
				"2 days, 14 hours, 45 minutes, 30 seconds",
			);
		});

		it("should format timestamp analysis human-readable spans correctly", async () => {
			const result = await handleTimeCalculator({
				operation: "stats",
				base_time: [
					"2024-01-01T08:00:00Z",
					"2024-01-02T09:15:00Z",
					"2024-01-03T07:45:00Z",
					"2024-01-04T08:30:00Z",
				],
			});

			const parsed = parseResult(result);

			expect(parsed.operation).toBe("stats");
			expect(parsed.result.timestamp_analysis).toBeDefined();

			// Should show proper duration formatting for time spans
			expect(parsed.result.timestamp_analysis.total_span_human).not.toContain(
				"years ago",
			);
			expect(parsed.result.timestamp_analysis.total_span_human).toMatch(
				/\d+ days/,
			); // Should be in days format

			// Interval analysis should also be formatted correctly
			if (parsed.result.interval_analysis) {
				expect(
					parsed.result.interval_analysis.mean_interval_human,
				).not.toContain("years ago");
				expect(parsed.result.interval_analysis.mean_interval_human).toMatch(
					/\d+ (day|hour|minute)/,
				);
			}
		});

		it("should handle edge cases in duration formatting", async () => {
			const result = await handleTimeCalculator({
				operation: "stats",
				base_time: ["2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z"],
				compare_time: [
					"2024-01-01T00:00:01Z", // 1 second
					"2024-01-01T00:01:00Z", // 1 minute
				],
			});

			const parsed = parseResult(result);

			expect(parsed.result.duration_analysis.min_duration_human).toBe(
				"1 second",
			);
			expect(parsed.result.duration_analysis.max_duration_human).toBe(
				"1 minute",
			);
		});

		it("should handle zero and negative durations", async () => {
			const result = await handleTimeCalculator({
				operation: "stats",
				base_time: ["2024-01-15T12:00:00Z", "2024-01-15T12:00:00Z"],
				compare_time: [
					"2024-01-15T12:00:00Z", // 0 duration
					"2024-01-15T10:00:00Z", // negative 2 hours
				],
			});

			const parsed = parseResult(result);

			expect(parsed.result.duration_analysis.min_duration_human).toBe(
				"-2 hours",
			);
			// Note: formatDuration should handle negative durations with minus sign
		});
	});
});
