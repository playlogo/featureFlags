export function buildWebSocket(prefix: string) {
	// Get Server address
	if (!Deno.env.has("FEATURE_SERVER_WEBSOCKET_URI")) {
		throw new Error(
			"FEATURE_SERVER_WEBSOCKET_URI is not defined in .env. Make sure this process is started by the featureFlag server"
		);
	}

	// Websocket connection
	const websocketURI = Deno.env.get("FEATURE_SERVER_WEBSOCKET_URI")!;
	const webSocket = new WebSocket(websocketURI);

	webSocket.addEventListener("open", (event) => {
		console.log(`[${prefix}] [websocket] Successfully connected to server`);
	});

	webSocket.addEventListener("error", (event) => {
		console.error(`[${prefix}] [websocket] Error connecting to server: ${event}`);
	});

	return webSocket;
}
