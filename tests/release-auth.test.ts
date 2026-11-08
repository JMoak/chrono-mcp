import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { verifyConditions } from "@semantic-release/npm";
import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
	vi.unstubAllEnvs();
	vi.unstubAllGlobals();
});

it("verifies the package's npm authentication through GitHub OIDC without an npm token", async () => {
	const requests: string[] = [];
	const identityProvider = createServer((request, response) => {
		requests.push(request.url ?? "");
		response.setHeader("content-type", "application/json");
		response.end(JSON.stringify({ value: "test-oidc-identity" }));
	});
	await new Promise<void>((resolve) =>
		identityProvider.listen(0, "127.0.0.1", resolve),
	);
	const { port } = identityProvider.address() as AddressInfo;
	const exchange = vi.fn(
		async () => new Response(JSON.stringify({ token: "test-npm-token" })),
	);
	vi.stubGlobal("fetch", exchange);
	vi.stubEnv("GITHUB_ACTIONS", "true");
	vi.stubEnv("GITHUB_EVENT_NAME", "push");
	vi.stubEnv("GITHUB_REF", "refs/heads/main");
	vi.stubEnv(
		"ACTIONS_ID_TOKEN_REQUEST_URL",
		`http://127.0.0.1:${port}/token?test=true`,
	);
	vi.stubEnv("ACTIONS_ID_TOKEN_REQUEST_TOKEN", "test-request-token");
	vi.stubEnv("NPM_TOKEN", "");
	vi.stubEnv("NODE_AUTH_TOKEN", "");
	try {
		await verifyConditions(
			{},
			{
				cwd: process.cwd(),
				env: { NPM_CONFIG_USERCONFIG: "nonexistent-test-npmrc" },
				options: {},
				logger: { log() {} },
			},
		);
		expect(requests).toHaveLength(1);
		expect(requests[0]).toContain("audience=npm%3Aregistry.npmjs.org");
		expect(exchange).toHaveBeenCalledWith(
			"https://registry.npmjs.org/-/npm/v1/oidc/token/exchange/package/%40jmoak%2Fchrono-mcp",
			{
				method: "POST",
				headers: { Authorization: "Bearer test-oidc-identity" },
			},
		);
	} finally {
		await new Promise<void>((resolve, reject) =>
			identityProvider.close((error) => (error ? reject(error) : resolve())),
		);
	}
});
