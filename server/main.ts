import { api } from "local/server/api.ts";
import { featureManager } from "local/server/features.ts";
import { websocketManager } from "local/server/websocket.ts";
import { configManager } from "local/server/config.ts";

console.log("[main] Loading config...");
await configManager.load();

console.log("[main] Starting websocket server...");
await websocketManager.start();

console.log("[main] Collecting Features...");
await featureManager.collect();

console.log("[main] Starting api...");
await api.start();
