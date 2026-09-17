import { Router } from "express";
import { fileURLToPath } from "node:url";
import { DemoError, DemoRuntime } from "./runtime.js";

export function createDemoRouter(file = process.env.CHARGEGRID_DEMO_STATE_PATH ?? fileURLToPath(new URL("../../../../.local/demo/state.json", import.meta.url))) {
  const runtime = new DemoRuntime(file);
  const router = Router();
  router.use((_request, response, next) => { response.set("Cache-Control", "no-store"); next(); });
  router.get("/state", (_request, response) => response.json(runtime.snapshot()));
  router.post("/reset", (_request, response) => response.json(runtime.reset()));
  router.post("/scenario", (request, response) => response.json(runtime.scenario(request.body?.scenario)));
  router.post("/advance", (request, response) => response.json(runtime.advance(request.body?.minutes)));
  router.post("/sessions", (request, response) => response.status(201).json(runtime.start(request.body)));
  router.post("/sessions/:id/stop", (request, response) => response.json(runtime.stop(request.params.id)));
  router.use((error: unknown, _request: import("express").Request, response: import("express").Response, _next: import("express").NextFunction) => {
    if (error instanceof DemoError) return response.status(error.status).json({ error: { code: error.code, message: error.message } });
    console.error("Demo persistence error", error instanceof Error ? error.message : "unknown error");
    return response.status(500).json({ error: { code: "DEMO_STORAGE_ERROR", message: "Não foi possível persistir a demonstração; a alteração não foi aplicada." } });
  });
  return router;
}
