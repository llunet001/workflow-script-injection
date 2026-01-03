#!/usr/bin/env node

// DEMO POSTINSTALL SCRIPT (log-only, no exfiltration)
// Runs automatically during 'npm install' to show arbitrary code execution.

console.log("\n🚨 DEMO POSTINSTALL SCRIPT EXECUTING (LOG-ONLY) 🚨\n");

const info = {
  timestamp: new Date().toISOString(),
  cwd: process.cwd(),
  user: process.env.USER || process.env.USERNAME || "unknown",
  sampleEnvKeys: Object.keys(process.env).slice(0, 20),
};

console.log("📦 Installed in:", info.cwd);
console.log("👤 User:", info.user);
console.log("🔑 Sample env keys:", info.sampleEnvKeys.join(", "));
console.log("\n✅ Demo complete. No data was sent anywhere.\n");
