const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const vibrissaRoot = path.join("node_modules", "vibrissa");
const cli = path.join(vibrissaRoot, "dist", "cli.js");
if (fs.existsSync(cli) || !fs.existsSync(path.join(vibrissaRoot, "package.json"))) {
  process.exit(0);
}

const srcEntry = path.join(vibrissaRoot, "src", "cli.ts");
if (!fs.existsSync(srcEntry)) {
  console.warn(
    "vibrissa is installed without dist/ or src/; run vib from a built checkout (file:../vibrissa).",
  );
  process.exit(0);
}

execSync("npm install", { cwd: vibrissaRoot, stdio: "inherit" });
execSync("npm run build", { cwd: vibrissaRoot, stdio: "inherit" });
