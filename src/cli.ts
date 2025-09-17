#!/usr/bin/env node
import { createServer as createNodeHttpServer } from "node:http";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import createServer from "./index.js";

async function main() {
	const server = createServer();
	const mode = (process.env.MCP_TRANSPORT ?? "stdio").toLowerCase();

	if (mode === "http") {
		const port = Number(process.env.PORT ?? 8000);
		const transport = new StreamableHTTPServerTransport({
			sessionIdGenerator: undefined,
		});
		await server.connect(transport);
		const httpServer = createNodeHttpServer(async (req, res) => {
			const url = new URL(req.url ?? "/", "http://localhost");
			if (url.pathname === "/mcp") {
				await transport.handleRequest(req, res);
				return;
			}
			if (url.pathname === "/health") {
				res.statusCode = 200;
				res.setHeader("Content-Type", "application/json");
				res.end(JSON.stringify({ status: "ok" }));
				return;
			}
			res.statusCode = 404;
			res.end();
		});
		httpServer.listen(port);
		return;
	}

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	console.error("Fatal error starting MCP server:", err);
	process.exit(1);
});
