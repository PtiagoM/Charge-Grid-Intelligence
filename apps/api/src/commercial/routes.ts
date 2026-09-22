import { Router } from "express";
import { CommercialConflictError, CommercialNotFoundError, getCommercialRepository } from "./repository.js";

function errorStatus(error: unknown) {
  if (error instanceof CommercialNotFoundError) return 404;
  if (error instanceof CommercialConflictError) return 409;
  return 500;
}

export function createCommercialRouter() {
  const router = Router();
  router.get("/queue/driver/:driverId", async (request, response) => {
    try {
      return response.json({ entry: await getCommercialRepository().queueForDriver(request.params.driverId) });
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "QUEUE_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível consultar a fila." });
    }
  });
  router.post("/queue", async (request, response) => {
    const { driverId, driverName, driverVehicle, establishmentId } = request.body ?? {};
    if (![driverId, driverName, driverVehicle, establishmentId].every((value) => typeof value === "string" && value.trim().length > 0 && value.length <= 160)) {
      return response.status(400).json({ code: "INVALID_QUEUE_INPUT", message: "Motorista autenticado, veículo e estabelecimento são obrigatórios." });
    }
    try {
      return response.status(201).json(await getCommercialRepository().joinQueue({ driverId, driverName, driverVehicle, establishmentId }));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "QUEUE_JOIN_FAILED", message: error instanceof Error ? error.message : "Não foi possível entrar na fila." });
    }
  });
  router.post("/queue/:entryId/leave", async (request, response) => {
    if (typeof request.body?.driverId !== "string") return response.status(400).json({ code: "INVALID_QUEUE_LEAVE", message: "Motorista obrigatório." });
    try {
      await getCommercialRepository().leaveQueue(request.params.entryId, request.body.driverId);
      return response.status(204).end();
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "QUEUE_LEAVE_FAILED", message: error instanceof Error ? error.message : "Não foi possível sair da fila." });
    }
  });
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
  router.post("/sessions/:sessionId/stop", async (request, response) => {
    try {
      return response.json(await getCommercialRepository().stopSession(request.params.sessionId));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_STOP_FAILED", message: error instanceof Error ? error.message : "Não foi possível encerrar a energia." });
    }
  });
  router.post("/chargers/:chargerCode/hardware", async (request, response) => {
    const action = request.body?.action;
    const powerKw = request.body?.powerKw;
    if (!["CONNECT", "DISCONNECT", "START", "STOP", "OFFLINE", "FAULT", "RECOVER"].includes(action) || (powerKw !== undefined && (typeof powerKw !== "number" || !Number.isFinite(powerKw) || powerKw <= 0 || powerKw > 350))) {
      return response.status(400).json({ code: "INVALID_HARDWARE_EVENT", message: "Evento físico ou potência inválidos." });
    }
    try {
      return response.json(await getCommercialRepository().hardwareEvent(request.params.chargerCode, action, powerKw));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "HARDWARE_EVENT_FAILED", message: error instanceof Error ? error.message : "O evento físico não foi aplicado." });
    }
  });
  router.post("/test-data/reset", async (_request, response) => {
    if (process.env.NODE_ENV === "production" && process.env.CHARGEGRID_HARDWARE_LAB_ENABLED !== "true") return response.status(404).end();
    try {
      return response.json(await getCommercialRepository().resetTestData());
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "TEST_DATA_RESET_FAILED", message: error instanceof Error ? error.message : "Não foi possível reiniciar os dados de teste." });
    }
  });
  return router;
}
