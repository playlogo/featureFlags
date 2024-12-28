// Parse args
import { parseArgs } from "jsr:@std/cli/parse-args";

const args = parseArgs(Deno.args, {
	string: ["volume"],
});

const initialVolume: number = args.volume ? parseInt(args.volume) : 50;

console.log("Initial volume:", initialVolume);

// Websocket connection
import { buildWebSocket } from "local/features/utils/websocket.ts";
const websocket = buildWebSocket("volume");

websocket.addEventListener("message", async (event) => {
	// Set new volume
	const data = JSON.parse(event.data as string);

	console.log("[volume] [websocket] Received new volume: " + data.volume);
	await setVolume(parseInt(data.volume));
});

// Utils
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
