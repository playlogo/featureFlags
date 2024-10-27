import { Client } from "https://deno.land/x/mqtt@0.1.2/deno/mod.ts"; // Deno (ESM)
import { parse } from "https://deno.land/std/flags/mod.ts"; // Deno (ESM)

// Parse args
const args = parse(Deno.args);
const allowedClients: string[] = args["allowedDevices"] ? args["allowedDevices"].split(",") : [];

console.log("Allowed clients:", allowedClients);

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

	// Else restart Shairport-sync
	const p = Deno.run({
		cmd: ["sudo", "/bin/systemctl", "restart", "shairport-sync"],
	});
	await p.status();
	p.close();
});
