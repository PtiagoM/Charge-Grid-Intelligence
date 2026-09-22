import { config } from "dotenv";
import { createApp } from "./app.js";
import { startCommercialClock } from "./commercial/repository.js";

config({ path: new URL("../../../.env", import.meta.url) });

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

export default app;

if (!process.env.VERCEL) {
  startCommercialClock();
  app.listen(port, process.env.CHARGEGRID_DEMO_ENABLED === "true" ? "127.0.0.1" : "0.0.0.0", () => {
    console.log(JSON.stringify({ level: "info", service: "chargegrid-api", port, message: "API listening" }));
  });
}
