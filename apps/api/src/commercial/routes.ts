import { randomBytes } from "node:crypto";
import { Router } from "express";
import type { LabScenarioId } from "@chargegrid/shared";
import { LAB_SCENARIOS } from "../goodwe/energy-scenarios.js";
import { DriverAuthenticationError, DriverAuthenticationUnavailableError, guestToken, requireDriver, type DriverVerifier } from "./driver-auth.js";
import { CommercialConflictError, CommercialNotFoundError, getCommercialRepository, type CommercialRepository, type CommercialSessionAccess } from "./repository.js";

function errorStatus(error: unknown) {
  if (error instanceof CommercialNotFoundError) return 404;
  if (error instanceof CommercialConflictError) return 409;
  if (error instanceof DriverAuthenticationError) return 401;
  if (error instanceof DriverAuthenticationUnavailableError) return 503;
  return 500;
}

export function createCommercialRouter(options: { repository?: CommercialRepository; verifyDriver?: DriverVerifier } = {}) {
  const router = Router();
  const repository = options.repository ?? getCommercialRepository();
  const driver = (request: Parameters<typeof requireDriver>[0]) => requireDriver(request, options.verifyDriver);
  const sessionAccess = async (request: Parameters<typeof requireDriver>[0]): Promise<CommercialSessionAccess> => {
    const token = guestToken(request);
    if (token) return { guestToken: token };
    return { driverId: (await driver(request)).id };
  };
  const quoteAccess = async (request: Parameters<typeof requireDriver>[0]): Promise<{ access: CommercialSessionAccess; guestToken?: string }> => {
    if (request.header("authorization")) return { access: { driverId: (await driver(request)).id } };
    const existingToken = guestToken(request);
    const token = existingToken || randomBytes(32).toString("base64url");
    return { access: { guestToken: token }, guestToken: token };
  };
  router.get("/catalog", async (_request, response) => {
    try {
      return response.json(await repository.catalog());
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_CATALOG_READ_FAILED", message: error instanceof Error ? error.message : "Falha ao consultar o catálogo comercial." });
    }
  });
  router.get("/chargers/resolve/:identifier", async (request, response) => {
    try {
      return response.json(await repository.resolveCharger(request.params.identifier));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_CHARGER_NOT_FOUND", message: error instanceof Error ? error.message : "Carregador não encontrado." });
    }
  });
  router.post("/quotes", async (request, response) => {
    const { chargerId, establishmentId } = request.body ?? {};
    if (typeof chargerId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(chargerId) || typeof establishmentId !== "string" || !establishmentId.trim()) {
      return response.status(400).json({ code: "INVALID_QUOTE_INPUT", message: "Carregador ou estabelecimento inválido." });
    }
    try {
      const owner = await quoteAccess(request);
      return response.status(201).json({ quote: await repository.createQuote({ chargerId, establishmentId, access: owner.access }), guestToken: owner.guestToken });
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "QUOTE_CREATE_FAILED", message: error instanceof Error ? error.message : "Não foi possível calcular a cotação." });
    }
  });
  router.get("/queue/driver/:driverId", async (request, response) => {
    try {
      const identity = await driver(request);
      if (identity.id !== request.params.driverId) throw new CommercialNotFoundError("Fila ativa não encontrada.");
      return response.json({ entry: await repository.queueForDriver(identity.id) });
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "QUEUE_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível consultar a fila." });
    }
  });
  router.post("/queue", async (request, response) => {
    const { establishmentId } = request.body ?? {};
    if (typeof establishmentId !== "string" || !establishmentId.trim() || establishmentId.length > 160) {
      return response.status(400).json({ code: "INVALID_QUEUE_INPUT", message: "Motorista autenticado, veículo e estabelecimento são obrigatórios." });
    }
    try {
      const identity = await driver(request);
      return response.status(201).json(await repository.joinQueue({ driverId: identity.id, driverName: identity.fullName, driverVehicle: identity.vehicleName, establishmentId }));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "QUEUE_JOIN_FAILED", message: error instanceof Error ? error.message : "Não foi possível entrar na fila." });
    }
  });
  router.post("/queue/:entryId/leave", async (request, response) => {
    try {
      await repository.leaveQueue(request.params.entryId, (await driver(request)).id);
      return response.status(204).end();
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "QUEUE_LEAVE_FAILED", message: error instanceof Error ? error.message : "Não foi possível sair da fila." });
    }
  });
  router.get("/snapshot", async (request, response) => {
    try {
      return response.json(await repository.snapshot(typeof request.query.establishmentId === "string" ? request.query.establishmentId : undefined));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_READ_FAILED", message: error instanceof Error ? error.message : "Falha ao consultar a operação comercial." });
    }
  });
  router.get("/financial-summary", async (request, response) => {
    try {
      return response.json(await repository.financialSummary(typeof request.query.establishmentId === "string" ? request.query.establishmentId : undefined));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_FINANCIAL_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível calcular o resumo financeiro." });
    }
  });
  router.get("/dashboard-summary", async (request, response) => {
    const establishmentId = typeof request.query.establishmentId === "string" ? request.query.establishmentId : "";
    const from = typeof request.query.from === "string" ? request.query.from : "";
    const to = typeof request.query.to === "string" ? request.query.to : "";
    const fromTime = Date.parse(from);
    const toTime = Date.parse(to);
    if (!establishmentId || !Number.isFinite(fromTime) || !Number.isFinite(toTime) || toTime <= fromTime || toTime - fromTime > 31 * 24 * 60 * 60_000) {
      return response.status(400).json({ code: "INVALID_DASHBOARD_RANGE", message: "Informe estabelecimento e período UTC válido de até 31 dias." });
    }
    try {
      return response.json(await repository.dashboardSummary({ establishmentId, from: new Date(fromTime).toISOString(), to: new Date(toTime).toISOString() }));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_DASHBOARD_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível calcular o resumo do dashboard." });
    }
  });
  router.get("/reports", async (request, response) => {
    const establishmentId = typeof request.query.establishmentId === "string" ? request.query.establishmentId : "";
    const from = typeof request.query.from === "string" ? request.query.from : "";
    const to = typeof request.query.to === "string" ? request.query.to : "";
    const fromTime = Date.parse(from);
    const toTime = Date.parse(to);
    if (!establishmentId || !Number.isFinite(fromTime) || !Number.isFinite(toTime) || toTime <= fromTime || toTime - fromTime > 31 * 24 * 60 * 60_000) {
      return response.status(400).json({ code: "INVALID_REPORT_RANGE", message: "Informe estabelecimento e período UTC válido de até 31 dias." });
    }
    try {
      return response.json(await repository.operationalReport({ establishmentId, from: new Date(fromTime).toISOString(), to: new Date(toTime).toISOString() }));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_REPORT_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível gerar o relatório comercial." });
    }
  });
  router.get("/insights", async (request, response) => {
    try {
      return response.json(await repository.insights(typeof request.query.establishmentId === "string" ? request.query.establishmentId : undefined));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_INSIGHTS_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível consultar os insights comerciais." });
    }
  });

  router.get("/plants/:plantId/energy", async (request, response) => {
    try {
      return response.json(await repository.plantEnergyView(request.params.plantId));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_ENERGY_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível consultar a energia da planta." });
    }
  });
  router.post("/insights/:insightId/decision", async (request, response) => {
    const { decision, reason } = request.body ?? {};
    if (!["ACKNOWLEDGE", "RESOLVE", "ACCEPT", "DEFER", "REJECT"].includes(decision) || typeof reason !== "string") {
      return response.status(400).json({ code: "INVALID_INSIGHT_DECISION", message: "Informe uma decisão e um motivo válidos." });
    }
    try {
      return response.json({ insight: await repository.decideInsight({ id: request.params.insightId, decision, reason }) });
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_INSIGHT_DECISION_FAILED", message: error instanceof Error ? error.message : "Não foi possível registrar a decisão." });
    }
  });
  router.get("/plants/:plantId/energy", async (request, response) => {
    try {
      return response.json({ snapshot: await repository.plantEnergy(request.params.plantId), series: await repository.plantEnergySeries(request.params.plantId) });
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "PLANT_ENERGY_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível consultar a telemetria da planta." });
    }
  });
  router.get("/plants/:plantId/forecast", async (request, response) => {
    try {
      return response.json(await repository.plantForecast(request.params.plantId));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "PLANT_FORECAST_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível consultar a previsão da planta." });
    }
  });
  router.post("/plants/:plantId/hardware", async (request, response) => {
    const { online, pvKw, buildingLoadKw, scenarioId, seed = 1 } = request.body ?? {};
    const applyingScenario = scenarioId !== undefined;
    if (applyingScenario
      ? !LAB_SCENARIOS.includes(scenarioId as LabScenarioId) || !Number.isInteger(seed) || seed < 0
      : typeof online !== "boolean" || ![pvKw, buildingLoadKw].every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0)) {
      return response.status(400).json({ code: "INVALID_PLANT_HARDWARE_INPUT", message: "Informe um cenário de laboratório válido ou sinais simulados válidos." });
    }
    try {
      if (applyingScenario) await repository.configurePlantScenario({ plantId: request.params.plantId, scenarioId: scenarioId as LabScenarioId, seed });
      else await repository.configurePlantTelemetry({ plantId: request.params.plantId, online, pvKw, buildingLoadKw });
      await repository.advancePlantTelemetry();
      return response.json(await repository.snapshot());
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "PLANT_HARDWARE_EVENT_FAILED", message: error instanceof Error ? error.message : "Não foi possível aplicar o cenário físico da planta." });
    }
  });
  router.post("/admin/tariffs", async (request, response) => {
    if (process.env.NODE_ENV === "production") return response.status(404).end();
    const { establishmentId, energyCentsPerKwh, idleCentsPerMinute, reason } = request.body ?? {};
    if (typeof establishmentId !== "string" || !Number.isInteger(energyCentsPerKwh) || !Number.isInteger(idleCentsPerMinute) || typeof reason !== "string") {
      return response.status(400).json({ code: "INVALID_TARIFF_INPUT", message: "Informe os dados inteiros de tarifa e o motivo da alteração." });
    }
    try {
      return response.status(201).json({ tariff: await repository.publishTariff({ establishmentId, energyCentsPerKwh, idleCentsPerMinute, reason }) });
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "TARIFF_PUBLISH_FAILED", message: error instanceof Error ? error.message : "Não foi possível publicar a tarifa." });
    }
  });
  router.get("/sessions", async (request, response) => {
    try {
      return response.json({ sessions: await repository.sessionsForAccess(await sessionAccess(request)) });
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_HISTORY_READ_FAILED", message: error instanceof Error ? error.message : "Não foi possível consultar o histórico." });
    }
  });
  router.get("/sessions/:sessionId", async (request, response) => {
    try {
      return response.json(await repository.sessionForAccess(request.params.sessionId, await sessionAccess(request)));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "COMMERCIAL_SESSION_NOT_FOUND", message: error instanceof Error ? error.message : "Sessão não encontrada." });
    }
  });
  router.post("/sessions/:sessionId/stop", async (request, response) => {
    try {
      await repository.sessionForAccess(request.params.sessionId, await sessionAccess(request));
      return response.json(await repository.stopSession(request.params.sessionId));
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
      return response.json(await repository.hardwareEvent(request.params.chargerCode, action, powerKw));
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "HARDWARE_EVENT_FAILED", message: error instanceof Error ? error.message : "O evento físico não foi aplicado." });
    }
  });
  router.post("/test-data/reset", async (_request, response) => {
    if (process.env.NODE_ENV === "production" && process.env.CHARGEGRID_HARDWARE_LAB_ENABLED !== "true") return response.status(404).end();
    try {
      return response.json(await repository.resetTestData());
    } catch (error) {
      return response.status(errorStatus(error)).json({ code: "TEST_DATA_RESET_FAILED", message: error instanceof Error ? error.message : "Não foi possível reiniciar os dados de teste." });
    }
  });
  return router;
}
