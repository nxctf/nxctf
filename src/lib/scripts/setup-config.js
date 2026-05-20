// Optional helper for bootstrapping .env.local.
// The config editor now lives at /config during development.
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "../../..");
const envExamplePath = path.join(rootDir, "env.example");
const envLocalPath = path.join(rootDir, ".env.local");
const configPath = path.join(rootDir, "src/config.ts");

if (!fs.existsSync(envExamplePath)) {
  console.error("env.example not found.");
  process.exit(1);
}

if (!fs.existsSync(configPath)) {
  console.error("src/config.ts not found.");
  process.exit(1);
}

if (!fs.existsSync(envLocalPath)) {
  fs.copyFileSync(envExamplePath, envLocalPath);
  console.log(".env.local created from env.example.");
} else {
  console.log(".env.local already exists. Nothing to do.");
}

console.log("Main app config stays in src/config.ts.");
console.log("Edit src/config.ts for app settings and .env.local for secrets.");
