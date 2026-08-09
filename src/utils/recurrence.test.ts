import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { expandRecurrence } from "./recurrence.js";

function iso(dt: DateTime): string {
	return dt.toISO() ?? "invalid";
}

describe("expandRecurrence — RRULE", () => {
	it("preserves wall-clock time across the spring-forward DST transition", () => {
		const outcome = expandRecurrence({
			recurrence:
				"DTSTART;TZID=America/New_York:20260224T090000\nRRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=4",
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		const occ = outcome.data.occurrences;
		expect(outcome.data.ruleType).toBe("rrule");
		expect(occ).toHaveLength(4);
		// Every occurrence is 09:00 local despite the offset change on Mar 8
		for (const dt of occ) {
			expect(dt.hour).toBe(9);
			expect(dt.zoneName).toBe("America/New_York");
		}
		expect(occ[1]?.offset).toBe(-300); // EST before Mar 8
		expect(occ[2]?.offset).toBe(-240); // EDT after Mar 8
		expect(outcome.data.truncated).toBe(false);
	});

	it("anchors a bare FREQ rule with the dtstart option", () => {
		const outcome = expandRecurrence({
			recurrence: "FREQ=DAILY;COUNT=3",
			dtstart: DateTime.fromISO("2026-08-09T15:00:00", {
				zone: "Europe/Paris",
			}),
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(outcome.data.occurrences.map(iso)).toEqual([
			"2026-08-09T15:00:00.000+02:00",
			"2026-08-10T15:00:00.000+02:00",
			"2026-08-11T15:00:00.000+02:00",
		]);
	});

	it("resolves last-weekday-of-month via BYSETPOS", () => {
		const outcome = expandRecurrence({
			recurrence: "RRULE:FREQ=MONTHLY;BYDAY=MO,TU,WE,TH,FR;BYSETPOS=-1;COUNT=3",
			dtstart: DateTime.fromISO("2026-01-01T17:00:00", {
				zone: "America/New_York",
			}),
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(
			outcome.data.occurrences.map((dt) => dt.toISODate()),
		).toEqual(["2026-01-30", "2026-02-27", "2026-03-31"]);
	});

	it("caps unbounded rules and reports truncation", () => {
		const outcome = expandRecurrence({
			recurrence: "FREQ=DAILY",
			dtstart: DateTime.fromISO("2026-01-01T00:00:00Z"),
			maxOccurrences: 5,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(outcome.data.occurrences).toHaveLength(5);
		expect(outcome.data.truncated).toBe(true);
	});

	it("honors window bounds", () => {
		const outcome = expandRecurrence({
			recurrence: "FREQ=DAILY;COUNT=31",
			dtstart: DateTime.fromISO("2026-01-01T12:00:00Z"),
			windowStart: DateTime.fromISO("2026-01-10T00:00:00Z"),
			windowEnd: DateTime.fromISO("2026-01-12T23:59:59Z"),
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(outcome.data.occurrences.map((dt) => dt.toISODate())).toEqual([
			"2026-01-10",
			"2026-01-11",
			"2026-01-12",
		]);
	});

	it("errors on an RRULE without any anchor", () => {
		const outcome = expandRecurrence({
			recurrence: "FREQ=DAILY;COUNT=3",
			maxOccurrences: 100,
		});
		expect(outcome.success).toBe(false);
		if (!outcome.success) expect(outcome.error).toContain("DTSTART");
	});

	it("errors on garbage rules", () => {
		const outcome = expandRecurrence({
			recurrence: "FREQ=SOMETIMES",
			dtstart: DateTime.fromISO("2026-01-01T00:00:00Z"),
			maxOccurrences: 10,
		});
		expect(outcome.success).toBe(false);
	});
});

describe("expandRecurrence — ISO 8601 repeating intervals", () => {
	it("expands a bounded daily interval", () => {
		const outcome = expandRecurrence({
			recurrence: "R3/2026-03-01T14:00:00Z/P1D",
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(outcome.data.ruleType).toBe("iso8601_repeating_interval");
		expect(outcome.data.occurrences.map(iso)).toEqual([
			"2026-03-01T14:00:00.000Z",
			"2026-03-02T14:00:00.000Z",
			"2026-03-03T14:00:00.000Z",
		]);
	});

	it("keeps IXDTF-zoned weekly intervals on local wall-clock across DST", () => {
		const outcome = expandRecurrence({
			recurrence: "R4/2026-02-24T09:00:00[America/New_York]/P1W",
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		const occ = outcome.data.occurrences;
		expect(occ).toHaveLength(4);
		for (const dt of occ) {
			expect(dt.hour).toBe(9);
		}
		expect(occ[1]?.offset).toBe(-300); // EST
		expect(occ[2]?.offset).toBe(-240); // EDT — wall-clock preserved
	});

	it("caps unbounded intervals and reports truncation", () => {
		const outcome = expandRecurrence({
			recurrence: "R/2026-01-01T00:00:00Z/PT1H",
			maxOccurrences: 4,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(outcome.data.occurrences).toHaveLength(4);
		expect(outcome.data.truncated).toBe(true);
	});

	it("stops at the window end without truncation", () => {
		const outcome = expandRecurrence({
			recurrence: "R/2026-01-01T00:00:00Z/P1D",
			windowEnd: DateTime.fromISO("2026-01-03T12:00:00Z"),
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(outcome.data.occurrences).toHaveLength(3);
		expect(outcome.data.truncated).toBe(false);
	});

	it("treats R0 as an empty expansion", () => {
		const outcome = expandRecurrence({
			recurrence: "R0/2026-01-01T00:00:00Z/P1D",
			maxOccurrences: 100,
		});
		if (!outcome.success) throw new Error(outcome.error);
		expect(outcome.data.occurrences).toHaveLength(0);
	});

	it("rejects non-positive durations", () => {
		const outcome = expandRecurrence({
			recurrence: "R5/2026-01-01T00:00:00Z/PT0S",
			maxOccurrences: 100,
		});
		expect(outcome.success).toBe(false);
		if (!outcome.success) expect(outcome.error).toContain("positive");
	});

	it("rejects malformed interval bodies", () => {
		const outcome = expandRecurrence({
			recurrence: "R5/2026-01-01T00:00:00Z",
			maxOccurrences: 100,
		});
		expect(outcome.success).toBe(false);
	});

	it("rejects invalid start instants with the IXDTF reason", () => {
		const outcome = expandRecurrence({
			recurrence: "R5/2026-08-09T15:00:00-05:00[America/New_York]/P1D",
			maxOccurrences: 100,
		});
		expect(outcome.success).toBe(false);
		if (!outcome.success) expect(outcome.error).toContain("inconsistent offset");
	});
});
