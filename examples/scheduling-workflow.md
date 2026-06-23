# Scheduling Workflow Example

A real-world example demonstrating how to use chrono-mcp for meeting scheduling across timezones.

## Scenario

You're organizing a global team meeting with participants in:
- New York (EST/EDT)
- London (GMT/BST)
- Tokyo (JST)
- Sydney (AEST/AEDT)

You need to find a suitable meeting time and calculate durations for different agenda items.

---

## Step 1: Check Current Times

First, see what time it is now for everyone.

### Tool Call
```json
// GET TIME - Current times across offices
{
  "timezones": ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"],
  "includeOffsets": true,
  "formats": ["short"]
}
```

### Expected Output
```json
{
  "baseTime": "2025-06-22T09:00:00.000-04:00",
  "America/New_York": "2025-06-22T09:00:00.000-04:00",
  "Europe/London": "2025-06-22T14:00:00.000+01:00",
  "Asia/Tokyo": "2025-06-22T22:00:00.000+09:00",
  "Australia/Sydney": "2025-06-22T23:00:00.000+10:00"
}
```

### Analysis
- New York: Morning (9 AM) ✓ Good
- London: Afternoon (2 PM) ✓ Good
- Tokyo: Late evening (10 PM) ✗ Too late
- Sydney: Late evening (11 PM) ✗ Too late

---

## Step 2: Find a Better Time

Let's try 8 AM New York time to see if it's better for Asia-Pacific.

### Tool Call
```json
// GET TIME - Proposed meeting time
{
  "datetime": "2025-06-23T13:00:00Z",
  "timezones": ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"],
  "includeOffsets": true,
  "formats": ["short", "full"]
}
```

### Expected Output
```json
{
  "baseTime": "2025-06-23T13:00:00.000Z",
  "baseTime_short": "6/23/2025, 9:00 AM",
  "baseTime_full": "Monday, June 23, 2025 at 9:00:00 AM EDT",
  "America/New_York": "2025-06-23T09:00:00.000-04:00",
  "Europe/London": "2025-06-23T14:00:00.000+01:00",
  "Asia/Tokyo": "2025-06-23T22:00:00.000+09:00",
  "Australia/Sydney": "2025-06-23T23:00:00.000+10:00"
}
```

### Analysis
Still challenging for Asia-Pacific. Let's try an earlier time that works for US and Asia:

---

## Step 3: Calculate Duration for Agenda Items

Calculate how long each agenda item takes.

### Tool Call - Welcome & Introductions
```json
// TIME CALCULATOR - 15 minute intro
{
  "operation": "add",
  "base_time": "2025-06-23T13:00:00Z",
  "minutes": 15
}
```

### Expected Output
```json
{
  "operation": "add",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2025-06-23T13:00:00.000Z",
    "duration": { "minutes": 15 }
  },
  "result": "2025-06-23T13:15:00.000Z",
  "result_timezone": "UTC"
}
```

---

### Tool Call - Project Status Updates (30 min)
```json
// TIME CALCULATOR - Start after intro, add 30 min
{
  "operation": "add",
  "base_time": "2025-06-23T13:15:00Z",
  "minutes": 30
}
```

### Expected Output
```json
{
  "operation": "add",
  "input": {
    "base_time": "2025-06-23T13:15:00.000Z",
    "duration": { "minutes": 30 }
  },
  "result": "2025-06-23T13:45:00.000Z"
}
```

---

### Tool Call - Calculate Full Meeting Duration
```json
// TIME CALCULATOR - Total meeting duration
{
  "operation": "duration_between",
  "base_time": "2025-06-23T13:00:00Z",
  "compare_time": "2025-06-23T14:30:00Z"
}
```

### Expected Output
```json
{
  "operation": "duration_between",
  "interaction_mode": "single_to_single",
  "input": {
    "base_time": "2025-06-23T13:00:00.000Z",
    "compare_time": "2025-06-23T14:30:00.000Z"
  },
  "result": {
    "years": 0,
    "months": 0,
    "days": 0,
    "hours": 1,
    "minutes": 30,
    "seconds": 0,
    "human_readable": "1 hour, 30 minutes"
  }
}
```

---

## Step 4: Create Meeting Schedule with Local Times

Let's build a complete schedule showing local times for each segment.

### Meeting Agenda with Local Times

| Agenda Item | Duration | UTC | New York | London | Tokyo | Sydney |
|-------------|----------|-----|----------|--------|-------|--------|
| Welcome | 15 min | 13:00 | 09:00 | 14:00 | 22:00 | 23:00 |
| Project Updates | 30 min | 13:15 | 09:15 | 14:15 | 22:15 | 23:15 |
| Discussion | 30 min | 13:45 | 09:45 | 14:45 | 22:45 | 23:45 |
| Wrap-up | 15 min | 14:15 | 10:15 | 15:15 | 23:15 | 00:15+1 |
| **Total** | **90 min** | | | | | |

---

## Step 5: Find Optimal Meeting Time

Let's find a time that works better for all regions. We'll check 6 AM New York (better for Asia):

### Tool Call
```json
// GET TIME - Early morning option
{
  "datetime": "2025-06-23T11:00:00Z",
  "timezones": ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"],
  "includeOffsets": true,
  "formats": ["short"]
}
```

### Expected Output
```json
{
  "baseTime": "2025-06-23T11:00:00.000Z",
  "America/New_York": "2025-06-23T07:00:00.000-04:00",
  "Europe/London": "2025-06-23T12:00:00.000+01:00",
  "Asia/Tokyo": "2025-06-23T20:00:00.000+09:00",
  "Australia/Sydney": "2025-06-23T21:00:00.000+10:00"
}
```

### Analysis
- New York: Early (7 AM) ⚠️ Early but manageable
- London: Midday (12 PM) ✓ Good
- Tokyo: Evening (8 PM) ✓ Reasonable
- Sydney: Evening (9 PM) ✓ Reasonable

---

## Step 6: Calculate Recurring Meeting Times

Calculate times for a weekly recurring meeting for the next 4 weeks.

### Tool Call - Week 2
```json
// TIME CALCULATOR - One week later
{
  "operation": "add",
  "base_time": "2025-06-23T11:00:00Z",
  "days": 7
}
```

### Tool Call - Week 3
```json
// TIME CALCULATOR - Two weeks later
{
  "operation": "add",
  "base_time": "2025-06-23T11:00:00Z",
  "days": 14
}
```

### Tool Call - Week 4
```json
// TIME CALCULATOR - Three weeks later
{
  "operation": "add",
  "base_time": "2025-06-23T11:00:00Z",
  "days": 21
}
```

---

## Complete Meeting Invite Template

Using the times calculated, here's a meeting invite:

---

**Subject:** Global Team Sync - Weekly Standup

**Date:** Monday, June 23, 2025

**Duration:** 90 minutes

**Local Times:**
- 🇺🇸 New York: 7:00 AM - 8:30 AM (EDT)
- 🇬🇧 London: 12:00 PM - 1:30 PM (BST)
- 🇯🇵 Tokyo: 8:00 PM - 9:30 PM (JST)
- 🇦🇺 Sydney: 9:00 PM - 10:30 PM (AEST)

**Agenda:**
1. Welcome & Introductions (15 min)
2. Project Status Updates (30 min)
3. Open Discussion (30 min)
4. Action Items & Wrap-up (15 min)

**Join:** [Meeting Link]

---

## Tips for Global Scheduling

1. **Use UTC as reference** - Always calculate from UTC to avoid confusion
2. **Consider daylight saving** - Check if any region has DST transitions
3. **Rotate inconvenient times** - If no perfect time exists, rotate who gets the odd hours
4. **Record meetings** - For those who truly cannot attend
5. **Use async updates** - Complement meetings with written updates
6. **Check holidays** - Verify no major holidays in any region

### Best Global Meeting Windows

| Window | US East | Europe | Asia | Suitability |
|--------|---------|--------|------|-------------|
| 7 AM EST | Early | Midday | Evening | Good compromise |
| 9 AM EST | Morning | Late | Night | Poor for Asia |
| 11 AM EST | Late AM | Evening | Late Night | Poor for Asia |
| 6 AM EST | Very Early | Late AM | Evening | Best compromise |