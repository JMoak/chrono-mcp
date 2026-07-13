# CALENDAR Tool Planning Document

## Overview

The CALENDAR tool provides comprehensive calendar operations with **hybrid data sources** - connecting to real calendars (Gmail/Google Calendar via API) when credentials are provided, or creating/managing local calendar storage when not. This follows the "Swiss army knife" approach with flexible inputs and smart backend logic for context-efficient LLM interactions.

## Core Philosophy

- **Hybrid calendar sources**: Gmail API integration OR local calendar storage with seamless fallback
- **LLM-optimized workflows**: Designed for scheduling assistance, deadline planning, and content calendaring
- **Context efficiency**: Return minimal, actionable information to save tokens
- **Smart defaults**: Use current date/time and infer user intent from minimal inputs
- **Real-world utility**: Connect to actual calendars for practical scheduling decisions
- **Graceful degradation**: Works without external APIs via local calendar management

## Calendar Data Sources

### Primary Source: Gmail/Google Calendar API
**When `calendar_api_key` or `calendar_auth` parameter provided:**
- Connect to user's actual Google Calendar via Gmail API
- Read existing events, availability, and calendar metadata
- Respect real scheduling conflicts and commitments
- Support multiple calendar views (personal, work, shared)

### Fallback Source: Local Calendar Storage
**When no API credentials provided:**
- Create local calendar database (SQLite) in MCP working directory
- Prompt user to initialize calendar with basic info (timezone, work schedule)
- Store events, appointments, and recurring patterns locally
- Provide calendar management operations (add/edit/delete events)

### Hybrid Intelligence
- **API Mode**: Combine real calendar data with algorithmic calculations
- **Local Mode**: Pure algorithmic calendar with user-defined events
- **Seamless transition**: Can upgrade from local to API mode when credentials become available

## LLM Use Cases & Workflows

### 1. Scheduling Assistant
```typescript
// "When can I schedule a 2-hour meeting with John next week?"
{
  operation: 'find_availability',
  duration: 120,
  participants: ['john@example.com'],
  timeframe: 'next_week',
  calendar_api_key: 'gapi_key_123'
}
// Returns: ["Tuesday 2PM-4PM", "Wednesday 10AM-12PM", "Friday 3PM-5PM"]
```

### 2. Deadline Planning
```typescript
// "How many working days until my project deadline?"
{
  operation: 'business_days_until',
  target_date: '2024-06-15',
  exclude_existing_events: true
}
// Returns: "18 working days (excluding 3 existing meeting days)"
```

### 3. Content Calendar Generation
```typescript
// "Create a quarterly blog posting schedule for Tuesdays"
{
  operation: 'generate_schedule',
  pattern: 'weekly',
  day: 'tuesday',
  duration: '3_months',
  event_type: 'blog_post'
}
// Returns: Concise list of 12 Tuesday dates with conflict warnings
```

### 4. Smart Conflict Detection
```typescript
// "Can I add a recurring 1-hour call every Thursday at 3PM?"
{
  operation: 'check_recurring_conflicts',
  pattern: 'weekly',
  day: 'thursday',
  time: '15:00',
  duration: 60
}
// Returns: "Conflicts: Dec 5 (existing meeting), Dec 19 (holiday), Jan 2 (vacation)"
```

## Proposed Functionality Categories

### 1. Calendar Data Integration
- **API connectivity**: Connect to Gmail/Google Calendar with OAuth or API key
- **Local calendar init**: Create and manage local SQLite calendar database
- **Event synchronization**: Sync between local and remote calendars
- **Multi-calendar support**: Handle personal, work, and shared calendars

### 2. Availability & Scheduling Operations
- **Free/busy lookup**: Find available time slots in real calendar
- **Meeting scheduling**: Optimal time finding with multiple participants
- **Conflict detection**: Identify scheduling conflicts before committing
- **Buffer time management**: Account for travel time, prep time between events

### 3. Calendar Navigation & Views
- **Smart views**: Context-aware calendar views (daily agenda, weekly overview)
- **Event filtering**: Show only relevant events based on query context
- **Timeline navigation**: "next available slot", "first free morning", "end of busy period"
- **Cross-calendar views**: Unified view across multiple calendar sources

### 4. Business Calendar Operations
- **Working hours**: Respect user's defined work schedule and time zones
- **Business day calculations**: Skip weekends, holidays, and existing meetings
- **Team availability**: Cross-reference multiple calendars for group scheduling
- **Deadline management**: Working day countdown with event-aware calculations

### 5. Event Management (Local Calendar Mode)
- **Event CRUD**: Create, read, update, delete events in local calendar
- **Recurring events**: Set up and manage recurring appointments
- **Event templates**: Pre-defined event types (meetings, deadlines, reminders)
- **Bulk operations**: Import/export events, batch scheduling

### 6. Holiday & Regional Awareness
- **Regional holidays**: Auto-detect holidays based on user's location/settings
- **Custom holidays**: Company holidays, personal days, vacation periods
- **Holiday impact**: Factor holidays into availability and scheduling decisions
- **Multi-region support**: Handle team members across different holiday calendars

### 7. Intelligent Scheduling Patterns
- **Pattern recognition**: Learn from existing calendar patterns
- **Optimal scheduling**: Suggest best times based on historical preferences
- **Workload distribution**: Balance events across time periods
- **Focus time protection**: Preserve uninterrupted work blocks

### 8. Context-Optimized Output
- **Minimal responses**: Return only essential information to save tokens
- **Actionable insights**: Focus on decision-making information
- **Conflict summaries**: Concise conflict reports with suggested alternatives
- **Progressive detail**: More detail only when specifically requested

### 9. Calendar Analysis & Insights
- **Usage patterns**: Analyze calendar for productivity insights
- **Availability trends**: Identify consistently free time slots
- **Meeting density**: Highlight over-scheduled periods
- **Time allocation**: Break down time spent by category/project

## Tool Interface Design

### Input Parameters (All Optional with Smart Defaults)

```typescript
interface CalendarParams {
  // Calendar source (determines data source)
  calendar_api_key?: string;        // Gmail/Google Calendar API key
  calendar_auth?: string;           // OAuth token for calendar access
  calendar_email?: string;          // Email for calendar identification
  local_calendar_path?: string;     // Custom path for local calendar DB

  // Operation type (LLM-optimized operations)
  operation: 'find_availability' | 'check_conflicts' | 'schedule_event' |
             'get_agenda' | 'analyze_schedule' | 'manage_local' |
             'business_days' | 'generate_schedule';

  // Scheduling parameters
  duration?: number;                // Event duration in minutes
  participants?: string[];          // Email addresses for multi-party scheduling
  timeframe?: string;              // 'next_week', 'this_month', '2024-03-15'
  prefer_times?: string[];         // ['morning', 'afternoon', '2PM-4PM']
  avoid_conflicts?: boolean;       // Skip existing events (default: true)

  // Event management (local calendar)
  event_title?: string;
  event_description?: string;
  event_location?: string;
  event_type?: 'meeting' | 'deadline' | 'reminder' | 'block' | 'custom';
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;             // Every N periods
    end_date?: string;
    occurrences?: number;
  };

  // Business calendar parameters
  work_schedule?: {
    start_time: string;            // '09:00'
    end_time: string;              // '17:00'
    work_days: string[];           // ['monday', 'tuesday', ...]
    timezone?: string;
  };
  exclude_holidays?: boolean;
  region?: string;                 // For holiday calculations

  // Output controls (LLM context optimization)
  response_format?: 'minimal' | 'summary' | 'detailed';
  max_results?: number;            // Limit results for token efficiency
  include_reasoning?: boolean;     // Explain scheduling decisions
  timezone?: string;               // Output timezone
}
```

### LLM-Optimized Operations

#### 1. Find Available Time (Gmail API Mode)

```typescript
// "When can I schedule a 90-minute planning session with team@company.com next week?"
{
  operation: 'find_availability',
  calendar_api_key: 'gapi_xyz123',
  duration: 90,
  participants: ['team@company.com'],
  timeframe: 'next_week',
  prefer_times: ['morning'],
  response_format: 'minimal'
}
// Output: ["Tue 10:00-11:30", "Wed 9:00-10:30", "Fri 8:30-10:00"]
```

#### 2. Check Scheduling Conflicts

```typescript
// "Can I add a recurring standup every Monday at 9 AM?"
{
  operation: 'check_conflicts',
  calendar_email: 'user@gmail.com',
  recurring: {
    pattern: 'weekly',
    interval: 1
  },
  event_type: 'meeting',
  duration: 30,
  timeframe: 'next_3_months'
}
// Output: "3 conflicts found: Mon Jan 15 (MLK Day), Mon Feb 19 (Presidents Day), Mon Mar 4 (existing meeting)"
```

#### 3. Local Calendar Management

```typescript
// "Create a local calendar for project deadlines"
{
  operation: 'manage_local',
  action: 'create_event',
  event_title: 'Q1 Report Due',
  event_type: 'deadline',
  timeframe: '2024-03-31',
  event_description: 'Quarterly business review report submission'
}
// Output: "Event created. 15 working days remaining until deadline."
```

#### 4. Business Day Calculations

```typescript
// "How many working days until project deadline?"
{
  operation: 'business_days',
  target_date: '2024-06-15',
  work_schedule: {
    start_time: '09:00',
    end_time: '17:00',
    work_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  },
  exclude_holidays: true,
  region: 'US'
}
// Output: "47 working days (excluding 2 holidays and 10 weekend days)"
```

#### 5. Schedule Generation

```typescript
// "Generate a content calendar for bi-weekly blog posts"
{
  operation: 'generate_schedule',
  recurring: {
    pattern: 'weekly',
    interval: 2
  },
  event_type: 'reminder',
  event_title: 'Blog Post Due',
  timeframe: 'next_quarter',
  prefer_times: ['tuesday'],
  response_format: 'summary'
}
// Output: "6 blog post deadlines scheduled: Jan 9, Jan 23, Feb 6, Feb 20, Mar 5, Mar 19 (all Tuesdays 9 AM)"
```

## Implementation Strategy

### Phase 1: Hybrid Calendar Foundation
- **Local calendar**: SQLite database creation and basic CRUD operations
- **API connectivity**: Gmail Calendar API integration with OAuth flow
- **Source detection**: Automatic fallback from API to local mode
- **Basic operations**: Event creation, conflict detection, availability lookup

### Phase 2: LLM-Optimized Scheduling
- **Smart availability**: Multi-participant scheduling with conflict resolution
- **Business day logic**: Work schedule integration with holiday awareness
- **Context-efficient output**: Minimal token usage for calendar responses
- **Local calendar management**: Full event lifecycle in local mode

### Phase 3: Advanced Calendar Intelligence
- **Pattern recognition**: Learn from calendar usage for better suggestions
- **Cross-calendar operations**: Sync between local and remote calendars
- **Bulk scheduling**: Generate recurring events and content calendars
- **Calendar analysis**: Productivity insights and availability optimization

### Phase 4: Production Readiness
- **Error handling**: Graceful API failures, network timeouts, auth expiry
- **Performance optimization**: Caching, efficient queries, rate limiting
- **Security**: Secure credential storage, minimal permission requests
- **Documentation**: Clear setup guides for both API and local modes

## Technical Implementation Details

### Calendar Source Management
```typescript
// Automatic source detection
if (calendar_api_key || calendar_auth) {
  // Use Gmail/Google Calendar API
  source = new GoogleCalendarAPI(credentials);
} else {
  // Initialize/use local SQLite calendar
  source = new LocalCalendar(getCalendarPath());
  // Prompt for basic setup if first time
  if (!source.isInitialized()) {
    await source.promptSetup();
  }
}
```

### Local Calendar Schema
```sql
-- SQLite schema for local calendar
CREATE TABLE events (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_datetime TEXT NOT NULL,
  end_datetime TEXT NOT NULL,
  event_type TEXT DEFAULT 'meeting',
  location TEXT,
  recurrence_rule TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_settings (
  key TEXT PRIMARY KEY,
  value TEXT
  -- Store work_schedule, timezone, holidays, etc.
);
```

### Dependencies & Libraries
- **Google APIs**: `@google-cloud/calendar` for Gmail integration
- **SQLite**: `better-sqlite3` for local calendar storage
- **Date handling**: `luxon` for timezone-aware date operations
- **Validation**: `zod` for parameter validation and JSON schema
- **OAuth**: `google-auth-library` for calendar API authentication

### Error Handling & Fallbacks
- **API failures**: Auto-fallback to local calendar with user notification
- **Rate limiting**: Implement exponential backoff for API calls
- **Invalid credentials**: Clear error messages with setup guidance
- **Local DB corruption**: Automatic backup and recovery procedures

### Context Optimization Strategies
- **Response trimming**: Return only essential scheduling information
- **Conflict summarization**: "3 conflicts found" instead of full event details
- **Progressive disclosure**: Basic info first, details on request
- **Smart defaults**: Infer user intent from minimal parameters

## Integration with Existing Tools

### Synergy with TIME_CALCULATOR
- Use TIME_CALCULATOR for duration calculations within calendar operations
- Leverage existing timezone conversion logic for cross-timezone scheduling
- Share business day calculation utilities for deadline planning

### Synergy with GET_TIME
- Use current time as default reference point for all operations
- Share timezone handling logic for consistent time representation
- Consistent date format handling across all chrono tools

## Success Metrics

- **LLM Integration**: Seamless scheduling assistance in conversational context
- **Hybrid functionality**: Smooth operation in both API and local modes
- **Context efficiency**: <50 tokens average response for scheduling queries
- **Real-world utility**: Actual calendar integration for practical scheduling
- **Setup simplicity**: <2 minutes from install to first successful operation
- **Conflict accuracy**: 99%+ accuracy in detecting scheduling conflicts
- **Performance**: <2 second response time for availability queries

## Quick Start Examples

### Gmail API Mode Setup
```bash
# User provides API key once
calendar_api_key="your_gmail_api_key_here"

# Tool automatically handles authentication and calendar access
# All subsequent operations use real calendar data
```

### Local Calendar Mode Setup
```bash
# No API key provided
# Tool prompts: "No calendar API detected. Create local calendar? (y/n)"
# User answers basic questions:
# - Timezone: "America/New_York"
# - Work schedule: "9 AM - 5 PM, Monday-Friday"
# - Region for holidays: "US"

# Local SQLite calendar created at: ~/.chrono-mcp/calendar.db
# Tool ready for scheduling operations
```

## Future Enhancements

### Additional Calendar Integrations
- **Outlook/Exchange**: Microsoft calendar API support
- **Apple Calendar**: CalDAV integration for iCloud calendars
- **Slack**: Integration with Slack's native calendar features
- **Multiple accounts**: Support for multiple Gmail/Google accounts

### Advanced LLM Features
- **Natural language parsing**: "Schedule something next Tuesday afternoon"
- **Smart suggestions**: "Your Tuesdays are usually free - schedule then?"
- **Meeting optimization**: "Move this to minimize travel time between meetings"
- **Focus time protection**: "This would break your 3-hour focus block"

### Enterprise Features
- **Team calendar coordination**: Multi-user availability across organizations
- **Resource booking**: Conference rooms, equipment scheduling
- **Approval workflows**: Manager approval for certain meeting types
- **Analytics**: Team productivity and meeting efficiency insights
