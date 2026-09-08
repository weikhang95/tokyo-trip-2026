#!/usr/bin/env node
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// 1. Get API Key
let apiKey = process.env.GOOGLE_MAPS_API_KEY;
if (!apiKey) {
  const settingsPath = path.join(os.homedir(), ".gemini", "settings.json");
  if (fs.existsSync(settingsPath)) {
    try {
      const json = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
      const key = json?.mcpServers?.["google-maps"]?.env?.GOOGLE_MAPS_API_KEY;
      if (key && key !== "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
        apiKey = key;
      }
    } catch {}
  }
}

if (!apiKey || apiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
  console.log("\x1b[33m[!] Google Maps API Key not detected.\x1b[0m");
  console.log("Please set the key in: " + path.join(os.homedir(), ".gemini", "settings.json"));
  console.log("Or in your terminal: $env:GOOGLE_MAPS_API_KEY = \"AIzaSy...\"");
  process.exit(1);
}

const [,, action, arg1, arg2] = process.argv;

if (!action) {
  console.log("\x1b[36mGoogle Maps CLI Runner (cablate/mcp-google-map)\x1b[0m");
  console.log("Usage:");
  console.log("  node scripts/gmaps.mjs search <query>             # Text search");
  console.log("  node scripts/gmaps.mjs nearby <lat,lng> <keyword> # Nearby search");
  console.log("  node scripts/gmaps.mjs details <place_id>         # Place details");
  console.log("  node scripts/gmaps.mjs route <origin> <dest>      # Directions");
  console.log("  node scripts/gmaps.mjs elevation <lat,lng>        # Elevation");
  console.log("  node scripts/gmaps.mjs raw <tool> <jsonParams>    # Any raw tool");
  process.exit(0);
}

let tool = "";
let params = {};

switch (action.toLowerCase()) {
  case "search":
    tool = "search-places";
    params = { query: arg1 };
    break;
  case "nearby":
    tool = "search-nearby";
    params = { center: { value: arg1, isCoordinates: true }, keyword: arg2 || "restaurant" };
    break;
  case "details":
    tool = "place-details";
    params = { place_id: arg1 };
    break;
  case "route":
    tool = "directions";
    params = { origin: arg1, destination: arg2, mode: "walking" };
    break;
  case "elevation":
    tool = "elevation";
    params = { locations: [arg1] };
    break;
  case "raw":
    tool = arg1;
    params = JSON.parse(arg2 || "{}");
    break;
  default:
    console.log("Unknown action: " + action);
    process.exit(1);
}

const isWindows = process.platform === "win32";
const npxCmd = isWindows ? "npx.cmd" : "npx";

const res = spawnSync(npxCmd, ["-y", "@cablate/mcp-google-map", "exec", tool, JSON.stringify(params), "-k", apiKey], {
  stdio: "inherit",
  shell: true
});

process.exit(res.status || 0);
