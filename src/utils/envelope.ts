/**
 * Temporal context envelope for tool responses.
 *
 * Every tool response from chrono-mcp carries a compact, human-readable
 * temporal context line as a trailing content block. This gives the calling
 * agent passive time-awareness on every interaction: the current time (with
 * weekday, which LLMs frequently miscompute), elapsed time since its previous
 * call, and total session age.
 *
 * The envelope is intentionally a single dense line (~15-25 tokens) rather
 * than JSON, in keeping with the project's token-efficiency principles.
 *
 * @module envelope
 *
 * @example
 * ```text
 * ⏱ now 2026-08-09T15:02:11.123-04:00 (Sun) · first call this session
 * ⏱ now 2026-08-09T15:49:03.456-04:00 (Sun) · +46m52s since last call · session 47m1s · call #2
 * ```
 */

import { DateTime } from "luxon";

/**
 * Formats a millisecond duration as a compact human-readable string.
 *
 * Uses at most two units of precision (e.g., "2m14s", "1h3m", "2d4h") so the
 * envelope stays terse regardless of magnitude.
 *
 * @param ms - Duration in milliseconds (negative values are clamped to zero)
 * @returns Compact duration string such as "<1s", "47s", "2m14s", "1h3m", "2d4h"
 */
export function formatCompactDuration(ms: number): string {
	const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
	if (totalSeconds < 1) {
		return "<1s";
	}
	const days = Math.floor(totalSeconds / 86400);
	const hours = Math.floor((totalSeconds % 86400) / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	if (days > 0) {
		return hours > 0 ? `${days}d${hours}h` : `${days}d`;
	}
	if (hours > 0) {
		return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
	}
	if (minutes > 0) {
		return seconds > 0 ? `${minutes}m${seconds}s` : `${minutes}m`;
	}
	return `${seconds}s`;
}

/**
 * Tracks temporal state for a single server session and produces envelope lines.
 *
 * One instance is created per server (per stdio process, or per HTTP server
 * connection via the createServer factory), so elapsed-time measurements are
 * scoped to the conversation the agent is actually having.
 *
 * The clock source is injectable for deterministic testing.
 */
export class SessionClock {
	private readonly now: () => DateTime;
	private readonly startedAtMs: number;
	private lastCallAtMs: number | null = null;
	private callCount = 0;

	/**
	 * @param now - Clock source returning the current DateTime. Defaults to
	 *              `DateTime.now()` (system zone, respects `TZ`).
	 */
	constructor(now: () => DateTime = () => DateTime.now()) {
		this.now = now;
		this.startedAtMs = this.now().toMillis();
	}

	/**
	 * Produces the envelope line for the current moment and records the call.
	 *
	 * The first call in a session reports "first call this session"; subsequent
	 * calls report elapsed time since the previous call, total session age, and
	 * the call number.
	 *
	 * @returns A single-line temporal context string
	 */
	public stamp(): string {
		const t = this.now();
		const nowMs = t.toMillis();
		this.callCount++;

		const head = `⏱ now ${t.toISO()} (${t.toFormat("ccc")})`;
		let tail: string;
		if (this.lastCallAtMs === null) {
			tail = "first call this session";
		} else {
			const sinceLast = formatCompactDuration(nowMs - this.lastCallAtMs);
			const sessionAge = formatCompactDuration(nowMs - this.startedAtMs);
			tail = `+${sinceLast} since last call · session ${sessionAge} · call #${this.callCount}`;
		}

		this.lastCallAtMs = nowMs;
		return `${head} · ${tail}`;
	}
}
