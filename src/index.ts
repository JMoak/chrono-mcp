#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { ToolSchema } from "@modelcontextprotocol/sdk/types.js";
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const server = new Server(
	{ name: "chrono-mcp", version: "0.1.0" },
	{ capabilities: { tools: {} } },
);

type ToolInput = z.infer<typeof ToolSchema.shape.inputSchema>;

// Minimal example tool: echo
const EchoParamsSchema = z
	.object({
		text: z.string().min(1).describe("Text to echo back"),
		uppercase: z
			.boolean()
			.optional()
			.describe("If true, return the text in uppercase"),
	})
	.describe("Parameters for echo tool");

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		{
			name: "echo",
			description: "Echo back input text",
			inputSchema: z.toJSONSchema(EchoParamsSchema) as ToolInput,
		},
	],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	switch (request.params.name) {
		case "echo": {
			// Validate with Zod at runtime
			const parsed = EchoParamsSchema.safeParse(request.params.arguments ?? {});
			if (!parsed.success) {
				throw new McpError(
					ErrorCode.InvalidParams,
					`Invalid arguments for echo: ${parsed.error.message}`,
				);
			}
			const { text, uppercase } = parsed.data;
			const value = uppercase ? text.toUpperCase() : text;
			return {
				content: [
					{
						type: "text",
						text: value,
					},
				],
			};
		}
		default:
			throw new McpError(
				ErrorCode.MethodNotFound,
				`Unknown tool: ${request.params.name}`,
			);
	}
});

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	console.error("Fatal error starting MCP server:", err);
	process.exit(1);
});
