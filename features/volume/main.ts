import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts"; // Deno (ESM)

// Parse args
const args = parse(Deno.args);
const initialVolume: number = args["volume"] ? parseInt(args["volume"]) : 50;
console.log("Initial volume:", initialVolume);

// Websocket connection
const websocketURI = args["websocket"];
const webSocket = new WebSocket(websocketURI);

webSocket.addEventListener("open", (event) => {
	console.log("[websocket] Successfully connected to server");
});

webSocket.addEventListener("error", (event) => {
	console.error("[websocket] Error connecting to server: ", event);
});

webSocket.addEventListener("message", async (event) => {
	// Set new volume
	await setVolume(parseInt(event.data));
});

async function setVolume(newVolume: number) {
	try {
		const command = new Deno.Command("amixer", {
			args: ["-c", "2", "set", "'Headphone'", "" + newVolume],
		});
		const child = command.spawn();
		await child.output();
	} catch (_err) {}

	try {
		const command = new Deno.Command("amixer", {
			args: ["-c", "1", "set", "'Headphone'", "" + newVolume],
		});
		const child = command.spawn();
		await child.output();
	} catch (_err) {}
}
