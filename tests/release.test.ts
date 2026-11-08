import { readFileSync } from "node:fs";
import { analyzeCommits } from "@semantic-release/commit-analyzer";
import { generateNotes } from "@semantic-release/release-notes-generator";
import { describe, expect, it } from "vitest";

const releaseConfig = JSON.parse(
	readFileSync(new URL("../.releaserc.json", import.meta.url), "utf8"),
);
const [, analyzerOptions] = releaseConfig.plugins.find(
	(plugin: unknown) =>
		Array.isArray(plugin) && plugin[0] === "@semantic-release/commit-analyzer",
);

describe("release commit analysis", () => {
	it.each([
		[["fix: correct a timezone offset"], "patch"],
		[["perf(stats): reduce allocations"], "patch"],
		[["feat(recurrence): support calendar intervals"], "minor"],
		[["fix!: reject ambiguous dates"], "major"],
		[
			["feat(api): change inputs\n\nBREAKING CHANGE: remove legacy input"],
			"major",
		],
		[["docs: update examples", "chore: refresh dependencies"], null],
		[
			[
				"Merge pull request #50 from JMoak/timezone-fix",
				"fix: correct an offset",
			],
			"patch",
		],
		[
			[
				"chore: merge cleanup",
				"fix: correct an offset",
				"feat: add recurrence",
			],
			"minor",
		],
		[[], null],
	])("%j selects %s", async (messages, expected) => {
		const result = await analyzeCommits(analyzerOptions, {
			cwd: process.cwd(),
			commits: (messages as string[]).map((message, index) => ({
				hash: index.toString(16).padStart(40, "0"),
				message,
			})),
			logger: { log() {} },
		});
		expect(result).toBe(expected);
	});
});

it("renders release notes with the configured conventional-commits preset", async () => {
	const [, notesOptions] = releaseConfig.plugins.find(
		(plugin: unknown) =>
			Array.isArray(plugin) &&
			plugin[0] === "@semantic-release/release-notes-generator",
	);
	const notes = await generateNotes(notesOptions, {
		cwd: process.cwd(),
		options: { repositoryUrl: "https://github.com/JMoak/chrono-mcp.git" },
		commits: [{ hash: "a".repeat(40), message: "feat: add recurrence" }],
		lastRelease: { version: "0.4.2", gitTag: "v0.4.2" },
		nextRelease: { version: "0.5.0", gitTag: "v0.5.0" },
		logger: { log() {} },
	});
	expect(notes).toContain("0.5.0");
	expect(notes).toContain("add recurrence");
});
