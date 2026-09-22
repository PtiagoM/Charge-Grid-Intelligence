import { Router } from "express";
import { CommercialConflictError, CommercialNotFoundError, getCommercialRepository } from "./repository.js";

function errorStatus(error: unknown) {
  if (error instanceof CommercialNotFoundError) return 404;
  if (error instanceof CommercialConflictError) return 409;
  return 500;
}

export function createCommercialRouter() {
  const router = Router();
  router.get("/snapshot", async (request, response) => {
    try {
      return response.json(await getCommercialRepository().snapshot(typeof request.query.establishmentId === "string" ? request.query.establishmentId : undefined));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_READ_FAILED", message: error instanceof Error ? error.message : "Falha ao consultar a operação comercial." });
    }
  });
  router.get("/sessions/:sessionId", async (request, response) => {
    try {
      return response.json(await getCommercialRepository().session(request.params.sessionId));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_SESSION_NOT_FOUND", message: error instanceof Error ? error.message : "Sessão não encontrada." });
    }
  });
  return router;
}
