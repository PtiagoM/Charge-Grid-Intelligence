import { createApp } from "../../apps/api/src/app.js";
import { closeCommercialRepository, startCommercialClock } from "../../apps/api/src/commercial/repository.js";
import { sprint4TestPaymentProvider } from "./sprint4-test-payment-provider.js";

const port = Number(process.env.PORT ?? 3433);
const app = createApp({ paymentProvider: () => sprint4TestPaymentProvider });
const clock = startCommercialClock();
app.get("/test-harness", (_request, response) => response.json({ isolated: true, paymentProvider: "deterministic-test-only" }));
const server = app.listen(port, "127.0.0.1");
let closing = false;

server.once("listening", () => console.log(JSON.stringify({ level: "info", service: "chargegrid-test-api", port, message: "isolated API listening" })));
server.once("error", (error) => {
  console.error(JSON.stringify({ level: "error", service: "chargegrid-test-api", message: "API failed to listen", error: error.message }));
  process.exitCode = 1;
  void shutdown();
});

async function shutdown() {
  if (closing) return;
  closing = true;
  await clock.stop();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await closeCommercialRepository();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => void shutdown());
