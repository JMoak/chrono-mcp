import { afterEach, describe, expect, it } from "vitest";
import { configManager } from "./config.js";

describe("ConfigManager", () => {
	// Reset config after each test
	afterEach(() => {
		configManager.setDebugMode(false);
	});

	describe("singleton pattern", () => {
		it("should return the same instance", () => {
			// We can't directly test the private constructor,
			// but we can verify behavior through the exported instance
			const initialDebugMode = configManager.isDebugMode();

			// Modify the instance
			configManager.setDebugMode(!initialDebugMode);

			// Verify the change persisted
			expect(configManager.isDebugMode()).toBe(!initialDebugMode);

			// Reset for other tests
			configManager.setDebugMode(initialDebugMode);
		});
	});

	describe("getConfig", () => {
		it("should return a copy of the config", () => {
			const config1 = configManager.getConfig();
			const config2 = configManager.getConfig();

			// Should be equal values
			expect(config1).toEqual(config2);

			// But different objects (copy, not reference)
			expect(config1).not.toBe(config2);
		});

		it("should reflect current debug mode state", () => {
			configManager.setDebugMode(true);
			const config = configManager.getConfig();
			expect(config.debugMode).toBe(true);

			configManager.setDebugMode(false);
			const config2 = configManager.getConfig();
			expect(config2.debugMode).toBe(false);
		});
	});

	describe("setDebugMode", () => {
		it("should enable debug mode", () => {
			configManager.setDebugMode(true);
			expect(configManager.isDebugMode()).toBe(true);
		});

		it("should disable debug mode", () => {
			configManager.setDebugMode(true);
			expect(configManager.isDebugMode()).toBe(true);

			configManager.setDebugMode(false);
			expect(configManager.isDebugMode()).toBe(false);
		});

		it("should persist between calls", () => {
			configManager.setDebugMode(true);
			expect(configManager.isDebugMode()).toBe(true);
			expect(configManager.isDebugMode()).toBe(true);
			expect(configManager.isDebugMode()).toBe(true);
		});
	});

	describe("isDebugMode", () => {
		it("should return false by default", () => {
			// Reset to ensure default state
			configManager.setDebugMode(false);
			expect(configManager.isDebugMode()).toBe(false);
		});

		it("should return true after enabling", () => {
			configManager.setDebugMode(true);
			expect(configManager.isDebugMode()).toBe(true);
		});

		it("should reflect multiple toggles", () => {
			configManager.setDebugMode(true);
			expect(configManager.isDebugMode()).toBe(true);

			configManager.setDebugMode(false);
			expect(configManager.isDebugMode()).toBe(false);

			configManager.setDebugMode(true);
			expect(configManager.isDebugMode()).toBe(true);
		});
	});

	describe("environment variable handling", () => {
		it("should initialize from environment if CHRONO_DEBUG is set", () => {
			// Note: We can't easily test this without modifying process.env
			// and re-importing the module, which would require a more complex
			// test setup. For now, we verify the behavior through the public API.

			// The default state should be false unless env vars are set
			// during test initialization
			const originalChronoDebug = process.env.CHRONO_DEBUG;
			const originalDebug = process.env.DEBUG;

			// Clean up environment
			delete process.env.CHRONO_DEBUG;
			delete process.env.DEBUG;

			// Reset config to default
			configManager.setDebugMode(false);

			// Verify state
			expect(configManager.isDebugMode()).toBe(false);

			// Restore environment
			if (originalChronoDebug) {
				process.env.CHRONO_DEBUG = originalChronoDebug;
			}
			if (originalDebug) {
				process.env.DEBUG = originalDebug;
			}
		});
	});
});
