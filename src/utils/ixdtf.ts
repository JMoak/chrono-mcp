/**
 * RFC 9557 (IXDTF) parsing and serialization.
 *
 * The Internet Extended Date/Time Format extends RFC 3339 timestamps with
 * bracketed annotations, most importantly a named IANA time zone:
 *
 * ```text
 * 2026-08-09T15:00:00-04:00[America/New_York]
 * 2026-08-09T19:00:00Z[Asia/Tokyo]
 * 2026-08-09T15:00:00[Europe/Paris]
 * 2026-08-09T15:00:00+05:30[+05:30]
 * ```
 *
 * A named zone survives DST arithmetic where a bare offset cannot, which is
 * why IXDTF is the serialization format of the JS Temporal API. This module
 * is the single parsing entry point for all tool inputs: it accepts plain
 * ISO 8601 / RFC 3339 strings unchanged and layers IXDTF semantics on top.
 *
 * Consistency semantics follow RFC 9557 and Temporal:
 * - `Z` plus a zone annotation is valid ("UTC instant, local zone known"):
 *   the instant is projected into the annotated zone.
 * - A numeric offset that disagrees with the annotated zone's offset at that
 *   instant is rejected as inconsistent rather than silently reinterpreted.
 * - A timestamp with no offset is interpreted as wall-clock time in the
 *   annotated zone.
 * - Critical annotations (`[!...]`) that this server cannot honor are
 *   rejected, per RFC 9557; non-critical unknown annotations are ignored.
 *
 * Parse failures are reported as invalid Luxon DateTimes (with reason and
 * explanation) rather than thrown, matching how tool handlers already treat
 * `DateTime.fromISO` results.
 *
 * @module ixdtf
 */

import { DateTime } from "luxon";
import { isValidTimezone } from "./date-utils.js";

/** Matches a trailing UTC designator or numeric offset (colon optional). */
const SELF_ZONED_RE = /(?:[Zz]|[+-]\d{2}:?\d{2})$/;

/** Matches a trailing numeric offset specifically (not Z). */
const NUMERIC_OFFSET_RE = /[+-]\d{2}:?\d{2}$/;

/** Matches one bracketed annotation: optional critical flag, then body. */
const ANNOTATION_RE = /\[(!?)([^\]]+)\]/g;

/** Matches an offset-form time zone annotation body, e.g. "+05:30". */
const OFFSET_ANNOTATION_RE = /^[+-]\d{2}:\d{2}$/;

/** Calendar annotation values equivalent to the ISO calendar this server uses. */
const SUPPORTED_CALENDARS = new Set(["iso8601", "gregory", "gregorian"]);

/**
 * Formats a UTC offset in minutes as a signed hh:mm string.
 *
 * @param minutes - Offset from UTC in minutes
 * @returns Signed offset string such as "+05:30" or "-04:00"
 */
function formatOffset(minutes: number): string {
	const sign = minutes < 0 ? "-" : "+";
	const abs = Math.abs(minutes);
	const hh = String(Math.floor(abs / 60)).padStart(2, "0");
	const mm = String(abs % 60).padStart(2, "0");
	return `${sign}${hh}:${mm}`;
}

/**
 * Parses a plain (non-IXDTF) ISO 8601 string with the historical chrono-mcp
 * zone semantics: a string carrying its own offset is parsed as-is and then
 * *converted* to the requested timezone; a wall-clock string is *interpreted*
 * in the requested timezone.
 *
 * @param timestamp - ISO 8601 datetime string without IXDTF annotations
 * @param timezone - Optional IANA timezone to interpret or convert into
 * @returns Parsed DateTime (invalid DateTime on failure)
 */
function parsePlainISO(timestamp: string, timezone?: string): DateTime {
	const selfZoned = SELF_ZONED_RE.test(timestamp);
	if (timezone && !selfZoned) {
		return DateTime.fromISO(timestamp, { zone: timezone });
	}
	const dt = DateTime.fromISO(timestamp);
	return timezone && dt.isValid ? dt.setZone(timezone) : dt;
}

/**
 * Parses an ISO 8601 / RFC 3339 / RFC 9557 (IXDTF) datetime string.
 *
 * This is the single parsing entry point for tool inputs. Plain ISO strings
 * behave exactly as before; IXDTF zone annotations are resolved with
 * Temporal-compatible consistency rules (see module docs).
 *
 * When both an IXDTF zone annotation and a `timezone` parameter are present,
 * the annotation is authoritative for *interpreting* the timestamp and the
 * parameter then *converts* the result, mirroring how self-zoned plain ISO
 * strings interact with the timezone parameter.
 *
 * @param input - Datetime string, optionally with IXDTF annotations
 * @param timezone - Optional IANA timezone to interpret or convert into
 * @returns Parsed DateTime; on failure an invalid DateTime whose
 *          `invalidReason`/`invalidExplanation` describe the problem
 */
export function parseInstant(input: string, timezone?: string): DateTime {
	const trimmed = input.trim();
	const bracket = trimmed.indexOf("[");
	if (bracket === -1) {
		return parsePlainISO(trimmed, timezone);
	}

	const timestamp = trimmed.slice(0, bracket);
	const suffix = trimmed.slice(bracket);

	let zoneTag: string | undefined;
	let consumed = 0;
	for (const match of suffix.matchAll(ANNOTATION_RE)) {
		if (match.index !== consumed) {
			return DateTime.invalid(
				"malformed IXDTF suffix",
				`unexpected characters in annotation suffix: ${suffix}`,
			);
		}
		consumed += match[0].length;
		const critical = match[1] === "!";
		const body = match[2] ?? "";
		const eq = body.indexOf("=");
		if (eq === -1) {
			if (zoneTag !== undefined) {
				return DateTime.invalid(
					"malformed IXDTF suffix",
					`multiple time zone annotations in: ${suffix}`,
				);
			}
			zoneTag = body;
		} else {
			const key = body.slice(0, eq);
			const value = body.slice(eq + 1);
			if (key === "u-ca") {
				if (critical && !SUPPORTED_CALENDARS.has(value)) {
					return DateTime.invalid(
						"unsupported critical annotation",
						`calendar "${value}" is not supported (only the ISO 8601 calendar)`,
					);
				}
			} else if (critical) {
				return DateTime.invalid(
					"unsupported critical annotation",
					`unrecognized critical annotation [!${body}]`,
				);
			}
		}
	}
	if (consumed !== suffix.length) {
		return DateTime.invalid(
			"malformed IXDTF suffix",
			`unexpected characters in annotation suffix: ${suffix}`,
		);
	}

	if (zoneTag === undefined) {
		// Annotations present (e.g. [u-ca=iso8601]) but no zone: plain semantics.
		return parsePlainISO(timestamp, timezone);
	}

	let zoneName: string;
	if (OFFSET_ANNOTATION_RE.test(zoneTag)) {
		zoneName = `UTC${zoneTag}`;
	} else if (isValidTimezone(zoneTag)) {
		zoneName = zoneTag;
	} else {
		return DateTime.invalid(
			"unknown time zone annotation",
			`[${zoneTag}] is not a valid IANA time zone identifier`,
		);
	}

	let dt: DateTime;
	if (/[Zz]$/.test(timestamp)) {
		// RFC 9557: Z + zone annotation is consistent — project the UTC
		// instant into the annotated zone.
		dt = DateTime.fromISO(timestamp);
		if (dt.isValid) dt = dt.setZone(zoneName);
	} else if (NUMERIC_OFFSET_RE.test(timestamp)) {
		const withOffset = DateTime.fromISO(timestamp, { setZone: true });
		if (!withOffset.isValid) return withOffset;
		const zoned = withOffset.setZone(zoneName);
		if (zoned.offset !== withOffset.offset) {
			return DateTime.invalid(
				"inconsistent offset",
				`offset ${formatOffset(withOffset.offset)} disagrees with ${zoneTag} ` +
					`(expected ${formatOffset(zoned.offset)} at that instant)`,
			);
		}
		dt = zoned;
	} else {
		dt = DateTime.fromISO(timestamp, { zone: zoneName });
	}

	if (!dt.isValid) return dt;
	return timezone ? dt.setZone(timezone) : dt;
}

/**
 * Serializes a DateTime as an RFC 9557 (IXDTF) string.
 *
 * Emits the ISO 8601 timestamp followed by the bracketed zone: the IANA name
 * when the DateTime carries one (including the system zone resolved to its
 * IANA name), otherwise the fixed offset in bracket form, matching Temporal's
 * serialization behavior.
 *
 * @param dt - The DateTime to serialize
 * @returns IXDTF string such as "2026-08-09T15:00:00.000-04:00[America/New_York]",
 *          or empty string if the DateTime is invalid
 */
export function toIXDTF(dt: DateTime): string {
	const iso = dt.toISO();
	if (!iso) return "";
	const zoneName = dt.zoneName;
	if (zoneName && isValidTimezone(zoneName)) {
		return `${iso}[${zoneName}]`;
	}
	const offsetMatch = iso.match(/([+-]\d{2}:\d{2}|Z)$/);
	if (offsetMatch) {
		const offset = offsetMatch[1] === "Z" ? "+00:00" : offsetMatch[1];
		return `${iso}[${offset}]`;
	}
	return iso;
}
