import { Client } from "https://deno.land/x/mqtt@0.1.2/deno/mod.ts"; // Deno (ESM)
import { parse } from "https://deno.land/std@0.224.0/flags/mod.ts"; // Deno (ESM)

// Parse args
const args = parse(Deno.args);
let allowedClients: string[] = args["allowedDevices"] ? args["allowedDevices"].split(",") : [];
console.log("Initial allowed clients:", allowedClients);

// Websocket connection
const websocketURI = args["websocket"];
const webSocket = new WebSocket(websocketURI);

webSocket.addEventListener("open", (event) => {
	console.log("[websocket] Successfully connected to server");
});

webSocket.addEventListener("error", (event) => {
	console.error("[websocket] Error connecting to server: ", event);
});

webSocket.addEventListener("message", (event) => {
	allowedClients = (event.data as string).split(",");
	console.log("[websocket] Received new allowed clients: " + allowedClients);
});

// Start mqtt subscriber
const client = new Client({ url: "mqtt://192.168.178.29:1883", username: "", password: "" }); // Deno and Node.js

await client.connect();

console.log("Connected to mqtt");

await client.subscribe("aetherShairport/client_device_id");

const decoder = new TextDecoder();

client.on("message", async (topic: string, payload: Uint8Array) => {
	console.log("New client connection: " + decoder.decode(payload));

	// Check if device is allowed to connect
	if (allowedClients.includes(decoder.decode(payload))) {
		return;
	}

	console.log("Client not allowed to connect: " + decoder.decode(payload));

	webSocket.send(
		JSON.stringify({ type: "report", field: "forbiddenConnection", value: decoder.decode(payload) })
	);

	// Else restart Shairport-sync
	const command = new Deno.Command("sudo", {
		args: ["/bin/systemctl", "restart", "shairport-sync"],
	});
	const child = command.spawn();
	await child.output();
});
