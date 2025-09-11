# Chrono MCP Implementation Plan

## Overview
A time-focused MCP server built with Luxon for robust date/time operations, timezone handling, and calendar functionality.

## Architecture Guidelines

### Modular Tool Structure
- **Individual tool files**: Each MCP tool implemented in `src/tools/tool-name.ts`
- **Shared utilities**: Common date/time operations in `src/utils/date-utils.ts`
- **Specialized classes**: Complex operations like timezone conversion, business day calculations in dedicated classes
- **Main server**: `src/index.ts` handles tool registration and MCP protocol

### Code Organization
```
src/
├── index.ts              # Main MCP server and tool registration
├── tools/                # Individual tool implementations
│   ├── current-time.ts
│   ├── convert-timezone.ts
│   ├── format-datetime.ts
│   └── ...
├── utils/                # Shared utilities
│   ├── date-utils.ts     # Common date operations
│   ├── timezone-utils.ts # Timezone helpers
│   └── validation.ts     # Shared Zod schemas
└── classes/              # Specialized date/time classes
    ├── TimezoneConverter.ts
    ├── BusinessDays.ts
    └── RecurringSchedule.ts
```

## Library Choice: Luxon

**Why Luxon:**
- Excellent timezone handling (critical for time operations)
- Immutable, chainable API prevents bugs
- Native Intl support without extra files
- Created by Moment.js author (mature, well-maintained)
- Perfect for complex time operations an MCP server might need

## Proposed MCP Tools

### Core Time Tools
1. **`current_time`** - Get current time in various formats/timezones
2. **`convert_timezone`** - Convert time between timezones
3. **`format_datetime`** - Format dates/times with custom patterns
4. **`parse_datetime`** - Parse date strings into structured data
5. **`time_arithmetic`** - Add/subtract time periods (days, hours, etc.)

### Advanced Tools
6. **`time_comparison`** - Compare two dates/times (diff, is_before, etc.)
7. **`interval_operations`** - Work with time intervals and ranges
8. **`business_time`** - Calculate business days, exclude weekends/holidays
9. **`recurring_schedule`** - Generate recurring datetime patterns
10. **`time_zone_info`** - Get timezone information and offsets

### Utility Tools
11. **`duration_calculator`** - Calculate durations between times
12. **`calendar_operations`** - Start/end of day/week/month/year
13. **`relative_time`** - Human-readable relative times ("2 hours ago")

## Potential Resources

### Time Zone Resources
- `/timezones` - List of available timezones
- `/timezones/{zone}` - Specific timezone info and current time

### Calendar Resources  
- `/calendar/{year}/{month}` - Calendar data for specific months
- `/holidays/{region}/{year}` - Holiday information by region

### Format Resources
- `/formats` - Available datetime format patterns
- `/locales` - Supported locales for internationalization

## Implementation Plan

### Phase 1: Core Foundation
1. Set up modular architecture with `src/tools/` and `src/utils/` directories
2. Create shared utilities: `date-utils.ts`, `timezone-utils.ts`, `validation.ts`
3. Implement core tools in separate files:
   - `src/tools/current-time.ts`
   - `src/tools/convert-timezone.ts` 
   - `src/tools/format-datetime.ts`
4. Update `src/index.ts` to import and register tools
5. Add Luxon dependency and comprehensive Zod schemas

### Phase 2: Advanced Features
6. Implement remaining tools in `src/tools/`:
   - `time-arithmetic.ts`, `time-comparison.ts`
   - `duration-calculator.ts`, `interval-operations.ts`
7. Create specialized classes in `src/classes/`:
   - `BusinessDays.ts` for business time calculations
   - `TimezoneConverter.ts` for complex timezone operations

### Phase 3: Resources & Polish
8. Add remaining utility tools: `relative-time.ts`, `calendar-operations.ts`
9. Create `RecurringSchedule.ts` class for complex scheduling
10. Implement MCP resources for timezones and calendar data
11. Comprehensive testing and documentation

### Phase 4: Enhancements
12. Holiday support with configurable regions
13. Advanced formatting options and locale support
14. Performance optimizations and caching strategies

## Next Steps
Begin with Phase 1 - set up the modular architecture and implement core time tools using Luxon, following the established patterns for shared utilities and individual tool files.