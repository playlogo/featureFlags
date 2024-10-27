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
