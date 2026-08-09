# chrono-mcp

**The MCP server for time math at scale.** Batch-crunch up to 100,000 timestamps in a single tool call, speak the industry's temporal interchange standards (RFC 9557 IXDTF, RFC 5545 RRULE, ISO 8601 repeating intervals), and give your agent a passive sense of passing time on every response. Powered by Luxon, DST-correct by construction, and every limit is benchmark-backed.

[![NPM Version](https://img.shields.io/npm/v/@jmoak/chrono-mcp)](https://www.npmjs.com/package/@jmoak/chrono-mcp)
[![Downloads](https://img.shields.io/npm/dm/@jmoak/chrono-mcp)](https://www.npmjs.com/package/@jmoak/chrono-mcp)
[![Node Version](https://img.shields.io/node/v/@jmoak/chrono-mcp)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Code Style: Biome](https://img.shields.io/badge/Code%20Style-Biome-60a5fa)](https://biomejs.dev/)
[![Tests: Vitest](https://img.shields.io/badge/Tests-Vitest-6E9F18)](https://vitest.dev/)
[![MCP Server](https://img.shields.io/badge/MCP-Server-0b7285)](https://modelcontextprotocol.io/)
[![Powered by Luxon](https://img.shields.io/badge/Powered%20by-Luxon-0a3d62)](https://github.com/moment/luxon)
[![smithery badge](https://smithery.ai/badge/@JMoak/chrono-mcp)](https://smithery.ai/server/@JMoak/chrono-mcp)

## Quick Start

```bash
npx @jmoak/chrono-mcp
```

### Run as local HTTP server

```bash
npm install
npm run build
npm run start:http
# Server listens on http://localhost:8000/mcp (health check at /health)
```
## MCP Client Configuration

Configure your MCP client to launch `chrono-mcp` via `npx`. Below are client-specific examples.

### Claude Code

Ask Claude! Here's the configuration:

```jsonc
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"]
    }
  }
}
```

### Cursor

Reference: [Cursor MCP docs](https://docs.cursor.com/context/model-context-protocol#configuring-mcp-servers)

```jsonc
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"]
    },
    "chrono-mcp-http": {
      "type": "http",
      "url": "http://localhost:8000/mcp"
    }
  }
}
```


## Why chrono-mcp

LLMs are famously bad at time: they miscount weekdays, lose track of elapsed time between turns, and fall apart on DST math. chrono-mcp fixes all three — and does it at bulk scale, in the formats the rest of the industry already speaks.

- **Bulk by design** - 10,000 calculations per request for per-item operations; **100,000 timestamps** for `stats`, which returns pure aggregates. Every cap is proven by a benchmark you can run yourself (`npm run bench`) — per-item ops finish in under 100ms at the cap, 100k-item stats in ~460ms
- **RFC 9557 (IXDTF) Interchange** - All datetime inputs accept bracketed IANA zone annotations (`2026-08-09T15:00:00-04:00[America/New_York]`) with Temporal-compatible offset-consistency validation, plus an `ixdtf` output format — the serialization standard of the JS Temporal API
- **Recurrence Expansion** - `expand` turns RFC 5545 RRULEs (the format Google Calendar, Outlook, and Apple Calendar store) and ISO 8601 repeating intervals into concrete occurrences — DST-correct, window-bounded, with explicit truncation reporting
- **Temporal Context Envelope** - Every tool response carries a compact trailing line with the current time, weekday, elapsed time since the agent's previous call, session age, and tzdb version — passive time-awareness on every interaction
- **Batch Error Isolation** - One bad timestamp doesn't sink a 10,000-item batch: invalid entries are skipped and reported (`invalid_count` + samples), never silently dropped
- **Token-Optimized Output** - Dynamically shaped responses that maximize information density while minimizing token usage
- **Global Timezone Support** - All IANA timezone identifiers, with ISO, RFC2822, SQL, and locale-aware formatting
- **Type Safety** - Zod validation on every parameter, MCP-compliant errors, strict TypeScript throughout

## Documentation

- **[API Reference](./API.md)** - Complete documentation of all tools, parameters, and examples
- **[Architecture](./ARCHITECTURE.md)** - System architecture and design principles
- **[Examples](./examples/)** - Practical usage examples and patterns

## Available Tools

### GET TIME

Get current time or convert times across timezones with flexible formatting.

**Parameters:**
- `datetime` (string, optional): ISO datetime string. Defaults to current time
- `timezones` (array, optional): List of timezone names for conversions
- `formats` (array, optional): Output formats (`iso`, `rfc2822`, `sql`, `local`, `localeString`, `short`, `medium`, `long`, `full`)
- `locale` (string, optional): Locale for formatting (e.g., `en-US`, `fr-FR`, `ja-JP`)
- `includeOffsets` (boolean, optional): Include UTC offsets in output

**Example:**

Input
```json
{
  "datetime": "2024-01-01T12:00:00Z",
  "timezones": ["America/New_York", "Asia/Tokyo"],
  "includeOffsets": true
}
```

Output
```json
{
  "baseTime": "2024-01-01T12:00:00.000Z",
  "America/New_York": "2024-01-01T07:00:00.000-05:00",
  "Asia/Tokyo": "2024-01-01T21:00:00.000+09:00"
}
```

### TIME CALCULATOR

Perform time arithmetic at any scale — single conversions to 100k-item batch analysis.

**Operations:**
- `add` - Add duration to a datetime
- `subtract` - Subtract duration from a datetime
- `diff` - Calculate simple difference in various units
- `duration_between` - Detailed duration breakdown between two times
- `stats` - Statistical analysis of time series and durations (up to **100,000** timestamps per call)
- `sort` - Sort timestamps chronologically
- `expand` - Expand an RFC 5545 RRULE or ISO 8601 repeating interval into occurrences

Every operation accepts arrays as well as single values, with `interaction_mode` controlling how base and compare arrays combine (`pairwise`, `cross_product`, `single_to_many`, …). Invalid entries in a batch are skipped and reported — never silently dropped, never fatal.

**Expand example:**

Input
```json
{
  "operation": "expand",
  "recurrence": "FREQ=WEEKLY;BYDAY=TU;COUNT=4",
  "base_time": "2026-02-24T09:00:00[America/New_York]",
  "occurrence_format": "ixdtf"
}
```

Output (result excerpt — note the wall-clock time held across the DST transition)
```json
{
  "rule_type": "rrule",
  "count": 4,
  "truncated": false,
  "occurrences": [
    "2026-02-24T09:00:00.000-05:00[America/New_York]",
    "2026-03-03T09:00:00.000-05:00[America/New_York]",
    "2026-03-10T09:00:00.000-04:00[America/New_York]",
    "2026-03-17T09:00:00.000-04:00[America/New_York]"
  ]
}
```

Also accepts ISO 8601 repeating intervals (`R5/2026-03-01T14:00:00Z/P1D`), `window_start`/`window_end` bounds, and `max_occurrences` caps (default 100, max 10,000) with explicit `truncated` reporting.

**Bulk stats example** — hand it your entire event log; the response stays tiny no matter how many timestamps go in (up to 100,000):

```json
{
  "operation": "stats",
  "base_time": ["2026-01-01T00:00:00Z", "...99,998 more...", "2026-01-02T03:46:39Z"]
}
```

Output (aggregates only — real excerpt from a 100,000-timestamp call that ran in ~500ms)
```json
{
  "input_analysis": { "base_time_count": 100000 },
  "timestamp_analysis": {
    "earliest": "2026-01-01T00:00:00.000Z",
    "latest": "2026-01-02T03:46:39.000Z",
    "total_span_human": "1 day, 3 hours, 46 minutes, 39 seconds",
    "std_deviation_ms": 28867513
  },
  "interval_analysis": {
    "interval_count": 99999,
    "mean_interval_human": "1 second"
  }
}
```

**Parameters:**
- `operation` (required): Type of calculation
- `interaction_mode` (optional): `auto_detect` | `single_to_many` | `many_to_single` | `pairwise` | `cross_product` | `aggregate`. Defaults to `auto_detect`.
- `base_time` (optional): Base ISO datetime(s). String or array. Defaults to current time.
- `compare_time` (optional): Compare ISO datetime(s) for `diff`/`duration_between`. String or array.
- `timezone` (optional): Timezone for `base_time`
- `compare_time_timezone` (optional): Timezone for `compare_time`
- `years`, `months`, `days`, `hours`, `minutes`, `seconds` (optional): Duration values

**Example:**

Input
```json
{
  "operation": "add",
  "base_time": "2024-12-25T10:00:00Z",
  "days": 5,
  "hours": 3
}
```

Output
```json
{
  "operation": "add",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2024-12-25T10:00:00.000Z",
    "duration": { "days": 5, "hours": 3 }
  },
  "result": "2024-12-30T13:00:00.000Z",
  "result_timezone": "UTC"
}
```

### Temporal Context Envelope

Every tool response includes a second content block — a single ~20-token line giving the calling agent passive time-awareness:

```text
⏱ now 2026-08-09T15:02:11.123-04:00 (Sun) · first call this session
⏱ now 2026-08-09T15:49:03.456-04:00 (Sun) · +46m52s since last call · session 47m1s · call #2
```

LLMs have no innate sense of elapsed time between turns; the envelope makes time passage visible on every interaction with the server — including the weekday, which models frequently miscompute. Disable it by setting `CHRONO_ENVELOPE=off` in the server environment.

<details>
<summary><strong>Development</strong></summary>

### Prerequisites
- Node.js >= 22.0.0
- npm or yarn

### Setup
```bash
git clone https://github.com/yourusername/chrono-mcp.git
cd chrono-mcp
npm install
```

### Build
```bash
npm run build
```

### Testing & Inspector
```bash
npm test
npm run test:ui
npm run test:mcp
npm run inspector
```

```bash
npm run bench
```

- `npm test` — Vitest **unit** tests for tool handlers
- `npm run bench` — Vitest benchmarks proving every batch operation at the `MAX_OPERATIONS` cap (10,000 items) completes in well under 100ms
- `npm run test:mcp` — Vibrissa (npm: [`@jmoak/vibrissa`](https://www.npmjs.com/package/@jmoak/vibrissa)) **MCP protocol** cases (requires `npm run build` first; no Python)
- Protocol contracts live in `tests/contracts/*.tdd` and emit to `tests/integration/vibrissa/cases/` via tdd-dsl locally (`npm run contracts:emit` if `tdd-dsl` is on your PATH). CI runs only the committed JSON with `vib run`.

Visit `http://localhost:6274` for the web inspector UI.

### Linting
```bash
npm run lint
npm run lint:fix
```

</details>

## Supported Timezones

Supports all IANA timezone identifiers including:

- **Americas**: `America/New_York`, `America/Los_Angeles`, `America/Toronto`, etc.
- **Europe**: `Europe/London`, `Europe/Paris`, `Europe/Berlin`, etc.
- **Asia**: `Asia/Tokyo`, `Asia/Shanghai`, `Asia/Dubai`, etc.
- **Australia**: `Australia/Sydney`, `Australia/Melbourne`, etc.
- **And 400+ more...**

## Acknowledgments

This project is powered by [Luxon](https://github.com/moment/luxon), the excellent DateTime library that provides robust timezone handling and date arithmetic. We're grateful to the Luxon team for creating such a reliable foundation for temporal operations.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Releases

See [GitHub Releases](https://github.com/JMoak/chrono-mcp/releases) for detailed changes.