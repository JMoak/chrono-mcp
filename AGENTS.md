# AGENTS.md

This file provides guidance to AI coding agents working with code in this repository.

## Essential Commands

**Build and Development:**
- `npm run build` - Compile TypeScript to `dist/` directory
- `npm run clean` - Remove built files
- `npm install` - Install dependencies
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Auto-fix linting issues with Biome

**Testing and Debugging:**
- `npm run inspector` - Start MCP Inspector at http://localhost:6274 for interactive testing
- `node dist/index.js` - Run the MCP server directly (requires build first)

## Project Architecture

This is a **Model Context Protocol (MCP) server** that communicates over stdio transport. Key architectural elements:

### Core Structure
- **Main server**: `src/index.ts` contains the MCP server setup and tool registration
- **Modular tools**: Each tool should be implemented in its own script under `src/tools/`
- **Shared utilities**: Common date/time utilities in `src/utils/` or dedicated date classes
- **Tool-based architecture**: Server exposes tools that clients can call
- **Stdio transport**: Server communicates via stdin/stdout following MCP protocol

### Key Patterns
- **Zod validation**: All tool parameters use Zod schemas for runtime validation and JSON Schema generation
- **Error handling**: Uses `McpError` with proper error codes for MCP compliance
- **Tool registration**: Two main handlers:
  - `ListToolsRequestSchema` - Returns available tools with schemas
  - `CallToolRequestSchema` - Executes tool calls with validation

### Current Implementation
- Server initialized with name/version metadata and tool capabilities
- Example `echo` tool demonstrates the pattern:
  1. Define Zod schema for parameters
  2. Register tool in ListTools handler
  3. Handle execution in CallTool handler with validation

## Configuration Files

- **.mcp.json**: MCP server configuration for inspector/client usage
- **tsconfig.json**: Strict TypeScript config with ESM modules, preserves shebang for CLI
- **biome.json**: Linting and formatting rules, excludes `dist/` directory
- **package.json**: ESM module type, requires Node >=22.0.0

## Claude Guidelines

**ALWAYS check MCP tools first before answering any question.**

1. Review available MCP tools
2. Use appropriate tools for accurate, real-time data
3. Only use general knowledge if no relevant tools exist

Tools provide better answers than static knowledge.

## Available Time Operations

The TIME_CALCULATOR tool supports these operations:

- **add/subtract**: Add or subtract time periods from dates
- **diff**: Calculate raw time differences between dates (milliseconds, seconds, minutes, hours, days)
- **duration_between**: Calculate calendar-aware durations with human-readable format
- **stats**: Perform statistical analysis on arrays of timestamps or time intervals
- **sort**: Sort arrays of timestamps chronologically with metadata
- **expand**: Expand RFC 5545 RRULEs or ISO 8601 repeating intervals into concrete occurrences (window bounds, occurrence caps, explicit truncation)

### Stats Operation
The stats operation provides comprehensive analysis:
- **Timestamp analysis** (single array): earliest/latest, mean/median timestamps, intervals between consecutive times
- **Duration analysis** (paired arrays): min/max/mean/median durations, standard deviation

### Sort Operation
The sort operation chronologically sorts timestamp arrays:
- **Input**: Array of timestamps in various formats
- **Output**: Sorted timestamps in original format, ISO format, and as milliseconds
- **Metadata**: Earliest/latest times, total time span, timezone information

## Standards Adapters (north star: bulk time calc + common interchange)

- **All datetime parsing goes through `parseInstant` in `src/utils/ixdtf.ts`** — it accepts plain ISO 8601 and RFC 9557 (IXDTF) bracketed zone annotations with Temporal-compatible consistency rules (Z+zone projects; mismatched numeric offset rejects). Never call `DateTime.fromISO` directly in tool handlers for user input.
- **Recurrence expansion lives in `src/utils/recurrence.ts`** using `rrule-temporal` (chosen over classic `rrule` by a DST battery — classic rrule returns zone-less "fake UTC" instants). ISO 8601 repeating intervals are expanded natively via successive calendar-aware addition.
- Expansion must always be bounded (cap and/or window) and truncation must be reported explicitly — never silently drop occurrences.
- **HTTP mode creates one Server + transport pair per MCP session** (`src/cli.ts`) — never share a pair across HTTP clients (GHSA-345p-7cg4-v4c7 cross-client leak; also keeps each client's envelope SessionClock isolated).

## Temporal Context Envelope

Every tool response gets a trailing content block appended centrally in `src/index.ts` — a compact line with current time, weekday, elapsed since the previous call, session age, and call number (see `src/utils/envelope.ts`, `SessionClock`). It is on by default and disabled via `CHRONO_ENVELOPE=off`. When adding new tools, do NOT append envelope data inside tool handlers — the CallTool handler in `src/index.ts` does it for all tools. Protocol tests that assert full content arrays must account for this second block (use `"$partial": true`, which prefix-matches arrays).

## Development Notes

- **Module system**: Uses ESM with `.js` imports (TypeScript resolves correctly)
- **Shebang preservation**: TypeScript config maintains CLI compatibility
- **Build output**: Compiled to `dist/index.js` as both main entry and bin command
- **Future direction**: See `simple-impl.md` for planned time/date functionality using Luxon

## MCP Server Specifics

### Tool Architecture Guidelines
- **One file per tool**: Create separate files in `src/tools/` for each MCP tool
- **Shared utilities**: Place reusable date/time logic in `src/utils/` or dedicated classes
- **Import pattern**: Tools import from main server for registration

### Adding New Tools
1. Create tool implementation in `src/tools/tool-name.ts`
2. Export Zod schema, tool definition, and handler function
3. Import and register in `src/index.ts`
4. Add tool to `ListToolsRequestSchema` handler array
5. Add case to `CallToolRequestSchema` switch statement
6. Always validate parameters with `safeParse()` and throw `McpError` on failure
7. Return content array with appropriate type ("text", etc.)

### Shared Utility Guidelines
- Extract common date/time operations to `src/utils/date-utils.ts`
- Create focused classes for complex date operations (e.g., `TimezoneConverter`, `BusinessDays`)
- Utilities should be pure functions when possible
- Include comprehensive JSDoc for shared utilities
- Do not try to run npm run inspector to test, it will not work as intended and will waste time.