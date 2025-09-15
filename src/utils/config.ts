interface ServerConfig {
	debugMode: boolean;
}

class ConfigManager {
	private static instance: ConfigManager;
	private config: ServerConfig;

	private constructor() {
		this.config = {
			debugMode:
				process.env.CHRONO_DEBUG === "true" || process.env.DEBUG === "true",
		};
	}

	public static getInstance(): ConfigManager {
		if (!ConfigManager.instance) {
			ConfigManager.instance = new ConfigManager();
		}
		return ConfigManager.instance;
	}

	public getConfig(): ServerConfig {
		return { ...this.config };
	}

	public setDebugMode(enabled: boolean): void {
		this.config.debugMode = enabled;
	}

	public isDebugMode(): boolean {
		return this.config.debugMode;
	}
}

export const configManager = ConfigManager.getInstance();
export type { ServerConfig };
