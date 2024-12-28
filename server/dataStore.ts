import { DataStoreData } from "local/types/configs.d.ts";
import { Feature } from "local/types/feature.d.ts";

class DataStoreManager {
	version = 2;

	features: DataStoreData = {
		version: this.version,
		features: {},
	};

	constructor() {
		return new Proxy(this, this);
	}

	[prop: string]: any | DataStoreData["features"][string];

	get(_target: any, prop: string) {
		if (this[prop] !== undefined) {
			return this[prop];
		}

		// Check if feature is known
		if (this.features.features[prop] === undefined) {
			// Unknown
			return {
				enabled: false,
				params: {},
			};
		}

		return {
			enabled: this.features.features[prop].enabled,
			params: this.features.features[prop].params,
		};
	}

	async load() {
		// Try to load older save
		try {
			await Deno.stat("configs/dataStore.json");
			const store = JSON.parse(await Deno.readTextFile("configs/dataStore.json"));

			// If version miss match, backup old config and start with empty config
			if (store.version !== this.version) {
				console.warn("[dataStore] Version mismatch, creating new data store");
				console.warn(JSON.stringify(store));

				await Deno.writeTextFile(
					`configs/dataStore.legacy.${store.version}.json`,
					JSON.stringify(store)
				);
				await Deno.remove("configs/dataStore.json");
			} else {
				// Use config
				console.log("[dataStore] Loaded config");
				this.features.features = store.features;
			}
		} catch (err) {
			console.error("[dataStore] Error loading dataStore file");
			console.error("[dataStore] Falling back to empty file");

			if (!(err instanceof Deno.errors.NotFound)) {
				console.error(err);
			}
		}
	}

	async updateFeature(feature: Feature) {
		// Update in-memory
		this.features.features[feature.name] = {
			enabled: feature.enabled,
			params: {},
		};

		for (const param of feature.params) {
			this.features.features[feature.name].params[param.name] = param.value;
		}

		// Save to file
		await Deno.writeTextFile("configs/dataStore.json", JSON.stringify(this.features, null, 4), {
			append: false,
			create: true,
		});
	}
}

export const dataStore = new DataStoreManager();
