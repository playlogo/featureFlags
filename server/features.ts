import Ajv from "https://esm.sh/ajv@8.17.1";

import { configManager } from "./config.ts";
import { dataStore } from "./dataStore.ts";

import { FeatureConfig, Feature } from "local/types/feature.d.ts";

class FeatureManager {
	features: Feature[] = [];
	processes = new Map<string, Deno.ChildProcess>();

	async collect() {
		// Reset everything
		this.features = [];

		for (const process of Object.values(this.processes) as Deno.ChildProcess[]) {
			process.kill();
		}

		// Load config
		await configManager.load();

		// Load data store
		await dataStore.load();

		// Build feature config validator
		const ajv = new Ajv({ allErrors: true });
		const featureSchema = JSON.parse(await Deno.readTextFile("features/utils/feature.schema.json"));
		const validate = await ajv.compile(featureSchema);

		// Load features
		for await (const entry of Deno.readDir("./features")) {
			// Check if valid feature
			if (!entry.isDirectory) {
				continue;
			}

			if (entry.name === "utils") {
				continue;
			}

			// Load feature
			const featureName = entry.name;

			let featureConfig: FeatureConfig;

			// Verify and parse config
			try {
				featureConfig = JSON.parse(
					Deno.readTextFileSync("./features/" + featureName + "/feature.json")
				);

				if (!validate(featureConfig)) {
					throw new Error(ajv.errorsText(validate.errors));
				}
			} catch (error) {
				console.log("[features] Error parsing config file for feature", featureName);
				console.log(error);
				continue;
			}

			// Create feature
			let feature: Feature = {
				name: featureName,
				enabled: dataStore[featureName].enabled,
				params: [],
				args: featureConfig.args,
				websocket: featureConfig.websocket,
				executable: configManager.executables[featureConfig.executable] ?? featureConfig.executable,
			};

			// Add env permission for deno if needed
			if (featureConfig.executable !== "deno") {
				console.warn("[features] Advanced features only supported for deno features");
			}

			if (
				featureConfig.websocket &&
				featureConfig.executable === "deno" &&
				!featureConfig.args.includes("--allow-env")
			) {
				feature.args = [feature.args[0], "--allow-env", ...feature.args.slice(1)];
			}

			for (const configParam of featureConfig.expose.inline) {
				const storedValue = dataStore[featureName].params[configParam.name];

				feature.params.push({
					name: configParam.name,
					type: configParam.type,
					value: storedValue ? storedValue : configParam.default,
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

		// Build env
		const env: any = {};

		if (feature.websocket) {
			env["FEATURE_SERVER_WEBSOCKET_URI"] = "";
		}

		// Create process
		const command = new Deno.Command(feature.executable, {
			args: [...feature.args, ...params],
			cwd: "./features/" + feature.name,
			env: env,
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

	async updateFeature(feature: Feature) {
		// If running, kill process
		const process = this.processes.get(feature.name);
		process?.kill("SIGTERM");
		this.processes.delete(feature.name);

		// Store changes to disk
		await dataStore.updateFeature(feature);

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

export const featureManager = new FeatureManager();
