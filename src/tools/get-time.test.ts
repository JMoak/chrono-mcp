import { describe, it, expect, vi } from "vitest";
import { DateTime } from "luxon";
import { handleGetTime } from "./get-time.js";

describe("handleGetTime", () => {
	describe("basetime output", () => {
		it("should return current time as baseTime when no datetime provided", async () => {
			// Mock DateTime.now() to return a fixed time
			const fixedTime = DateTime.fromISO("2024-12-25T15:00:00.000Z");
			vi.spyOn(DateTime, "now").mockReturnValue(fixedTime);

			const result = await handleGetTime({});

			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.baseTime).toMatch(/2024-12-25T\d{2}:00:00\.000/);

			vi.restoreAllMocks();
		});

		it("should use provided datetime as baseTime", async () => {
			const inputDateTime = "2024-07-15T12:30:45";
			const result = await handleGetTime({ datetime: inputDateTime });

			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.baseTime).toMatch(/2024-07-15T12:30:45/);
		});

		it("should handle invalid datetime format", async () => {
			const result = await handleGetTime({ datetime: "invalid-date" });

			expect(result.content).toHaveLength(1);
			expect(result.content[0].type).toBe("text");
			expect(result.content[0].text).toMatch(/Error parsing datetime/);
		});

		it("should return baseTime in ISO format by default", async () => {
			const inputDateTime = "2024-03-10T08:15:30";
			const result = await handleGetTime({ datetime: inputDateTime });

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.baseTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}/);
		});
	});
});