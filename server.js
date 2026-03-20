const { execSync } = require("child_process");
const path = require("path");

const PORT = process.env.PORT || 10000;

// Ensure DB exists
console.log("DATABASE_URL:", process.env.DATABASE_URL);
try {
  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    stdio: "inherit",
    env: process.env,
  });
  console.log("DB ready");
} catch (e) {
  console.error("prisma db push failed:", e.message);
  // Continue anyway — DB might already exist
}

// Start Next.js
const cli = require("next/dist/cli/next-start");
process.argv = ["node", "next", "-p", String(PORT)];
cli.nextStart();
