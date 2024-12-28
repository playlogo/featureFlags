import { configManager } from "./config.ts";

class WebSocketManger {
	server: Deno.HttpServer | undefined;
	sockets: { [key: string]: WebSocket } = {};

	async start() {
		await new Promise<void>((resolve, reject) => {
			this.server = Deno.serve(
				{
					port: configManager.port + 1,
					onListen(addr) {
						console.log(`[websocket] Listening on http://${addr.hostname}:${addr.port}`);
						resolve();
					},
					onError(err) {
						console.error(`[websocket] Error`);
						console.error(err);

						return new Response(null, { status: 501 });
					},
				},
				(req) => {
					if (req.headers.get("upgrade") != "websocket") {
						return new Response(null, { status: 501 });
					}

					const { socket, response } = Deno.upgradeWebSocket(req);

					socket.addEventListener("open", () => {
						const feature = req.url.split("/").slice(-1)[0];
						this.sockets[feature] = socket;

						console.log(`[websocket] Feature ${feature} connected`);
					});

					socket.addEventListener("message", (event) => {
						if (event.data === "ping") {
							socket.send("pong");
						}
					});

					socket.addEventListener("close", () => {
						const feature = req.url.split("/").slice(-1)[0];
						delete this.sockets[feature];
					});

					return response;
				}
			);
		});
	}
}

export const websocketManager = new WebSocketManger();
