import { send, Application, Router, Status } from "https://deno.land/x/oak@v17.1.3/mod.ts";
import { listFeatures, updateFeature } from "local/server/features.ts";

class API {
	app: Application;
	port: number;

	constructor(port = 80) {
		this.app = new Application();
		this.port = port;
	}

	async buildRouter() {
		const router = new Router();

		router.get("/features", async (ctx) => {
			ctx.response.body = await listFeatures();
		});

		router.post("/features", async (ctx) => {
			// Get body
			const body = await ctx.request.body.json();

			try {
				await updateFeature(body);
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

		await this.app.listen({ port: this.port });
	}
}

export const api = new API();
