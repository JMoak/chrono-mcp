import { bench, describe } from "vitest";
import { handleTimeCalculator } from "./time-calculator.js";

// Evidence behind MAX_OPERATIONS (10,000): every batch operation at the cap
// should complete comfortably within an interactive tool-call budget.
const N = 10_000;
const BASE_MS = Date.UTC(2026, 0, 1);

const timestamps = Array.from({ length: N }, (_, i) =>
	new Date(BASE_MS + i * 61_000).toISOString(),
);
const reversed = [...timestamps].reverse();
const half = N / 2;
const pairsA = timestamps.slice(0, half);
const pairsB = timestamps.slice(half);
const big100k = Array.from({ length: 100_000 }, (_, i) =>
	new Date(BASE_MS + i * 1000).toISOString(),
);

describe(`batch operations at MAX_OPERATIONS scale (${N} items)`, () => {
	bench("stats over 10k timestamps", async () => {
		await handleTimeCalculator({ operation: "stats", base_time: timestamps });
	});

	bench("sort of 10k reverse-ordered timestamps", async () => {
		await handleTimeCalculator({ operation: "sort", base_time: reversed });
	});

	bench("add 1 day to 10k timestamps", async () => {
		await handleTimeCalculator({
			operation: "add",
			base_time: timestamps,
			timezone: "UTC",
			days: 1,
		});
	});

	bench("pairwise diff of 5k timestamp pairs", async () => {
		await handleTimeCalculator({
			operation: "diff",
			interaction_mode: "pairwise",
			base_time: pairsA,
			compare_time: pairsB,
		});
	});

	bench("stats over 100k timestamps (aggregate cap)", async () => {
		await handleTimeCalculator({ operation: "stats", base_time: big100k });
	});

	bench("expand hourly rrule to 10k occurrences", async () => {
		await handleTimeCalculator({
			operation: "expand",
			recurrence: "FREQ=HOURLY",
			base_time: "2026-01-01T00:00:00Z",
			max_occurrences: N,
		});
	});
});
