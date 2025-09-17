import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
	CallToolRequestSchema,
	ErrorCode,
	ListToolsRequestSchema,
	McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { getTimeTool, handleGetTime } from "./tools/get-time.js";
import {
	handleTimeCalculator,
	timeCalculatorTool,
} from "./tools/time-calculator.js";

export default function createServer(_opts: { config?: unknown } = {}) {
	const server = new Server(
		{ name: "chrono-mcp", version: "0.2.0" },
		{ capabilities: { tools: {} } },
	);

	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [getTimeTool, timeCalculatorTool],
	}));

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		switch (request.params.name) {
			case getTimeTool.name:
				return await handleGetTime(request.params.arguments ?? {});
			case timeCalculatorTool.name:
				return await handleTimeCalculator(request.params.arguments ?? {});
			default:
				throw new McpError(
					ErrorCode.MethodNotFound,
					`Unknown tool: ${request.params.name}`,
				);
		}
	});

	return server;
}
