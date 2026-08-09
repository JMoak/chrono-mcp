# API Documentation

Complete reference for the chrono-mcp MCP server tools and their parameters.

## Table of Contents

- [GET TIME](#get-time)
- [TIME CALCULATOR](#time-calculator)
  - [add](#operation-add)
  - [subtract](#operation-subtract)
  - [diff](#operation-diff)
  - [duration_between](#operation-duration_between)
  - [stats](#operation-stats)
  - [sort](#operation-sort)
  - [expand](#operation-expand)
- [RFC 9557 (IXDTF) Support](#rfc-9557-ixdtf-support)
- [Temporal Context Envelope](#temporal-context-envelope)

---

## GET TIME

Get current time or convert times across timezones with flexible formatting.

### Description

Retrieves the current time or converts a specified datetime to multiple timezones. Supports various output formats including ISO, RFC2822, SQL, and locale-aware formatting. All parameters are optional - calling with no parameters returns the current time in the system timezone.

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `datetime` | string | No | Current time | ISO 8601 or RFC 9557 (IXDTF) datetime string (e.g., '2024-12-25T15:00:00' or '2024-12-25T15:00:00-05:00[America/New_York]') |
| `timezones` | string[] | No | - | List of IANA timezone names (e.g., ['America/New_York', 'Asia/Tokyo']) |
| `formats` | string[] | No | - | Output formats: `iso`, `ixdtf`, `rfc2822`, `sql`, `local`, `localeString`, `short`, `medium`, `long`, `full` |
| `locale` | string | No | System locale | Locale for formatting (e.g., 'en-US', 'fr-FR', 'ja-JP') |
| `includeOffsets` | boolean | No | false | Include UTC offsets (+09:00, -04:00) in output |

### Format Options

| Format | Description | Example Output |
|--------|-------------|----------------|
| `iso` | ISO 8601 format | `2024-12-25T15:00:00.000-05:00` |
| `ixdtf` | RFC 9557 (IXDTF) format | `2024-12-25T15:00:00.000-05:00[America/New_York]` |
| `rfc2822` | RFC 2822 format | `Wed, 25 Dec 2024 15:00:00 -0500` |
| `sql` | SQL datetime format | `2024-12-25 15:00:00.000 -05:00` |
| `local` | Local string representation | `Dec 25, 2024, 3:00:00 PM` |
| `localeString` | Locale-specific datetime | Locale-dependent |
| `short` | Short date format | `12/25/2024` |
| `medium` | Medium date format | `Dec 25, 2024` |
| `long` | Long date format | `December 25, 2024` |
| `full` | Full datetime format | `Wednesday, December 25, 2024 at 3:00:00 PM EST` |

### Examples

#### Get Current Time
```json
{
  "datetime": "",
  "timezones": [],
  "formats": [],
  "locale": "",
  "includeOffsets": false
}
```

**Response:**
```json
{
  "baseTime": "2025-06-22T20:15:30.123-04:00"
}
```

#### Convert to Multiple Timezones
```json
{
  "datetime": "2024-12-25T12:00:00Z",
  "timezones": ["America/New_York", "Europe/London", "Asia/Tokyo"],
  "includeOffsets": true
}
```

**Response:**
```json
{
  "baseTime": "2024-12-25T12:00:00.000Z",
  "America/New_York": "2024-12-25T07:00:00.000-05:00",
  "Europe/London": "2024-12-25T12:00:00.000+00:00",
  "Asia/Tokyo": "2024-12-25T21:00:00.000+09:00"
}
```

#### Multiple Formats with Locale
```json
{
  "datetime": "2024-12-25T15:00:00Z",
  "formats": ["short", "medium", "long", "full"],
  "locale": "fr-FR"
}
```

**Response:**
```json
{
  "baseTime": "2024-12-25T15:00:00.000Z",
  "baseTime_short": "25/12/2024",
  "baseTime_medium": "25 déc. 2024",
  "baseTime_long": "25 décembre 2024",
  "baseTime_full": "25 décembre 2024 à 15:00:00 UTC"
}
```

### Error Handling

| Error | Cause | Response |
|-------|-------|----------|
| Invalid datetime format | Malformed ISO string | `Error parsing datetime: Invalid datetime format` |
| Invalid timezone | Unknown IANA identifier | `Invalid timezone: <timezone>` |
| Invalid format | Format not in allowed list | Validation error from schema |

---

## TIME CALCULATOR

Perform time arithmetic operations including duration calculations, date math, and statistical analysis.

### Common Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `operation` | enum | **Yes** | - | Operation type: `add`, `subtract`, `diff`, `duration_between`, `stats`, `sort` |
| `interaction_mode` | enum | No | `auto_detect` | Array interaction: `auto_detect`, `single_to_many`, `many_to_single`, `pairwise`, `cross_product`, `aggregate` |
| `base_time` | string \| string[] | No | Current time | Base ISO datetime(s) |
| `compare_time` | string \| string[] | No | - | Compare ISO datetime(s) for diff/duration_between |
| `timezone` | string | No | System timezone | Timezone for base_time |
| `compare_time_timezone` | string | No | base_time timezone | Timezone for compare_time |

### Duration Parameters (for add/subtract)

| Parameter | Type | Description |
|-----------|------|-------------|
| `years` | number | Years to add/subtract |
| `months` | number | Months to add/subtract |
| `days` | number | Days to add/subtract |
| `hours` | number | Hours to add/subtract |
| `minutes` | number | Minutes to add/subtract |
| `seconds` | number | Seconds to add/subtract |

---

### Operation: add

Add a duration to one or more datetimes.

#### Example - Single Time
```json
{
  "operation": "add",
  "base_time": "2024-12-25T10:00:00Z",
  "days": 5,
  "hours": 3
}
```

**Response:**
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

#### Example - Bulk Operation
```json
{
  "operation": "add",
  "base_time": [
    "2024-01-01T10:00:00Z",
    "2024-02-15T14:30:00Z"
  ],
  "days": 7
}
```

**Response:**
```json
{
  "operation": "add",
  "interaction_mode": "many_to_single",
  "input": { ... },
  "result": {
    "count": 2,
    "results": ["2024-01-08T10:00:00.000Z", "2024-02-22T14:30:00.000Z"],
    "timezone": "UTC"
  }
}
```

---

### Operation: subtract

Subtract a duration from one or more datetimes. Same response format as `add`.

#### Example
```json
{
  "operation": "subtract",
  "base_time": "2024-12-25T15:30:45Z",
  "months": 2,
  "days": 10
}
```

---

### Operation: diff

Calculate the simple difference between two datetimes in decomposed time units.

**Note:** `compare_time` is required for this operation.

#### Response Format

```typescript
{
  days: number;           // Whole days
  hours: number;          // Remaining hours
  minutes: number;        // Remaining minutes
  seconds: number;        // Remaining seconds
  milliseconds: number;   // Remaining milliseconds
  total_milliseconds: number; // Total difference in ms
}
```

#### Example - Single Comparison
```json
{
  "operation": "diff",
  "base_time": "2024-01-01T06:00:00Z",
  "compare_time": "2024-01-08T18:30:45Z"
}
```

**Response:**
```json
{
  "operation": "diff",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2024-01-01T06:00:00.000Z",
    "compare_time": "2024-01-08T18:30:45.000Z"
  },
  "result": {
    "days": 7,
    "hours": 12,
    "minutes": 30,
    "seconds": 45,
    "milliseconds": 0,
    "total_milliseconds": 649845000
  }
}
```

#### Example - Multiple Comparisons (single_to_many)
```json
{
  "operation": "diff",
  "interaction_mode": "single_to_many",
  "base_time": "2024-01-01T12:00:00Z",
  "compare_time": ["2024-01-01T15:00:00Z", "2024-01-01T18:00:00Z"]
}
```

---

### Operation: duration_between

Calculate detailed duration breakdown with years and months (calendar-aware).

**Note:** `compare_time` is required for this operation.

#### Response Format

```typescript
{
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  total_milliseconds: number;
  human_readable: string; // e.g., "1 year, 2 months, 5 days"
}
```

#### Example - Multi-timezone
```json
{
  "operation": "duration_between",
  "base_time": "2024-01-01T12:00:00",
  "timezone": "America/Los_Angeles",
  "compare_time": "2024-01-01T21:00:00",
  "compare_time_timezone": "Europe/London"
}
```

**Response:**
```json
{
  "operation": "duration_between",
  "result": {
    "years": 0,
    "months": 0,
    "days": 0,
    "hours": 1,
    "minutes": 0,
    "seconds": 0,
    "total_milliseconds": 3600000,
    "human_readable": "0 years, 0 months, 0 days, 1 hour, 0 minutes, 0 seconds, 0 milliseconds"
  }
}
```

---

### Operation: stats

Perform statistical analysis on timestamp arrays.

**Note:** Requires at least 2 timestamps in `base_time`.

#### Modes

1. **Timestamp analysis** (base_time only): Statistics about the timestamps themselves
2. **Duration analysis** (base_time + compare_time): Statistics about durations between paired timestamps

#### Example - Timestamp Analysis
```json
{
  "operation": "stats",
  "base_time": [
    "2024-01-01T08:00:00Z",
    "2024-01-02T09:15:00Z",
    "2024-01-03T07:45:00Z",
    "2024-01-04T08:30:00Z"
  ]
}
```

**Response:**
```json
{
  "operation": "stats",
  "result": {
    "input_analysis": { "base_time_count": 4, "compare_time_count": 0 },
    "timestamp_analysis": {
      "earliest": "2024-01-01T08:00:00.000Z",
      "latest": "2024-01-04T08:30:00.000Z",
      "total_span_ms": 270000000,
      "total_span_human": "3 days, 30 minutes",
      "mean_timestamp": "2024-01-02T16:07:30.000Z",
      "median_timestamp": "2024-01-02T16:07:30.000Z",
      "std_deviation_ms": 109000
    },
    "interval_analysis": {
      "interval_count": 3,
      "mean_interval_ms": 90000000,
      "mean_interval_human": "1 day, 1 hour",
      "min_interval_ms": 63000000,
      "max_interval_ms": 117000000
    }
  }
}
```

#### Example - Duration Analysis
```json
{
  "operation": "stats",
  "base_time": ["2024-01-01T00:00:00Z", "2024-01-08T00:00:00Z"],
  "compare_time": ["2024-01-08T00:00:00Z", "2024-01-15T00:00:00Z"]
}
```

**Response:**
```json
{
  "operation": "stats",
  "result": {
    "input_analysis": { "base_time_count": 2, "compare_time_count": 2 },
    "duration_analysis": {
      "pair_count": 2,
      "min_duration_ms": 604800000,
      "min_duration_human": "7 days",
      "max_duration_ms": 604800000,
      "max_duration_human": "7 days",
      "mean_duration_ms": 604800000,
      "mean_duration_human": "7 days",
      "median_duration_ms": 604800000,
      "median_duration_human": "7 days",
      "std_deviation_ms": 0,
      "total_duration_ms": 1209600000
    }
  }
}
```

---

### Operation: sort

Sort an array of timestamps chronologically.

**Note:** Requires at least 2 timestamps in `base_time`.

#### Response Format

```typescript
{
  input_count: number;
  sorted_original_format: string[];  // Original input strings in sorted order
  sorted_iso_format: string[];       // ISO format timestamps
  sorted_timestamps: number[];       // Milliseconds since epoch
  sort_metadata: {
    earliest_time: string;
    latest_time: string;
    total_span_ms: number;
    total_span_human: string;
    timezone_used: string;
  };
}
```

#### Example
```json
{
  "operation": "sort",
  "base_time": [
    "2024-03-15T10:30:00Z",
    "2024-01-01T08:00:00Z",
    "2024-02-14T14:45:00Z"
  ]
}
```

**Response:**
```json
{
  "operation": "sort",
  "result": {
    "input_count": 3,
    "sorted_original_format": [
      "2024-01-01T08:00:00Z",
      "2024-02-14T14:45:00Z",
      "2024-03-15T10:30:00Z"
    ],
    "sorted_iso_format": ["2024-01-01T08:00:00.000Z", "2024-02-14T14:45:00.000Z", "2024-03-15T10:30:00.000Z"],
    "sorted_timestamps": [1704096000000, 1707917100000, 1710508200000],
    "sort_metadata": {
      "earliest_time": "2024-01-01T08:00:00.000Z",
      "latest_time": "2024-03-15T10:30:00.000Z",
      "total_span_ms": 6412200000,
      "total_span_human": "74 days, 2 hours, 30 minutes",
      "timezone_used": "system"
    }
  }
}
```

---

### Operation: expand

Expands a recurrence expression into concrete occurrence instants. Accepts two grammars:

- **RFC 5545 RRULE** — the recurrence format stored by Google Calendar, Outlook, and Apple Calendar. Provide a full iCalendar snippet (`DTSTART;TZID=...` + `RRULE:...`), a lone `RRULE:` line, or a bare rule part (`FREQ=WEEKLY;BYDAY=TU`); rules without a `DTSTART` are anchored by `base_time` (or the current time).
- **ISO 8601 repeating interval** — `R[n]/<start>/<duration>`, e.g. `R5/2026-03-01T14:00:00Z/P1D`. `R` without a count repeats without bound. Start instants accept RFC 9557 (IXDTF) zone annotations, making DST-safe repeating intervals expressible: `R12/2026-01-05T09:00:00[America/New_York]/P1W`.

Expansion is DST-correct: a `09:00` New York weekly rule stays `09:00` wall-clock across daylight-saving transitions.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `recurrence` | string | Yes | - | RRULE or ISO 8601 repeating interval |
| `base_time` | string | No | Current time | DTSTART anchor for RRULEs that carry none |
| `window_start` | string | No | - | Inclusive lower bound; earlier occurrences are skipped |
| `window_end` | string | No | - | Inclusive upper bound; expansion stops beyond it |
| `max_occurrences` | number | No | 100 | Cap on returned occurrences (max 10,000) |
| `occurrence_format` | string | No | `iso` | `iso`, `ixdtf`, or `epoch_ms` |
| `timezone` | string | No | - | Converts occurrences for display (the rule's own zone governs the math) |

#### Example

Request:
```json
{
  "operation": "expand",
  "recurrence": "FREQ=WEEKLY;BYDAY=TU;COUNT=4",
  "base_time": "2026-02-24T09:00:00[America/New_York]",
  "occurrence_format": "ixdtf"
}
```

Response (result excerpt):
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
  ],
  "span": {
    "earliest": "2026-02-24T09:00:00.000-05:00",
    "latest": "2026-03-17T09:00:00.000-04:00",
    "total_span_human": "21 days"
  }
}
```

`truncated: true` signals that more occurrences exist beyond `max_occurrences` — expansion never silently drops data. Unbounded rules without a `window_end` are capped and flagged.

---

## Batch Error Isolation

Array operations (`stats`, `sort`, and paired duration analysis) skip unparseable entries instead of failing the whole batch. Skipped items are reported explicitly:

- `stats` → `input_analysis.invalid_count` and `input_analysis.invalid_inputs_sample` (first 5, with parse reasons)
- `sort` → `invalid_count` and `invalid_inputs_sample` alongside the sorted output
- Operations only error when too few valid items remain to compute a meaningful result (e.g. fewer than 2 valid timestamps for `stats`), and the error names the invalid inputs.

---

## RFC 9557 (IXDTF) Support

Every datetime parameter accepts the Internet Extended Date/Time Format (RFC 9557) — an RFC 3339 timestamp followed by a bracketed IANA time zone annotation. This is the serialization format of the JS Temporal API.

```text
2026-08-09T15:00:00-04:00[America/New_York]   offset + zone (offset is validated)
2026-08-09T19:00:00Z[America/New_York]        UTC instant projected into the zone
2026-08-09T15:00:00[Europe/Paris]             wall-clock time in the zone
2026-08-09T15:00:00+05:30[+05:30]             offset-form annotation
```

Consistency semantics (Temporal-compatible):

- A numeric offset that disagrees with the annotated zone's offset at that instant is **rejected** as inconsistent — never silently reinterpreted.
- `Z` plus a zone annotation is valid: the UTC instant is projected into the zone.
- Critical annotations (`[!...]`) that the server cannot honor are rejected per RFC 9557; unknown non-critical annotations are ignored.
- The bracketed zone is authoritative for interpreting the timestamp; a `timezone` parameter then converts the result for display.

Use the `ixdtf` format (GET TIME `formats`, expand `occurrence_format`) to emit IXDTF strings.

---

## Temporal Context Envelope

Every tool response carries a trailing text block — a single compact line giving the calling agent passive time-awareness:

```text
⏱ now 2026-08-09T15:02:11.123-04:00 (Sun) · first call this session · tzdb 2025b
⏱ now 2026-08-09T15:49:03.456-04:00 (Sun) · +46m52s since last call · session 47m1s · call #2
```

The first call also stamps the IANA tzdb version the server is running (auditability: which tzdata answered this session). Elapsed times are measured per MCP session — over HTTP, each client session has its own clock. Disable with `CHRONO_ENVELOPE=off`.

---

## Interaction Modes

When working with arrays of timestamps, you can control how `base_time` and `compare_time` interact:

| Mode | Description | Use Case |
|------|-------------|----------|
| `auto_detect` | Automatically chooses based on array lengths | General use |
| `single_to_many` | One base time compared to many compare times | Calculating multiple future dates from now |
| `many_to_single` | Many base times compared to one compare time | Finding how long ago multiple events occurred |
| `pairwise` | Index-by-index comparison (stops at shorter array length) | Matching pairs of start/end times |
| `cross_product` | Every base time compared to every compare time | Complete comparison matrix |
| `aggregate` | Aggregates results across all comparisons | Statistical summaries |

### Example - Pairwise Mode
```json
{
  "operation": "diff",
  "interaction_mode": "pairwise",
  "base_time": ["2024-01-01T09:00:00Z", "2024-01-02T10:00:00Z"],
  "compare_time": ["2024-01-01T17:00:00Z", "2024-01-02T18:00:00Z"]
}
```
This compares:
- Index 0: 09:00 → 17:00 (8 hours)
- Index 1: 10:00 → 18:00 (8 hours)

### Example - Cross Product Mode
```json
{
  "operation": "diff",
  "interaction_mode": "cross_product",
  "base_time": ["2024-01-01T12:00:00Z", "2024-01-02T12:00:00Z"],
  "compare_time": ["2024-01-03T12:00:00Z", "2024-01-04T12:00:00Z"]
}
```
This produces 4 results (2×2):
- Jan 1 → Jan 3
- Jan 1 → Jan 4
- Jan 2 → Jan 3
- Jan 2 → Jan 4

---

## Error Handling

All operations return structured error responses:

```json
{
  "success": false,
  "operation": "add",
  "error": "No duration specified for add operation"
}
```

### Common Error Cases

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid arguments` | Schema validation failed | Check parameter types and formats |
| `No duration specified` | add/subtract without duration values | Add at least one duration parameter |
| `compare_time is required` | diff/duration_between without compare_time | Provide compare_time parameter |
| `Invalid base_time format` | Malformed ISO datetime | Use proper ISO 8601 format |
| `Operation count exceeds maximum` | Arrays too large (limit: 10000) | Reduce batch size |
| `stats operation requires at least 2 timestamps` | Single timestamp provided to stats | Provide array with 2+ timestamps |

---

## Timezone Handling

### Specifying Timezones

Use IANA timezone identifiers:
- `UTC` - Coordinated Universal Time
- `America/New_York` - Eastern Time (with DST)
- `America/Los_Angeles` - Pacific Time (with DST)
- `Europe/London` - GMT/BST
- `Europe/Paris` - Central European Time
- `Asia/Tokyo` - Japan Standard Time
- `Asia/Shanghai` - China Standard Time
- `Australia/Sydney` - Australian Eastern Time

### Timezone Rules

1. **ISO strings with Z suffix**: Always treated as UTC, timezone parameter converts the output
2. **ISO strings with offset** (e.g., `-05:00`): Offset is preserved, timezone parameter converts the output
3. **ISO strings without zone info**: Interpreted in the specified timezone (or system timezone if none specified)

### Example - Multi-timezone Duration
```json
{
  "operation": "duration_between",
  "base_time": "2024-01-15T09:00:00",
  "timezone": "America/New_York",
  "compare_time": "2024-01-15T09:00:00",
  "compare_time_timezone": "Europe/London"
}
```
Result: 5 hours difference (NY 9am = London 2pm)

---

## Rate Limits and Performance

### Maximum Operations

- **Batch operations**: Maximum 10,000 calculations per request
- **Array inputs**: Each timestamp in an array counts toward the limit
- **Cross product**: Multiplies base_time count by compare_time count

### Performance Tips

1. Use `auto_detect` mode for simple cases
2. Prefer `pairwise` over `cross_product` for large arrays
3. For time-series analysis, use `stats` operation instead of multiple `diff` calls
4. Enable debug mode only when needed (adds metadata overhead)

### Debug Mode

Set environment variable `CHRONO_DEBUG=true` to include metadata in responses:

```json
{
  "operation": "add",
  "result": "2024-12-30T13:00:00.000Z",
  "metadata": {
    "calculation_time": "2024-12-22T10:30:00.000Z",
    "calculation_timezone": "America/New_York"
  }
}
```

---

## Version History

See [CHANGELOG.md](./CHANGELOG.md) for detailed version history.