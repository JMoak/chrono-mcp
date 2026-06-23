# chrono-mcp Examples

This directory contains practical examples demonstrating how to use chrono-mcp with various MCP clients and use cases.

## Available Examples

| Example | Description |
|---------|-------------|
| [basic-time-query.md](basic-time-query.md) | Simple time queries and timezone conversions |
| [time-calculations.md](time-calculations.md) | Date arithmetic and duration calculations |
| [batch-operations.md](batch-operations.md) | Processing multiple timestamps efficiently |
| [client-configurations.md](client-configurations.md) | Setup guides for various MCP clients |
| [scheduling-workflow.md](scheduling-workflow.md) | Real-world scheduling example |

## Quick Start

### Using with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"]
    }
  }
}
```

### Using with Claude Code

```bash
# Add to your project
claude mcp add chrono-mcp npx -y @jmoak/chrono-mcp@latest
```

### Using with Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"]
    }
  }
}
```

## Common Patterns

### Get Current Time in Multiple Zones

```json
{
  "timezones": ["America/New_York", "Europe/London", "Asia/Tokyo"],
  "includeOffsets": true
}
```

### Calculate Duration Between Dates

```json
{
  "operation": "duration_between",
  "base_time": "2024-01-01T00:00:00Z",
  "compare_time": "2024-12-31T23:59:59Z"
}
```

### Add Time to a Date

```json
{
  "operation": "add",
  "base_time": "2024-12-25T10:00:00Z",
  "days": 5,
  "hours": 3
}
```

## Running Examples

Each example includes:
- **Input**: The JSON parameters to send to the tool
- **Expected Output**: What the tool will return
- **Use Case**: When you might use this pattern

See individual example files for detailed walkthroughs.
