import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const env = { ...process.env, NODE_ENV: "test", PORT: "3433", CHARGEGRID_DATABASE_PATH: resolve(root, ".tmp/sprint4-e2e-db") };
delete env.CHARGEGRID_DATABASE_URL;
delete env.STRIPE_SECRET_KEY;
delete env.STRIPE_WEBHOOK_SECRET;

const child = spawn(process.execPath, ["--import", "tsx", "apps/api/src/server.ts"], { cwd: root, env, stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.once("exit", (code) => process.exit(code ?? 1));
