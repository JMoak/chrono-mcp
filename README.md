# chrono-mcp

A comprehensive Model Context Protocol (MCP) server providing advanced date, time, timezone, and calendar operations powered by Luxon. Perfect for AI agents and applications that need robust temporal data handling.

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


## Features

- **Global Timezone Support** - Work with all IANA timezone identifiers
- **Time Calculations** - Add/subtract durations, calculate differences between dates
- **Multiple Formats** - ISO, RFC2822, SQL, locale-aware, and custom formatting
- **Type Safety** - Zod validation with comprehensive error handling
- **Real-time** - Current time retrieval with microsecond precision
- **Easy Integration** - Standard MCP protocol for seamless AI agent integration
- **Token-Optimized Output** - Dynamically shaped responses that maximize information density while minimizing token usage for efficient AI interactions

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

Perform time arithmetic operations including duration calculations and date math.

**Operations:**
- `add` - Add duration to a datetime
- `subtract` - Subtract duration from a datetime
- `diff` - Calculate simple difference in various units
- `duration_between` - Detailed duration breakdown between two times
- `stats` - Statistical analysis of time series and durations
- `sort` - Sort timestamps chronologically

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
npm run inspector
```
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