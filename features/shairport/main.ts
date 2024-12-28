import { Client } from "https://deno.land/x/mqtt@0.1.2/deno/mod.ts"; // Deno (ESM)

// Parse args
import { parseArgs } from "jsr:@std/cli/parse-args";

const args = parseArgs(Deno.args, {
	string: ["allowedDevices"],
});

let allowedDevices: string[] = args.allowedDevices ? args.allowedDevices.split(",") : [];

console.log("Initial allowed clients:", allowedDevices);

// Create websocket
import { buildWebSocket } from "local/features/utils/websocket.ts";

const websocket = buildWebSocket("shairport");

websocket.addEventListener("message", (event) => {
	const data = JSON.parse(event.data as string);
	allowedDevices = data.allowedDevices;
	console.log("[shairport] [websocket] Received new allowed clients: " + allowedDevices);
});

// Start mqtt subscriber
const client = new Client({ url: "mqtt://192.168.178.29:1883", username: "", password: "" }); // Deno and Node.js

await client.connect();

console.log("Connected to mqtt");

await client.subscribe("aetherShairport/client_device_id");

const decoder = new TextDecoder();

client.on("message", async (_topic: string, payload: Uint8Array) => {
	console.log("New client connection: " + decoder.decode(payload));

	// Check if device is allowed to connect
	if (allowedDevices.includes(decoder.decode(payload))) {
		return;
	}

	// Else restart shairport-sync service
	console.log("Client not allowed to connect: " + decoder.decode(payload));

	websocket.send(
		JSON.stringify({ type: "report", field: "forbiddenConnection", value: decoder.decode(payload) })
	);

	const command = new Deno.Command("sudo", {
		args: ["/bin/systemctl", "restart", "shairport-sync"],
	});
	const child = command.spawn();
	await child.output();
});
