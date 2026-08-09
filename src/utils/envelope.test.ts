import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { formatCompactDuration, SessionClock } from "./envelope.js";

/** Builds a fake clock that returns queued instants, repeating the last one. */
function fakeClock(...isoTimes: string[]) {
	let index = 0;
	return () => {
		const iso = isoTimes[Math.min(index, isoTimes.length - 1)] ?? "";
		index++;
		return DateTime.fromISO(iso, { zone: "America/New_York" });
	};
}

describe("formatCompactDuration", () => {
	it("clamps negative and sub-second durations", () => {
		expect(formatCompactDuration(-500)).toBe("<1s");
		expect(formatCompactDuration(0)).toBe("<1s");
		expect(formatCompactDuration(999)).toBe("<1s");
	});

	it("formats seconds", () => {
		expect(formatCompactDuration(1000)).toBe("1s");
		expect(formatCompactDuration(59_999)).toBe("59s");
	});

	it("formats minutes with optional seconds", () => {
		expect(formatCompactDuration(60_000)).toBe("1m");
		expect(formatCompactDuration(134_000)).toBe("2m14s");
		expect(formatCompactDuration(3_599_000)).toBe("59m59s");
	});

	it("formats hours with optional minutes, dropping seconds", () => {
		expect(formatCompactDuration(3_600_000)).toBe("1h");
		expect(formatCompactDuration(3_780_000)).toBe("1h3m");
		expect(formatCompactDuration(3_780_500 + 45_000)).toBe("1h3m");
	});

	it("formats days with optional hours, dropping minutes", () => {
		expect(formatCompactDuration(86_400_000)).toBe("1d");
		expect(formatCompactDuration(86_400_000 * 2 + 3_600_000 * 4)).toBe("2d4h");
		expect(formatCompactDuration(86_400_000 + 60_000 * 30)).toBe("1d");
	});
});

describe("SessionClock", () => {
	it("reports first call without elapsed metrics", () => {
		const clock = new SessionClock(
			fakeClock("2026-08-09T15:02:11.123", "2026-08-09T15:02:11.123"),
		);
		expect(clock.stamp()).toMatch(
			/^⏱ now 2026-08-09T15:02:11\.123-04:00 \(Sun\) · first call this session( · tzdb \S+)?$/,
		);
	});

	it("reports elapsed since last call, session age, and call number", () => {
		const clock = new SessionClock(
			fakeClock(
				"2026-08-09T15:00:00.000", // constructor: session start
				"2026-08-09T15:00:05.000", // call #1
				"2026-08-09T15:46:57.000", // call #2
			),
		);
		clock.stamp();
		expect(clock.stamp()).toBe(
			"⏱ now 2026-08-09T15:46:57.000-04:00 (Sun) · +46m52s since last call · session 46m57s · call #2",
		);
	});

	it("measures since-last-call from the previous call, not session start", () => {
		const clock = new SessionClock(
			fakeClock(
				"2026-08-09T09:00:00.000",
				"2026-08-09T09:00:01.000", // call #1
				"2026-08-09T09:30:01.000", // call #2
				"2026-08-09T09:30:03.000", // call #3
			),
		);
		clock.stamp();
		clock.stamp();
		expect(clock.stamp()).toContain("+2s since last call");
		expect(clock.stamp()).toContain("call #4");
	});

	it("includes the weekday for the stamped instant", () => {
		const clock = new SessionClock(
			fakeClock("2026-12-25T08:00:00.000", "2026-12-25T08:00:00.000"),
		);
		expect(clock.stamp()).toContain("(Fri)");
	});
});
