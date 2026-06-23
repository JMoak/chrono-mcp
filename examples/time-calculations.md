# Time Calculation Examples

Examples demonstrating date arithmetic, duration calculations, and time differences.

## 1. Add Time to a Date

Add days, hours, minutes to a specific date.

### Tool Call
```json
// TIME CALCULATOR - Add operation
{
  "operation": "add",
  "base_time": "2024-12-25T10:00:00Z",
  "days": 5,
  "hours": 3,
  "minutes": 30
}
```

### Expected Output
```json
{
  "operation": "add",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2024-12-25T10:00:00.000Z",
    "duration": {
      "days": 5,
      "hours": 3,
      "minutes": 30
    }
  },
  "result": "2024-12-30T13:30:00.000Z",
  "result_timezone": "UTC"
}
```

### Use Case
Calculating due dates, shipping estimates, or project deadlines.

---

## 2. Subtract Time from a Date

Calculate past dates by subtracting time periods.

### Tool Call
```json
// TIME CALCULATOR - Subtract operation
{
  "operation": "subtract",
  "base_time": "2024-12-25T15:30:00Z",
  "years": 1,
  "months": 3,
  "days": 10
}
```

### Expected Output
```json
{
  "operation": "subtract",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2024-12-25T15:30:00.000Z",
    "duration": {
      "years": 1,
      "months": 3,
      "days": 10
    }
  },
  "result": "2023-09-15T15:30:00.000Z",
  "result_timezone": "UTC"
}
```

### Use Case
Calculating historical dates, SLA windows, or subscription start dates.

---

## 3. Calculate Simple Difference

Get the raw time difference between two dates.

### Tool Call
```json
// TIME CALCULATOR - Diff operation
{
  "operation": "diff",
  "base_time": "2024-01-01T00:00:00Z",
  "compare_time": "2024-01-08T18:30:45Z"
}
```

### Expected Output
```json
{
  "operation": "diff",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2024-01-01T00:00:00.000Z",
    "compare_time": "2024-01-08T18:30:45.000Z"
  },
  "result": {
    "days": 7,
    "hours": 18,
    "minutes": 30,
    "seconds": 45,
    "milliseconds": 0,
    "total_milliseconds": 669045000
  }
}
```

### Use Case
Calculating elapsed time, age calculations, or simple time spans.

---

## 4. Calculate Detailed Duration

Get a comprehensive duration breakdown between dates.

### Tool Call
```json
// TIME CALCULATOR - Duration between
{
  "operation": "duration_between",
  "base_time": "2024-01-15T08:30:00Z",
  "compare_time": "2025-03-20T14:45:30Z"
}
```

### Expected Output
```json
{
  "operation": "duration_between",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2024-01-15T08:30:00.000Z",
    "compare_time": "2025-03-20T14:45:30.000Z"
  },
  "result": {
    "years": 1,
    "months": 2,
    "days": 5,
    "hours": 6,
    "minutes": 15,
    "seconds": 30,
    "milliseconds": 0,
    "total_milliseconds": 37004130000,
    "human_readable": "1 year, 2 months, 5 days, 6 hours, 15 minutes, 30 seconds, 0 milliseconds"
  }
}
```

### Use Case
Displaying age, project durations, or subscription lengths in human-friendly terms.

---

## 5. Calculate with Timezones

Perform calculations respecting timezone differences.

### Tool Call
```json
// TIME CALCULATOR - Multi-timezone calculation
{
  "operation": "duration_between",
  "base_time": "2024-01-01T12:00:00",
  "timezone": "America/Los_Angeles",
  "compare_time": "2024-01-01T21:00:00",
  "compare_time_timezone": "Europe/London"
}
```

### Expected Output
```json
{
  "operation": "duration_between",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2024-01-01T12:00:00.000-08:00",
    "compare_time": "2024-01-01T21:00:00.000+00:00"
  },
  "result": {
    "years": 0,
    "months": 0,
    "days": 0,
    "hours": 1,
    "minutes": 0,
    "seconds": 0,
    "milliseconds": 0,
    "total_milliseconds": 3600000,
    "human_readable": "0 years, 0 months, 0 days, 1 hour, 0 minutes,