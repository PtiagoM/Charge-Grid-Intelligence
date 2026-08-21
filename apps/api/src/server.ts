import { config } from "dotenv";
import { resolve } from "node:path";
import { createApp } from "./app.js";

config({ path: resolve(process.cwd(), "../../.env") });

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(JSON.stringify({ level: "info", service: "chargegrid-api", port, message: "API listening" }));
});
