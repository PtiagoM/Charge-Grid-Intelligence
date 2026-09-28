import { config } from "dotenv";
import { createApp } from "./app.js";
import { closeCommercialRepository, startCommercialClock } from "./commercial/repository.js";

if (process.env.NODE_ENV !== "test") config({ path: new URL("../../../.env", import.meta.url) });

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

export default app;

if (!process.env.VERCEL) {
  const commercialClock = startCommercialClock();
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(JSON.stringify({ level: "info", service: "chargegrid-api", port, message: "API listening" }));
  });
  let shuttingDown = false;
  const shutdown = async (reason: string, exitCode = 0) => {
    if (shuttingDown) return;
    shuttingDown = true;
    process.exitCode = exitCode;
    console.log(JSON.stringify({ level: "info", service: "chargegrid-api", message: "API shutting down", reason }));
    await commercialClock.stop();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await closeCommercialRepository();
  };
  server.once("error", (error) => {
    console.error(JSON.stringify({ level: "error", service: "chargegrid-api", message: "API server failed to listen", error: error.message }));
    void shutdown("SERVER_ERROR", 1);
  });
  for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => void shutdown(signal));
}
