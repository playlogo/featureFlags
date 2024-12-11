interface LocalConfigFeature {
	enabled: boolean;
	params: {
		[key: string]: any;
	};
}

class LocalConfig {
	load() {
		let localConfig: { [key: string]: LocalConfigFeature } = {};

		try {
			localConfig = JSON.parse(Deno.readTextFileSync("./config.json"));
		} catch (error) {
			console.log("Error parsing params");

			this.save(localConfig);

			console.log("Created new config file");
		}

		return localConfig;
	}

	save(config: { [key: string]: LocalConfigFeature }) {
		Deno.writeTextFileSync("./config.json", JSON.stringify(config));
	}
}

export const LOCAL_CONFIG = new LocalConfig();

class ConfigManager {
	featuresConfig: { [key: string]: LocalConfigFeature } = {};
	generalConfig: { [key: string]: LocalConfigFeature } = {};

	async load() {
		try {
			this.featuresConfig = JSON.parse(await Deno.readTextFile("configs/features.json"));
		} catch (error) {
			console.error("[featuresConfig] Error parsing params");

			await this.save();

			console.log("Created new config file");
		}
	}

	async save(config: typeof this.featuresConfig) {
		await Deno.writeTextFile("configs/config.json", JSON.stringify(config));
	}
}

export default ConfigManager;
