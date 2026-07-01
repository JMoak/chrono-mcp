# MCP Client Configuration Examples

Complete setup guides for configuring chrono-mcp with various MCP clients.

## Table of Contents

- [Claude Desktop](#claude-desktop)
- [Claude Code](#claude-code)
- [Cursor](#cursor)
- [Cline](#cline)
- [Other Clients](#other-clients)
- [HTTP Mode](#http-mode)

---

## Claude Desktop

### Configuration File Location

| Platform | Path |
|----------|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

### Basic Configuration

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

### Configuration with Environment Variables

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"],
      "env": {
        "DEBUG": "false",
        "NODE_OPTIONS": "--max-old-space-size=256"
      }
    }
  }
}
```

### Troubleshooting

**Server doesn't appear in Claude:**
1. Restart Claude Desktop completely
2. Check the configuration file is valid JSON
3. Verify Node.js is installed: `node --version`
4. Check Claude logs for errors

---

## Claude Code

### Using the CLI

```bash
# Add chrono-mcp as an MCP server
claude mcp add chrono-mcp npx -y @jmoak/chrono-mcp@latest

# Verify installation
claude mcp list
```

### Project-Specific Configuration

Add to your project's `.claude.json` or `.claude/settings.json`:

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

### Per-Project Setup Script

Create `scripts/setup-chrono-mcp.sh`:

```bash
#!/bin/bash
# Setup chrono-mcp for this project

if ! command -v claude &> /dev/null; then
    echo "Claude Code not found. Please install it first."
    exit 1
fi

claude mcp add chrono-mcp npx -y @jmoak/chrono-mcp@latest
echo "chrono-mcp configured for this project!"
```

---

## Cursor

### Configuration File Location

| Platform | Path |
|----------|------|
| macOS | `~/.cursor/mcp.json` |
| Windows | `%USERPROFILE%/.cursor/mcp.json` |
| Linux | `~/.cursor/mcp.json` |

### Basic Configuration

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

### Project-Specific Configuration

Create `.cursor/mcp.json` in your project root:

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

### With HTTP Support

```json
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

---

## Cline

### VS Code Extension Settings

Add to VS Code settings (`settings.json`):

```json
{
  "cline.mcpServers": [
    {
      "name": "chrono-mcp",
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"],
      "transportType": "stdio"
    }
  ]
}
```

### Using Cline's MCP Settings UI

1. Open Cline in VS Code
2. Go to Settings → MCP Servers
3. Add new server:
   - Name: `chrono-mcp`
   - Transport: `stdio`
   - Command: `npx`
   - Args: `-y @jmoak/chrono-mcp@latest`

---

## Other Clients

### Generic stdio Configuration

Most MCP clients supporting stdio transport:

```json
{
  "name": "chrono-mcp",
  "transport": "stdio",
  "command": "npx",
  "args": ["-y", "@jmoak/chrono-mcp@latest"]
}
```

### Windsurf

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

---

## HTTP Mode

For scenarios requiring HTTP transport (e.g., remote access or custom integrations):

### Starting the HTTP Server

```bash
# Install globally
npm install -g @jmoak/chrono-mcp

# Start HTTP server
MCP_TRANSPORT=http PORT=8000 chrono-mcp

# Or using npx
MCP_TRANSPORT=http PORT=8000 npx @jmoak/chrono-mcp
```

### HTTP Client Configuration

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "type": "http",
      "url": "http://localhost:8000/mcp"
    }
  }
}
```

### Health Check

```bash
# Verify the server is running
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "ok",
  "server": "chrono-mcp",
  "version": "0.4.2"
}
```

---

## Version Pinning

For reproducible builds, pin to a specific version:

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@0.4.2"]
    }
  }
}
```

---

## Environment Variables

### Available Options

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug output | `false` |
| `MCP_TRANSPORT` | Transport type (`stdio` or `http`) | `stdio` |
| `PORT` | HTTP server port | `8000` |
| `NODE_OPTIONS` | Node.js options | - |

### Example with Environment

```json
{
  "mcpServers": {
    "chrono-mcp": {
      "command": "npx",
      "args": ["-y", "@jmoak/chrono-mcp@latest"],
      "env": {
        "DEBUG": "false"
      }
    }
  }
}
```

---

## Verification

After configuration, verify the setup:

### Test GET TIME

Ask your AI assistant:
> "What time is it now in Tokyo, London, and New York?"

### Test TIME CALCULATOR

Ask your AI assistant:
> "Calculate the duration between January 1, 2024 and December 31, 2024"

---

## Troubleshooting

### Common Issues

**"command not found: npx"**
- Ensure Node.js is installed: `node --version`
- Install Node.js from [nodejs.org](https://nodejs.org/)

**"Server failed to start"**
- Check for port conflicts (HTTP mode)
- Verify the configuration JSON is valid
- Check firewall settings

**"Tools not appearing"**
- Restart your MCP client completely
- Check client logs for errors
- Verify the server starts manually: `npx @jmoak/chrono-mcp`

### Getting Help

- [GitHub Issues](https://github.com/JMoak/chrono-mcp/issues)
- [Documentation](https://github.com/JMoak/chrono-mcp/blob/main/README.md)
- [Examples](https://github.com/JMoak/chrono-mcp/tree/main/examples)