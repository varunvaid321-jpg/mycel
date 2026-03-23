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

// Bind port FIRST so Render detects it immediately.
// Return 503 until Next.js is ready.
let ready = false;

const server = createServer((req, res) => {
  if (!ready) {
    res.writeHead(503, { "Retry-After": "5" });
    res.end("Starting up...");
    return;
  }
  const parsedUrl = parse(req.url, true);
  handle(req, res, parsedUrl);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Port ${PORT} bound — preparing Next.js...`);
});

app.prepare().then(() => {
  ready = true;
  console.log(`Mycel ready on port ${PORT}`);
});
