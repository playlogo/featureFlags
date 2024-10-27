import { send, Application, Router } from "https://deno.land/x/oak@v12.4.0/mod.ts";

import { LOCAL_CONFIG } from "./config.ts";

// Logic
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
	executable: string[];
}

let features: Feature[] = [];
const processes = new Map<string, Deno.Process>();

async function loadFeatures() {
	const tmp = [];

	// Load params
	let localConfig = LOCAL_CONFIG.load();

	// Load features
	for await (const entry of Deno.readDir("./features")) {
		const name = entry.name;
		let config;

		// Load config
		try {
			config = JSON.parse(Deno.readTextFileSync("./features/" + name + "/feature.json"));
		} catch (error) {
			console.log("Error parsing config for feature", name);
			console.log(error);
			continue;
		}

		// Construct feature
		let feature: Feature = {
			name: name,
			enabled: localConfig[name] ? localConfig[name].enabled : false,
			params: [],
			executable: config.executable,
		};

		for (const configParam of config.config.inline) {
			const localParam = localConfig[name] ? localConfig[name].params[configParam.name] : undefined;

			feature.params.push({
				name: configParam.name,
				type: configParam.type,
				value: localParam ? localParam : configParam.default,
				description: configParam.description,
			});
		}

		tmp.push(feature);
	}

	// Start enabled features
	for (const feature of tmp) {
		startFeature(feature);
	}

	features = tmp;
}

function startFeature(feature: Feature) {
	if (!feature.enabled) {
		return;
	}

	let args = feature.executable;

	for (const param of feature.params) {
		args.push("--" + param.name);
		if (param.type === "array") {
			args.push(param.value.join(","));
		} else {
			args.push(param.value);
		}
	}

	const process = Deno.run({
		cmd: args,
		cwd: "./features/" + feature.name,
	});

	processes.set(feature.name, process);

	console.log("Feature", feature.name, "started");

	process.status().then((status) => {
		if (status.success) {
			console.log("Feature", feature.name, "exited successfully");
		} else {
			console.error("Feature", feature.name, "exited with code", status.code);
		}
	});
}

function updateFeature(feature: Feature) {
	// Kill process
	const process = processes.get(feature.name);
	process?.kill("SIGTERM");
	process?.close();
	processes.delete(feature.name);

	// Store to disk
	const localConfig = LOCAL_CONFIG.load();
	localConfig[feature.name] = {
		enabled: feature.enabled,
		params: {},
	};

	const localFeature = features[features.findIndex((f) => f.name === feature.name)];

	for (const param of feature.params) {
		localConfig[feature.name].params[param.name] = param.value;
		localFeature.params[localFeature.params.findIndex((f) => f.name === param.name)].value = param.value;
	}

	localFeature.enabled = feature.enabled;

	// Save params to disk
	LOCAL_CONFIG.save(localConfig);

	// Restart feature
	startFeature(feature);
}

try {
	await loadFeatures();
} catch (error) {
	console.error("Error loading features", error);
	Deno.exit(1);
}

// API
const app = new Application();
const router = new Router();

app.use(async (ctx, next) => {
	try {
		await send(ctx, ctx.request.url.pathname, {
			root: "server/static",
			index: "index.html",
		});
	} catch (_) {
		await next();
	}
});

router.get("/features", (ctx) => {
	ctx.response.body = features;
});

router.post("/features", async (ctx) => {
	// Get body
	const body = ctx.request.body();
	const data = await body.value;

	await updateFeature(data);

	ctx.response.body = { success: true };
});

app.use(router.allowedMethods());
app.use(router.routes());

app.addEventListener("listen", ({ hostname, port, secure }) => {
	console.log(`Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`);
});

app.listen({ port: 80 });
