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
import { configManager } from "./utils/config.js";
import { SessionClock } from "./utils/envelope.js";

export default function createServer(_opts: { config?: unknown } = {}) {
	const server = new Server(
		{ name: "chrono-mcp", version: "0.5.0" },
		{ capabilities: { tools: {} } },
	);

	const sessionClock = new SessionClock();

	server.setRequestHandler(ListToolsRequestSchema, async () => ({
		tools: [getTimeTool, timeCalculatorTool],
	}));

	server.setRequestHandler(CallToolRequestSchema, async (request) => {
		let result: Awaited<ReturnType<typeof handleGetTime>>;
		switch (request.params.name) {
			case getTimeTool.name:
				result = await handleGetTime(request.params.arguments ?? {});
				break;
			case timeCalculatorTool.name:
				result = await handleTimeCalculator(request.params.arguments ?? {});
				break;
			default:
				throw new McpError(
					ErrorCode.MethodNotFound,
					`Unknown tool: ${request.params.name}`,
				);
		}

		if (configManager.isEnvelopeEnabled() && Array.isArray(result.content)) {
			result.content.push({ type: "text", text: sessionClock.stamp() });
		}
		return result;
	});

	return server;
}
