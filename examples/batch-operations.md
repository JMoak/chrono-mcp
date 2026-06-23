# Batch Operations Examples

Examples demonstrating efficient batch processing of multiple timestamps.

## 1. Compare One Time to Many

Calculate differences from a single base time to multiple comparison times.

### Tool Call
```json
// TIME CALCULATOR - Single to many mode
{
  "operation": "diff",
  "interaction_mode": "single_to_many",
  "base_time": "2024-01-01T12:00:00Z",
  "compare_time": [
    "2024-01-01T15:00:00Z",
    "2024-01-01T18:00:00Z",
    "2024-01-01T21:00:00Z",
    "2024-01-02T00:00:00Z"
  ]
}
```

### Expected Output
```json
{
  "operation": "diff",
  "interaction_mode": "single_to_many",
  "input": {
    "base_time": "2024-01-01T12:00:00.000Z",
    "compare_time": [...]
  },
  "result": {
    "count": 4,
    "results": [
      { "days": 0, "hours": 3, "minutes": 0, "seconds": 0, "milliseconds": 0, "total_milliseconds": 10800000 },
      { "days": 0, "hours": 6, "minutes": 0, "seconds": 0, "milliseconds": 0, "total_milliseconds": 21600000 },
      { "days": 0, "hours": 9, "minutes": 0, "seconds": 0, "milliseconds": 0, "total_milliseconds": 32400000 },
      { "days": 0, "hours": 12, "minutes": 0, "seconds": 0, "milliseconds": 0, "total_milliseconds": 43200000 }
    ]
  }
}
```

### Use Case
Calculating ETA windows, estimating delivery times, or scheduling intervals.

---

## 2. Compare Many Times to One

Calculate differences from multiple base times to a single comparison time.

### Tool Call
```json
// TIME CALCULATOR - Many to single mode
{
  "operation": "diff",
  "interaction_mode": "many_to_single",
  "base_time": [
    "2024-06-01T09:00:00Z",
    "2024-06-02T09:00:00Z",
    "2024-06-03T09:00:00Z"
  ],
  "compare_time": "2024-06-10T17:00:00Z"
}
```

### Expected Output
```json
{
  "operation": "diff",
  "interaction_mode": "many_to_single",
  "input": {
    "base_time": [...],
    "compare_time": "2024-06-10T17:00:00.000Z"
  },
  "result": {
    "count": 3,
    "results": [
      { "days": 9, "hours": 8, "total_milliseconds": 792000000 },
      { "days": 8, "hours": 8, "total_milliseconds": 720000000 },
      { "days": 7, "hours": 8, "total_milliseconds": 648000000 }
    ]
  }
}
```

### Use Case
Calculating remaining time for multiple deadlines against a common due date.

---

## 3. Pairwise Comparison

Compare corresponding elements from two arrays.

### Tool Call
```json
// TIME CALCULATOR - Pairwise mode
{
  "operation": "duration_between",
  "interaction_mode": "pairwise",
  "base_time": [
    "2024-01-01T09:00:00Z",
    "2024-02-01T10:00:00Z",
    "2024-03-01T11:00:00Z"
  ],
  "compare_time": [
    "2024-01-01T17:00:00Z",
    "2024-02-01T19:00:00Z",
    "2024-03-01T20:00:00Z"
  ]
}
```

### Expected Output
```json
{
  "operation": "duration_between",
  "interaction_mode": "pairwise",
  "input": {
    "base_time": [...],
    "compare_time": [...]
  },
  "result": {
    "count": 3,
    "results": [
      { "years": 0, "months": 0, "days": 0, "hours": 8, "human_readable": "8 hours" },
      { "years": 0, "months": 0, "days": 0, "hours": 9, "human_readable": "9 hours" },
      { "years": 0, "months": 0, "days": 0, "hours": 9, "human_readable": "9 hours" }
    ]
  }
}
```

### Use Case
Analyzing work hours from paired clock-in/clock-out times, or calculating durations for paired events.

---

## 4. Cross Product Comparison

Compare all combinations of base times against all comparison times.

### Tool Call
```json
// TIME CALCULATOR - Cross product mode
{
  "operation": "diff",
  "interaction_mode": "cross_product",
  "base_time": [
    "2024-01-01T00:00:00Z",
    "2024-01-02T00:00:00Z"
  ],
  "compare_time": [
    "2024-01-03T00:00:00Z",
    "2024-01-04T00:00:00Z",
    "2024-01-05T00:00:00Z"
  ]
}
```

### Expected Output
```json
{
  "operation": "diff",
  "interaction_mode": "cross_product",
  "input": {
    "base_time": [...],
    "compare_time": [...]
  },
  "result": {
    "count": 6,
    "results": [
      { "days": 2, "total_milliseconds": 172800000 },  // Jan 1 → Jan 3
      { "days": 3, "total_milliseconds": 259200000 },  // Jan 1 → Jan 4
      { "days": 4, "total_milliseconds": 345600000 },  // Jan 1 → Jan 5
      { "days": 1, "total_milliseconds": 86400000 },   // Jan 2 → Jan 3
      { "days": 2, "total_milliseconds": 172800000 },  // Jan 2 → Jan 4
      { "days": 3, "total_milliseconds": 259200000 }   // Jan 2 → Jan 5
    ]
  }
}
```

### Use Case
Generating full matrices of time differences for scheduling analysis or comparing multiple project start/end scenarios.

---

## 5. Batch Add Operations

Add a duration to multiple timestamps at once.

### Tool Call
```json
// TIME CALCULATOR - Add to multiple times
{
  "operation": "add",
  "base_time": [
    "2024-01-01T10:00:00Z",
    "2024-02-01T10:00:00Z",
    "2024-03-01T10:00:00Z",
    "2024-04-01T10:00:00Z"
  ],
  "days": 30,
  "hours": 12
}
```

### Expected Output
```json
{
  "operation": "add",
  "interaction_mode