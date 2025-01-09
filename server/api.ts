import * as ImageScript from "https://deno.land/x/imagescript@1.3.0/mod.ts";

import { send, Application, Router, Status } from "https://deno.land/x/oak@v17.1.3/mod.ts";

import { featureManager } from "local/server/features.ts";
import { configManager } from "local/server/config.ts";

import { exists, randomHSLColor, hslToHex } from "./utils.ts";

class API {
	app: Application;

	constructor() {
		this.app = new Application();
	}

	buildRouter() {
		const router = new Router();

		router.get("/features", (ctx) => {
			ctx.response.body = featureManager.features;
		});

		router.post("/features", async (ctx) => {
			// Get body
			const body = await ctx.request.body.json();

			try {
				await featureManager.updateFeature(body);
				ctx.response.body = { success: true };
			} catch (err) {
				console.error(err);
				console.error(body);
				ctx.response.status = Status.ExpectationFailed;
			}
		});

		// Hostname api
		router.get("/hostname", (ctx) => {
			ctx.response.body = Deno.hostname();
			ctx.response.status = Status.OK;
		});

		return router;
	}

	async start() {
		// Create colored icon if not already exits
		if (!(await exists("server/static/icon.png"))) {
			console.log("[api] Creating colored icon");

			const color = hslToHex(randomHSLColor());
			const svg = (await Deno.readTextFile("server/static/icon.svg")).replaceAll("#0fff2b", color);

			const image = await ImageScript.Image.renderSVG(svg, 200).encode();
			await Deno.writeFile("server/static/icon.png", image);
			console.log(`[api] Created icon with color: ${color}`);
		}

		// Static serving
		this.app.use(async (ctx, next) => {
			try {
				await send(ctx, ctx.request.url.pathname, {
					root: "server/static",
					index: "index.html",
				});
			} catch (_) {
				await next();
			}
		});

		// Add router
		const router = await this.buildRouter();

		this.app.use(router.allowedMethods());
		this.app.use(router.routes());

		// Start server
		this.app.addEventListener("listen", ({ hostname, port, secure }) => {
			console.log(
				`[api] Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`
			);
		});

		await this.app.listen({ port: configManager.port });
	}
}

export const api = new API();
