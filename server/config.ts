import Ajv from "https://esm.sh/ajv@8.17.1";

import { ServerConfig } from "local/types/configs.d.ts";

class ConfigManager {
	executables: ServerConfig["executables"] = {};

	async load() {
		let config: ServerConfig;

		// Config validation
		const ajv = new Ajv({ allErrors: true });
		const configSchema = JSON.parse(await Deno.readTextFile("configs/server.schema.json"));
		const validate = await ajv.compileAsync(configSchema);

		// Try to load custom server config
		try {
			// Check if custom config exists
			await Deno.stat("configs/server.json");
			config = JSON.parse(await Deno.readTextFile("configs/server.json"));

			// Validate config
			if (!validate(config)) {
				throw new Error(ajv.errorsText(validate.errors));
			}
		} catch (err) {
			console.error("[config] Error loading custom config file");
			console.error("[config] Falling back to default");
			console.error(err);

			// Load default config file
			config = JSON.parse(await Deno.readTextFile("configs/server.default.json"));
		}

		// Store
		this.executables = config.executables;
	}
}

export const configManager = new ConfigManager();
