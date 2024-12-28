import { send, Application, Router, Status } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { featureManager } from "local/server/features.ts";
import { configManager } from "local/server/config.ts";

class API {
	app: Application;

	constructor() {
		this.app = new Application();
	}

	async buildRouter() {
		const router = new Router();

		router.get("/features", async (ctx) => {
			ctx.response.body = featureManager.features;
		});

		router.post("/features", async (ctx) => {
			// Get body
			const body = await ctx.request.body.json();

			try {
				await featureManager.updateFeature(body);
				ctx.response.body = { success: true };
			} catch (err) {
				ctx.response.status = Status.ExpectationFailed;
			}
		});

		return router;
	}

	async start() {
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
			console.log(`Listening on: ${secure ? "https://" : "http://"}${hostname ?? "localhost"}:${port}`);
		});

		await this.app.listen({ port: configManager.port });
	}
}

export const api = new API();
