import { createApp } from "../../apps/api/src/app.js";
import { DriverAuthenticationError, type DriverVerifier } from "../../apps/api/src/commercial/driver-auth.js";
import { closeCommercialRepository, startCommercialClock } from "../../apps/api/src/commercial/repository.js";
import { sprint4TestPaymentProvider } from "./sprint4-test-payment-provider.js";

const port = Number(process.env.PORT ?? 3433);
const verifyTestDriver: DriverVerifier = async (token) => {
  if (token !== "sprint4-test-driver-token") throw new DriverAuthenticationError("Credencial de teste invÃ¡lida.");
  return { id: "driver_sprint4_test_001", fullName: "Motorista Sprint 4", email: "motorista@sprint4.test", vehicleName: "EV de teste" };
};
const app = createApp({ paymentProvider: () => sprint4TestPaymentProvider, verifyDriver: verifyTestDriver });
const clock = startCommercialClock();
app.get("/test-harness", (_request, response) => response.json({ isolated: true, paymentProvider: "deterministic-test-only", identityProvider: "deterministic-test-only" }));
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
  if (process.connected) process.disconnect();
}

for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => void shutdown());
process.on("message", (message) => {
  if (typeof message === "object" && message !== null && "type" in message && message.type === "shutdown") void shutdown();
});
