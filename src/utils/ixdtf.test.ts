import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";
import { parseInstant, toIXDTF } from "./ixdtf.js";

describe("parseInstant — plain ISO passthrough", () => {
	it("parses a plain ISO string with offset", () => {
		const dt = parseInstant("2026-08-09T15:00:00-04:00");
		expect(dt.isValid).toBe(true);
		expect(dt.toUTC().toISO()).toBe("2026-08-09T19:00:00.000Z");
	});

	it("interprets wall-clock strings in the timezone parameter", () => {
		const dt = parseInstant("2026-08-09T15:00:00", "Asia/Tokyo");
		expect(dt.isValid).toBe(true);
		expect(dt.zoneName).toBe("Asia/Tokyo");
		expect(dt.toUTC().toISO()).toBe("2026-08-09T06:00:00.000Z");
	});

	it("converts self-zoned strings to the timezone parameter", () => {
		const dt = parseInstant("2026-08-09T15:00:00Z", "Asia/Tokyo");
		expect(dt.zoneName).toBe("Asia/Tokyo");
		expect(dt.hour).toBe(0);
		expect(dt.day).toBe(10);
	});

	it("rejects garbage", () => {
		expect(parseInstant("not a date").isValid).toBe(false);
	});
});

describe("parseInstant — IXDTF zone annotations", () => {
	it("parses a consistent offset + named zone", () => {
		const dt = parseInstant("2026-08-09T15:00:00-04:00[America/New_York]");
		expect(dt.isValid).toBe(true);
		expect(dt.zoneName).toBe("America/New_York");
		expect(dt.toUTC().toISO()).toBe("2026-08-09T19:00:00.000Z");
	});

	it("rejects an inconsistent offset for the annotated zone", () => {
		// New York is on daylight time (-04:00) in August
		const dt = parseInstant("2026-08-09T15:00:00-05:00[America/New_York]");
		expect(dt.isValid).toBe(false);
		expect(dt.invalidReason).toBe("inconsistent offset");
		expect(dt.invalidExplanation).toContain("-05:00");
		expect(dt.invalidExplanation).toContain("-04:00");
	});

	it("accepts the same offset in winter when it is consistent", () => {
		// New York is on standard time (-05:00) in January
		const dt = parseInstant("2026-01-09T15:00:00-05:00[America/New_York]");
		expect(dt.isValid).toBe(true);
		expect(dt.zoneName).toBe("America/New_York");
	});

	it("projects Z timestamps into the annotated zone (RFC 9557 Z semantics)", () => {
		const dt = parseInstant("2026-08-09T19:00:00Z[America/New_York]");
		expect(dt.isValid).toBe(true);
		expect(dt.zoneName).toBe("America/New_York");
		expect(dt.hour).toBe(15);
		expect(dt.offset).toBe(-240);
	});

	it("interprets offset-less timestamps as wall-clock in the annotated zone", () => {
		const dt = parseInstant("2026-08-09T15:00:00[Europe/Paris]");
		expect(dt.isValid).toBe(true);
		expect(dt.zoneName).toBe("Europe/Paris");
		expect(dt.toUTC().toISO()).toBe("2026-08-09T13:00:00.000Z");
	});

	it("supports offset-form zone annotations", () => {
		const dt = parseInstant("2026-08-09T15:00:00+05:30[+05:30]");
		expect(dt.isValid).toBe(true);
		expect(dt.toUTC().toISO()).toBe("2026-08-09T09:30:00.000Z");
	});

	it("lets the timezone parameter convert an annotated result", () => {
		const dt = parseInstant(
			"2026-08-09T15:00:00[America/New_York]",
			"Asia/Tokyo",
		);
		expect(dt.zoneName).toBe("Asia/Tokyo");
		expect(dt.toUTC().toISO()).toBe("2026-08-09T19:00:00.000Z");
	});

	it("rejects unknown zone annotations", () => {
		const dt = parseInstant("2026-08-09T15:00:00[Mars/Olympus_Mons]");
		expect(dt.isValid).toBe(false);
		expect(dt.invalidReason).toBe("unknown time zone annotation");
	});
});

describe("parseInstant — annotation edge cases", () => {
	it("ignores a non-critical calendar annotation", () => {
		const dt = parseInstant("2026-08-09T15:00:00Z[u-ca=hebrew]");
		expect(dt.isValid).toBe(true);
	});

	it("accepts a critical ISO calendar annotation", () => {
		const dt = parseInstant(
			"2026-08-09T15:00:00Z[America/New_York][!u-ca=iso8601]",
		);
		expect(dt.isValid).toBe(true);
		expect(dt.zoneName).toBe("America/New_York");
	});

	it("rejects a critical non-ISO calendar annotation", () => {
		const dt = parseInstant("2026-08-09T15:00:00Z[!u-ca=hebrew]");
		expect(dt.isValid).toBe(false);
		expect(dt.invalidReason).toBe("unsupported critical annotation");
	});

	it("rejects unknown critical annotations", () => {
		const dt = parseInstant("2026-08-09T15:00:00Z[!x-corp=payroll]");
		expect(dt.isValid).toBe(false);
		expect(dt.invalidReason).toBe("unsupported critical annotation");
	});

	it("ignores unknown non-critical annotations", () => {
		const dt = parseInstant("2026-08-09T15:00:00Z[x-corp=payroll]");
		expect(dt.isValid).toBe(true);
	});

	it("rejects multiple zone annotations", () => {
		const dt = parseInstant("2026-08-09T15:00:00Z[UTC][America/New_York]");
		expect(dt.isValid).toBe(false);
		expect(dt.invalidReason).toBe("malformed IXDTF suffix");
	});

	it("rejects stray characters in the suffix", () => {
		const dt = parseInstant("2026-08-09T15:00:00Z[America/New_York]x");
		expect(dt.isValid).toBe(false);
		expect(dt.invalidReason).toBe("malformed IXDTF suffix");
	});
});

describe("toIXDTF", () => {
	it("emits the IANA zone in brackets", () => {
		const dt = DateTime.fromISO("2026-08-09T15:00:00", {
			zone: "America/New_York",
		});
		expect(toIXDTF(dt)).toBe(
			"2026-08-09T15:00:00.000-04:00[America/New_York]",
		);
	});

	it("emits UTC as a named zone", () => {
		const dt = DateTime.fromISO("2026-08-09T15:00:00Z", { zone: "UTC" });
		expect(toIXDTF(dt)).toBe("2026-08-09T15:00:00.000Z[UTC]");
	});

	it("falls back to bracketed offset for fixed-offset zones", () => {
		const dt = DateTime.fromISO("2026-08-09T15:00:00+05:30", {
			setZone: true,
		});
		expect(toIXDTF(dt)).toBe("2026-08-09T15:00:00.000+05:30[+05:30]");
	});

	it("round-trips through parseInstant", () => {
		const original = parseInstant("2026-03-08T01:59:59-05:00[America/New_York]");
		const reparsed = parseInstant(toIXDTF(original));
		expect(reparsed.isValid).toBe(true);
		expect(reparsed.toMillis()).toBe(original.toMillis());
		expect(reparsed.zoneName).toBe("America/New_York");
	});

	it("returns empty string for invalid DateTimes", () => {
		expect(toIXDTF(DateTime.invalid("test"))).toBe("");
	});
});
