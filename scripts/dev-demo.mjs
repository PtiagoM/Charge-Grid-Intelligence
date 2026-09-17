import { spawn } from "node:child_process";
import { resolve } from "node:path";

// Fixed commands through the npm CLI avoid shell quoting and work on Windows/Linux.
if (process.env.NODE_ENV === "production") {
  throw new Error("A demonstração local não pode ser iniciada em NODE_ENV=production.");
}

const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Inicie com npm run dev:demo.");

const env = {
  ...process.env,
  NODE_ENV: "development",
  CHARGEGRID_DEMO_ENABLED: "true",
  VITE_CHARGEGRID_DEMO_ENABLED: "true",
  CHARGEGRID_DEMO_STATE_PATH: process.env.CHARGEGRID_DEMO_STATE_PATH || resolve(".local/demo/state.json"),
  VITE_CHARGEGRID_API_URL: "http://127.0.0.1:3333",
  PORT: "3333",
  CHARGEGRID_ALLOWED_ORIGINS: "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174",
  VITE_GOOGLE_MAPS_API_KEY: "",
  VITE_SUPABASE_URL: "",
  VITE_SUPABASE_ANON_KEY: "",
  SUPABASE_URL: "",
  SUPABASE_SERVICE_ROLE_KEY: "",
  VITE_STRIPE_PUBLISHABLE_KEY: "",
  STRIPE_SECRET_KEY: "",
  STRIPE_WEBHOOK_SECRET: ""
};

let child;
function run(args) {
  return new Promise((resolveExit, reject) => {
    child = spawn(process.execPath, [npmCli, ...args], { env, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("exit", (code) => resolveExit(code ?? 1));
  });
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child?.kill(signal));
}

const buildCode = await run(["run", "build:shared"]);
if (buildCode !== 0) process.exit(buildCode);
console.log("Demonstração simulada: Admin http://127.0.0.1:5173/#/admin | PWA http://127.0.0.1:5174/demo");
process.exitCode = await run([
  "exec", "--", "concurrently", "--kill-others", "-n", "admin,pwa,api",
  "npm run dev --workspace @chargegrid/admin-web -- --host 127.0.0.1 --strictPort",
  "npm run dev --workspace @chargegrid/driver-pwa -- --host 127.0.0.1 --strictPort",
  "npm run dev --workspace @chargegrid/api"
]);
