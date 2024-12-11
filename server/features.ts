import ConfigManager from "local/server/config.ts";

interface Feature {
	name: string;
	enabled: boolean;
	params: {
		name: string;
		type: "array" | "string" | "boolean" | "number";
		value: any;
		description: string;
		default?: any;
	}[];
	executable: string;
	args: string[];
}

class FeatureManager {
	features: Feature[] = [];
	processes = new Map<string, Deno.ChildProcess>();

	config: ConfigManager;

	constructor() {
		this.config = new ConfigManager();
	}

	async collect() {
		// Reset everything
		this.features = [];

		for (const process of Object.values(this.processes) as Deno.ChildProcess[]) {
			process.kill();
		}

		// Load config
		await this.config.load();

		// Load features
		for await (const entry of Deno.readDir("./features")) {
			const featureName = entry.name;
			let featureConfig;

			// Load config
			try {
				featureConfig = JSON.parse(
					Deno.readTextFileSync("./features/" + featureName + "/feature.json")
				);
			} catch (error) {
				console.log("[features] Error parsing config file for feature", featureName);
				console.log(error);
				continue;
			}

			// Construct feature
			let feature: Feature = {
				name: featureName,
				enabled: this.config.features.checkEnabled(featureName),
				params: [],
				args: [],
				executable: this.config.executables.resolveNickname(featureConfig.executable),
			};

			for (const configParam of featureConfig.config.inline) {
				const localParam = this.config.features.getParam(featureName, configParam.name);

				feature.params.push({
					name: configParam.name,
					type: configParam.type,
					value: localParam ? localParam : configParam.default,
					description: configParam.description,
				});
			}

			this.features.push(feature);
		}

		// Start enabled features
		for (const feature of this.features) {
			this.startFeature(feature);
		}
	}

	startFeature(feature: Feature) {
		if (!feature.enabled) {
			return;
		}

		// Build params
		const params: string[] = [];

		for (const param of feature.params) {
			params.push("--" + param.name);
			if (param.type === "array") {
				params.push(param.value.join(","));
			} else {
				params.push(param.value);
			}
		}

		// Create process
		const command = new Deno.Command(feature.executable, {
			args: [...feature.args, ...params],
			cwd: "./features/" + feature.name,
		});

		const child = command.spawn();
		this.processes.set(feature.name, child);
		console.log("[features] Feature", feature.name, "started");

		// Register callback for output
		child.output().then((output) => {
			if (output.success) {
				console.log("Feature", feature.name, "exited successfully");
			} else {
				console.error("Feature", feature.name, "exited with code", output.code);
			}
		});
	}

	updateFeature(feature: Feature) {
		// If running, kill process
		const process = this.processes.get(feature.name);
		process?.kill("SIGTERM");
		this.processes.delete(feature.name);

		// Store changes to disk
		this.config.features.update(feature);

		// Update in-memory feature list
		const localFeature = this.features[this.features.findIndex((f) => f.name === feature.name)];
		localFeature.enabled = feature.enabled;

		for (const param of feature.params) {
			localFeature.params[localFeature.params.findIndex((f) => f.name === param.name)].value =
				param.value;
		}

		// Restart feature
		this.startFeature(feature);
	}
}

export default new FeatureManager();
