# chrono-mcp

A comprehensive Model Context Protocol (MCP) server providing advanced date, time, timezone, and calendar operations powered by Luxon. Perfect for AI agents and applications that need robust temporal data handling.

[![NPM Version](https://img.shields.io/npm/v/chrono-mcp)](https://npmjs.com/package/chrono-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/node/v/chrono-mcp)](https://nodejs.org/)

## Features

- **Global Timezone Support** - Work with all IANA timezone identifiers
- **Time Calculations** - Add/subtract durations, calculate differences between dates
- **Multiple Formats** - ISO, RFC2822, SQL, locale-aware, and custom formatting
- **Type Safety** - Zod validation with comprehensive error handling
- **Real-time** - Current time retrieval with microsecond precision
- **Easy Integration** - Standard MCP protocol for seamless AI agent integration
- **Token-Optimized Output** - Dynamically shaped responses that maximize information density while minimizing token usage for efficient AI interactions

## Installation

```bash
npm install chrono-mcp
```

Or run directly with npx:

```bash
npx chrono-mcp
```

## Quick Start

### Local Development & Testing

Start the MCP Inspector for interactive testing:

```bash
npm run inspector
```

Visit `http://localhost:6274` to test your tools in the web interface.

### Production Usage

The server communicates over stdio following MCP conventions:

```bash
node dist/index.js
# or
npx chrono-mcp
```

## Available Tools

### GET_TIME

Get current time or convert times across timezones with flexible formatting.

**Parameters:**
- `datetime` (string, optional): ISO datetime string. Defaults to current time
- `timezones` (array, optional): List of timezone names for conversions
- `formats` (array, optional): Output formats (`iso`, `rfc2822`, `sql`, `local`, `localeString`, `short`, `medium`, `long`, `full`)
- `locale` (string, optional): Locale for formatting (e.g., `en-US`, `fr-FR`, `ja-JP`)
- `includeOffsets` (boolean, optional): Include UTC offsets in output

**Examples:**
```json
// Get current time
{}

// Multiple timezones
{
  "timezones": ["America/New_York", "Asia/Tokyo", "Europe/London"]
}

// Specific time with formatting
{
  "datetime": "2024-12-25T15:00:00",
  "formats": ["iso", "localeString"],
  "timezones": ["America/Los_Angeles", "Asia/Tokyo"],
  "includeOffsets": true
}
```

### TIME_CALCULATOR

Perform time arithmetic operations including duration calculations and date math.

**Operations:**
- `add` - Add duration to a datetime
- `subtract` - Subtract duration from a datetime
- `diff` - Calculate simple difference in various units
- `duration_between` - Detailed duration breakdown between two times

**Parameters:**
- `operation` (required): Type of calculation
- `base_time` (optional): Base datetime (ISO format). Defaults to current time
- `target_time` (optional): Target datetime for diff operations
- `timezone` (optional): Timezone for base_time
- `target_time_timezone` (optional): Timezone for target_time
- `years`, `months`, `days`, `hours`, `minutes`, `seconds` (optional): Duration values

**Examples:**
```json
// Add 5 days and 3 hours
{
  "operation": "add",
  "base_time": "2024-12-25T10:00:00Z",
  "days": 5,
  "hours": 3
}

// Calculate difference between dates
{
  "operation": "diff",
  "base_time": "2024-01-01T00:00:00Z",
  "target_time": "2024-12-25T15:30:00Z"
}

// Multi-timezone duration
{
  "operation": "duration_between",
  "base_time": "2024-12-25T09:00:00",
  "timezone": "America/New_York",
  "target_time": "2024-12-25T18:00:00",
  "target_time_timezone": "Europe/London"
}
```

## MCP Client Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["chrono-mcp"]
    }
  }
}
```

## Development

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

### Testing
```bash
npm test
npm run test:ui  # Visual test interface
```

### Linting
```bash
npm run lint
npm run lint:fix
```

## Supported Timezones

Supports all IANA timezone identifiers including:

- **Americas**: `America/New_York`, `America/Los_Angeles`, `America/Toronto`, etc.
- **Europe**: `Europe/London`, `Europe/Paris`, `Europe/Berlin`, etc.
- **Asia**: `Asia/Tokyo`, `Asia/Shanghai`, `Asia/Dubai`, etc.
- **Australia**: `Australia/Sydney`, `Australia/Melbourne`, etc.
- **And 400+ more...**

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### v0.1.0
- Initial release with GET_TIME and TIME_CALCULATOR tools
- Comprehensive timezone support
- Multiple output formats
- Time arithmetic operations
- MCP Inspector integration