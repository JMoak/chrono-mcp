#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { createServer as createNodeHttpServer } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import createServer from "./index.js";

async function main() {
	const mode = (process.env.MCP_TRANSPORT ?? "stdio").toLowerCase();

	if (mode === "http") {
		const port = Number(process.env.PORT ?? 8000);

		// One Server + transport pair per MCP session (GHSA-345p-7cg4-v4c7:
		// sharing a single pair across HTTP clients leaks data between them).
		// Per-session servers also keep the temporal context envelope's
		// SessionClock scoped to each client's own conversation.
		const transports = new Map<string, StreamableHTTPServerTransport>();

		const httpServer = createNodeHttpServer(async (req, res) => {
			const url = new URL(req.url ?? "/", "http://localhost");
			if (url.pathname === "/mcp") {
				try {
					const sessionId = req.headers["mcp-session-id"];
					const existing =
						typeof sessionId === "string"
							? transports.get(sessionId)
							: undefined;
					if (existing) {
						await existing.handleRequest(req, res);
						return;
					}

					// No known session: only an initialize request may open one.
					// The transport rejects anything else with a JSON-RPC error.
					const transport = new StreamableHTTPServerTransport({
						sessionIdGenerator: () => randomUUID(),
						onsessioninitialized: (sid) => {
							transports.set(sid, transport);
						},
					});
					transport.onclose = () => {
						if (transport.sessionId) {
							transports.delete(transport.sessionId);
						}
					};
					const server = createServer();
					// SDK 1.30 class typings conflict with exactOptionalPropertyTypes
					await server.connect(transport as unknown as Transport);
					await transport.handleRequest(req, res);
					if (!transport.sessionId) {
						// Initialization did not complete; discard the pair
						await transport.close();
					}
				} catch (err) {
					console.error("Error handling MCP request:", err);
					if (!res.headersSent) {
						res.statusCode = 500;
						res.end();
					}
				}
				return;
			}
			if (url.pathname === "/health") {
				res.statusCode = 200;
				res.setHeader("Content-Type", "application/json");
				res.end(
					JSON.stringify({ status: "ok", sessions: transports.size }),
				);
				return;
			}
			res.statusCode = 404;
			res.end();
		});
		httpServer.listen(port);
		return;
	}

	const server = createServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	console.error("Fatal error starting MCP server:", err);
	process.exit(1);
});
