import { config } from "dotenv";
import { resolve } from "node:path";
import { createApp } from "./app.js";

config({ path: resolve(process.cwd(), "../../.env") });

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

export default app;

if (!process.env.VERCEL) {
  app.listen(port, process.env.CHARGEGRID_DEMO_ENABLED === "true" ? "127.0.0.1" : "0.0.0.0", () => {
    console.log(JSON.stringify({ level: "info", service: "chargegrid-api", port, message: "API listening" }));
  });
}
