# chrono-mcp

Lightweight TypeScript MCP server template using stdio transport, Zod for input validation, and Biome for linting/formatting.

Features:
- Minimal MCP server with `echo` tool
- Zod runtime validation + JSON Schema exposure via `zod-to-json-schema`
- ESM, TypeScript, and `npm`-friendly packaging for `npx` usage
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

The server communicates over stdio per MCP conventions. It exposes a single tool:

- name: `echo`
- description: Echo back input text
- input schema:
  - `text` (string, required): Text to echo back
  - `uppercase` (boolean, optional): Return text uppercased

## Dev Notes

- Node >= 22.0.0
- TypeScript config preserves shebang for CLI use.
- For lint/format:
  - Lint: `npm run lint`
  - Format: `npm run format`

## License

MIT
