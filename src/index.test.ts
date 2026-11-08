import { createRequire } from "node:module";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { expect, it } from "vitest";
import createServer from "./index.js";

it("reports the installed package version during the MCP handshake", async () => {
	const { version } = createRequire(import.meta.url)("../package.json");
	const server = createServer();
	const client = new Client({ name: "version-test", version: "1.0.0" });
	const [clientTransport, serverTransport] =
		InMemoryTransport.createLinkedPair();
	try {
		await server.connect(serverTransport);
		await client.connect(clientTransport);
		expect(client.getServerVersion()).toEqual({ name: "chrono-mcp", version });
	} finally {
		await client.close();
		await server.close();
	}
});
