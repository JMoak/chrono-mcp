# chrono-mcp

A time-focused MCP server providing robust date/time operations, timezone handling, and formatting capabilities using Luxon.

Features:
- **GET TIME** tool with comprehensive timezone/format support
- Luxon-powered date/time handling with locale support
- Zod runtime validation + JSON Schema exposure
- ESM, TypeScript, and `npm`-friendly packaging for `npx` usage
- Comprehensive test coverage with Vitest
- Biome config for lint/format

## Install / Build

- Install deps: `npm install`
- Build: `npm run build` (outputs to `dist/`)

## Local Development with Inspector

For testing and debugging your MCP server locally, use the MCP Inspector:

- Start inspector: `npm run inspector`

The inspector provides a web interface at `http://localhost:6274` to test your MCP server tools interactively. Configuration is stored in `.local-mcp/mcp.json`.

## Usage

Run via Node directly:

```
node dist/index.js
```

Or, once published, run with npx:

```
npx chrono-mcp
```

The server communicates over stdio per MCP conventions. 

## Available Tools

### GET TIME
**Comprehensive time operations with timezone and format support**

- **Parameters:**
  - `datetime` (string, optional): ISO datetime string. Defaults to current time
  - `timezones` (array, optional): List of timezone names for conversions
  - `formats` (array, optional): Output formats: `iso`, `rfc2822`, `sql`, `local`, `localeString`, `short`, `medium`, `long`, `full`
  - `locale` (string, optional): Locale for formatting (e.g., `en-US`, `fr-FR`, `ja-JP`)
  - `includeOffsets` (boolean, optional): Include UTC offsets in timezone outputs
  - `comparisons` (array, optional): ISO datetime strings to compare with base time

**Fully Implemented:**
- ✅ Current time retrieval
- ✅ Timezone conversions with DST handling
- ✅ Multiple format outputs with locale support
- ✅ UTC offset control

**Under Development:**
- 🚧 Time comparisons (relative time calculations)

## Dev Notes

- Node >= 22.0.0
- TypeScript config preserves shebang for CLI use.
- For lint/format:
  - Lint: `npm run lint`
  - Format: `npm run format`

## License

MIT
