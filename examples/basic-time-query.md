# Basic Time Query Examples

Examples demonstrating fundamental time retrieval and timezone conversion operations.

## 1. Get Current Time (No Parameters)

The simplest query - returns the current time in the system's timezone.

### Tool Call
```json
// GET TIME - No parameters
{}
```

### Expected Output
```json
{
  "baseTime": "2025-06-22T12:30:45.123-04:00"
}
```

### Use Case
Quickly check what time it is right now.

---

## 2. Get Current Time in Multiple Timezones

View the current time across different global locations.

### Tool Call
```json
// GET TIME - Multiple timezones
{
  "timezones": ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"],
  "includeOffsets": true
}
```

### Expected Output
```json
{
  "baseTime": "2025-06-22T12:30:45.123-04:00",
  "America/New_York": "2025-06-22T12:30:45.123-04:00",
  "Europe/London": "2025-06-22T17:30:45.123+01:00",
  "Asia/Tokyo": "2025-06-23T01:30:45.123+09:00",
  "Australia/Sydney": "2025-06-23T02:30:45.123+10:00"
}
```

### Use Case
Coordinating meetings across international teams.

---

## 3. Convert a Specific Time to Multiple Timezones

Convert a known time in UTC to various local times.

### Tool Call
```json
// GET TIME - Convert specific datetime
{
  "datetime": "2024-12-25T15:00:00Z",
  "timezones": ["America/Los_Angeles", "America/Chicago", "America/New_York", "Europe/Paris"],
  "includeOffsets": true
}
```

### Expected Output
```json
{
  "baseTime": "2024-12-25T15:00:00.000Z",
  "America/Los_Angeles": "2024-12-25T07:00:00.000-08:00",
  "America/Chicago": "2024-12-25T09:00:00.000-06:00",
  "America/New_York": "2024-12-25T10:00:00.000-05:00",
  "Europe/Paris": "2024-12-25T16:00:00.000+01:00"
}
```

### Use Case
Announcing a global event time that needs to be understood locally.

---

## 4. Format Time in Multiple Ways

Get the same time in various output formats.

### Tool Call
```json
// GET TIME - Multiple formats
{
  "datetime": "2024-12-25T15:00:00Z",
  "formats": ["iso", "rfc2822", "sql", "short", "medium", "long", "full"]
}
```

### Expected Output
```json
{
  "baseTime": "2024-12-25T15:00:00.000Z",
  "baseTime_iso": "2024-12-25T15:00:00.000Z",
  "baseTime_rfc2822": "Wed, 25 Dec 2024 15:00:00 +0000",
  "baseTime_sql": "2024-12-25 15:00:00.000 +00:00",
  "baseTime_short": "12/25/2024, 3:00 PM",
  "baseTime_medium": "Dec 25, 2024, 3:00:00 PM",
  "baseTime_long": "December 25, 2024 at 3:00:00 PM GMT",
  "baseTime_full": "Wednesday, December 25, 2024 at 3:00:00 PM GMT"
}
```

### Use Case
Generating timestamps for different systems (databases, email headers, user interfaces).

---

## 5. Locale-Aware Formatting

Display dates in region-appropriate formats.

### Tool Call
```json
// GET TIME - Japanese locale
{
  "datetime": "2024-12-25T15:00:00Z",
  "formats": ["short", "medium", "long", "full"],
  "locale": "ja-JP"
}
```

### Expected Output
```json
{
  "baseTime": "2024-12-25T15:00:00.000Z",
  "baseTime_short": "2024/12/25 15:00",
  "baseTime_medium": "2024年12月25日 15:00:00",
  "baseTime_long": "2024年12月25日 15:00:00 GMT",
  "baseTime_full": "2024年12月25日水曜日 15時00分00秒 グリニッジ標準時"
}
```

### More Locales to Try

| Locale | Region | Example Short Format |
|--------|--------|---------------------|
| `en-US` | United States | 12/25/2024 |
| `en-GB` | United Kingdom | 25/12/2024 |
| `de-DE` | Germany | 25.12.2024 |
| `fr-FR` | France | 25/12/2024 |
| `es-ES` | Spain | 25/12/2024 |
| `zh-CN` | China | 2024/12/25 |

---

## 6. Check DST Status

View how Daylight Saving Time affects different zones.

### Tool Call - Winter (EST)
```json
// GET TIME - January (EST in NY)
{
  "datetime": "2024-01-15T12:00:00Z",
  "timezones": ["America/New_York", "Europe/London"],
  "includeOffsets": true
}
```

### Tool Call - Summer (EDT)
```json
// GET TIME - July (EDT in NY)
{
  "datetime": "2024-07-15T12:00:00Z",
  "timezones": ["America/New_York", "Europe/London"],
  "includeOffsets": true
}
```

### Observing DST Changes
- **January**: New York shows `-05:00` (EST)
- **July**: New York shows `-04:00` (EDT)

### Use Case
Scheduling events that span DST transitions.

---

## 7. Common Timezone Identifiers

Reference for common IANA timezone identifiers:

### Americas
- `America/New_York` (Eastern)
- `America/Chicago` (Central)
- `America/Denver` (Mountain)
- `America/Los_Angeles` (Pacific)
- `America/Toronto`
- `America/Sao_Paulo`
- `America/Mexico_City`

### Europe
- `Europe/London`
- `Europe/Paris`
- `Europe/Berlin`
- `Europe/Moscow`
- `Europe/Istanbul`

### Asia
- `Asia/Tokyo`
- `Asia/Shanghai`
- `Asia/Hong_Kong`
- `Asia/Singapore`
- `Asia/Dubai`
- `Asia/Kolkata`
- `Asia/Seoul`

### Pacific
- `Australia/Sydney`
- `Australia/Melbourne`
- `Pacific/Auckland`
- `Pacific/Honolulu`

### UTC
- `UTC`
- `Etc/GMT`
- `Etc/GMT+0` through `Etc/GMT+12`
- `Etc/GMT-0` through `Etc/GMT-14`

---

## Tips

1. **Always use IANA identifiers** like `America/New_York` instead of abbreviations like `EST` or `EDT`
2. **Include offsets** when precision matters - offsets explicitly show the UTC adjustment
3. **Use UTC for storage** - Store times in UTC and convert for display
4. **Test DST transitions** - Always test scheduling logic around DST change dates