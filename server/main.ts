import { api } from "local/server/api.ts";
import featureManager from "local/server/features.ts";

console.log("[main] Collecting Features...");
await featureManager.collect();

console.log("[main] Starting api...");
await api.start();
