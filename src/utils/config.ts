/**
 * Configuration management for the chrono-mcp server.
 *
 * This module provides a singleton configuration manager that handles
 * server-wide settings such as debug mode. Configuration can be set
 * via environment variables or programmatically.
 *
 * @module config
 *
 * @example
 * ```typescript
 * import { configManager } from './config.js';
 *
 * // Check if debug mode is enabled
 * if (configManager.isDebugMode()) {
 *   console.log('Debug mode is active');
 * }
 *
 * // Enable debug mode programmatically
 * configManager.setDebugMode(true);
 * ```
 */

/**
 * Server configuration interface.
 * Defines the structure of the server configuration object.
 */
interface ServerConfig {
	/** Whether debug mode is enabled for detailed output */
	debugMode: boolean;
}

/**
 * Singleton configuration manager for the chrono-mcp server.
 *
 * This class manages server-wide configuration settings and ensures
 * that only one configuration instance exists throughout the application.
 * It reads initial values from environment variables and allows
 * programmatic updates.
 *
 * Environment variables:
 * - `CHRONO_DEBUG`: Set to "true" to enable debug mode
 * - `DEBUG`: Alternative environment variable for debug mode (fallback)
 */
class ConfigManager {
	/** Singleton instance */
	private static instance: ConfigManager;

	/** Internal configuration state */
	private config: ServerConfig;

	/**
	 * Private constructor to enforce singleton pattern.
	 * Initializes configuration from environment variables.
	 *
	 * @private
	 */
	private constructor() {
		this.config = {
			debugMode:
				process.env.CHRONO_DEBUG === "true" || process.env.DEBUG === "true",
		};
	}

	/**
	 * Gets the singleton instance of the ConfigManager.
	 * Creates the instance on first call.
	 *
	 * @returns The ConfigManager singleton instance
	 *
	 * @example
	 * ```typescript
	 * const config = ConfigManager.getInstance();
	 * console.log(config.isDebugMode());
	 * ```
	 */
	public static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	/**
	 * Gets a copy of the current configuration.
	 *
	 * @returns A shallow copy of the current ServerConfig object
	 *
	 * @example
	 * ```typescript
	 * const currentConfig = configManager.getConfig();
	 * console.log(currentConfig.debugMode);
	 * ```
	 */
	public getConfig(): ServerConfig {
		return { ...this.config };
	}

	/**
	 * Sets the debug mode state.
	 *
	 * When debug mode is enabled, tool responses include additional metadata
	 * such as calculation timestamps and timezone information.
	 *
	 * @param enabled - Whether to enable debug mode
	 *
	 * @example
	 * ```typescript
	 * // Enable debug mode for detailed responses
	 * configManager.setDebugMode(true);
	 *
	 * // Disable debug mode for production
	 * configManager.setDebugMode(false);
	 * ```
	 */
	public setDebugMode(enabled: boolean): void {
		this.config.debugMode = enabled;
	}

	/**
	 * Checks whether debug mode is currently enabled.
	 *
	 * @returns True if debug mode is enabled, false otherwise
	 *
	 * @example
	 * ```typescript
	 * if (configManager.isDebugMode()) {
	 *   response.metadata = {
	 *     calculation_time: DateTime.now().toISO()
	 *   };
	 * }
	 * ```
	 */
	public isDebugMode(): boolean {
		return this.config.debugMode;
	}
}

/**
 * Singleton instance of the ConfigManager.
 *
 * Use this exported instance to access configuration throughout the application.
 *
 * @example
 * ```typescript
 * import { configManager } from './utils/config.js';
 *
 * // In a tool handler
 * if (configManager.isDebugMode()) {
 *   result.metadata = { calculation_time: DateTime.now().toISO() };
 * }
 * ```
 */
export const configManager = ConfigManager.getInstance();

/**
 * Type export for ServerConfig interface.
 * Useful when typing functions that accept or return configuration objects.
 */
export type { ServerConfig };
