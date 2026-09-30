import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const env = { ...process.env, NODE_ENV: "test", PORT: "3433", CHARGEGRID_DATABASE_PATH: resolve(root, ".tmp/sprint4-e2e-db"), CHARGEGRID_ALLOWED_ORIGINS: "http://127.0.0.1:5273,http://127.0.0.1:5274" };
delete env.CHARGEGRID_DATABASE_URL;
delete env.STRIPE_SECRET_KEY;
delete env.STRIPE_WEBHOOK_SECRET;

let child;
let stopping = false;
let restarting = false;

function waitForHealth(timeoutMs = 60_000) {
  const startedAt = Date.now();
  return new Promise((resolveHealth, rejectHealth) => {
    const poll = async () => {
      if (stopping) return rejectHealth(new Error("Test API is stopping."));
      try {
        const response = await fetch("http://127.0.0.1:3433/test-harness");
        if (response.ok && (await response.json()).isolated === true) return resolveHealth();
      } catch { /* API is still booting. */ }
      if (Date.now() - startedAt > timeoutMs) return rejectHealth(new Error("Timed out waiting for the isolated test API."));
      setTimeout(poll, 250);
    };
    void poll();
  });
}

function startApi() {
  child = spawn(process.execPath, ["--import", "tsx", "tests/integration/sprint4-test-server.ts"], { cwd: root, env, stdio: "inherit" });
  child.once("exit", (code) => {
    if (!stopping && !restarting) {
      console.error(`Isolated test API exited with code ${code ?? 1}.`);
      process.exitCode = code ?? 1;
    }
  });
  return waitForHealth();
}

async function stopApi() {
  const activeChild = child;
  if (!activeChild || activeChild.exitCode !== null) return;
  await new Promise((resolveExit) => {
    activeChild.once("exit", resolveExit);
    activeChild.kill("SIGTERM");
  });
}

const control = createServer((request, response) => {
  if (request.method !== "POST" || request.url !== "/restart") {
    response.writeHead(404).end();
    return;
  }
  if (restarting || stopping) {
    response.writeHead(409).end("API transition already in progress");
    return;
  }
  restarting = true;
  void (async () => {
    try {
      await stopApi();
      await startApi();
      response.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify({ status: "restarted" }));
    } catch (error) {
      response.writeHead(500).end(error instanceof Error ? error.message : "API restart failed");
    } finally {
      restarting = false;
    }
  })();
});

control.listen(3434, "127.0.0.1");
await startApi();

for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  stopping = true;
  control.close();
  void stopApi();
});
