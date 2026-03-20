const { execSync } = require("child_process");
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const PORT = parseInt(process.env.PORT || "10000", 10);
const app = next({ dev: false });
const handle = app.getRequestHandler();

// Ensure DB schema exists
try {
  console.log("Running prisma db push...");
  execSync("npx prisma db push --accept-data-loss --skip-generate", {
    stdio: "inherit",
    cwd: __dirname,
  });
  console.log("DB ready");
} catch (e) {
  console.error("prisma db push warning:", e.message);
}

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, "0.0.0.0", () => {
    console.log(`Mycel running on port ${PORT}`);
  });
});
