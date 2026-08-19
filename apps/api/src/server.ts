import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

app.listen(port, () => {
  console.log(JSON.stringify({ level: "info", service: "chargegrid-api", port, message: "API listening" }));
});
