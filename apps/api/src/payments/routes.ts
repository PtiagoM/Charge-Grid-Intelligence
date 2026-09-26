import { Router, type Request, type Response } from "express";
import { PaymentConfigurationError, StripePaymentProvider, stripeIsConfigured, type StripePaymentMethod } from "./stripe-payment-provider.js";
import { CommercialConflictError, CommercialNotFoundError, getCommercialRepository } from "../commercial/repository.js";
import { DriverAuthenticationError, DriverAuthenticationUnavailableError, guestToken, requireDriver } from "../commercial/driver-auth.js";
import type { CommercialSessionAccess } from "../commercial/repository.js";
import { CommercialSessionStatus, PaymentStatus } from "@chargegrid/shared";

function provider() {
  return new StripePaymentProvider();
}

function validAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0.5 && value <= 1000;
}

function validUuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function accessFor(request: Request): Promise<CommercialSessionAccess> {
  if (request.header("authorization")) return { driverId: (await requireDriver(request)).id };
  const token = guestToken(request);
  if (token) return { guestToken: token };
  return { driverId: (await requireDriver(request)).id };
}

function errorResponse(response: Response, error: unknown) {
  if (error instanceof CommercialNotFoundError) return response.status(404).json({ code: "COMMERCIAL_RESOURCE_NOT_FOUND", message: error.message });
  if (error instanceof CommercialConflictError) return response.status(409).json({ code: "CHARGER_NOT_AVAILABLE", message: error.message });
  if (error instanceof DriverAuthenticationError) return response.status(401).json({ code: "DRIVER_AUTH_INVALID", message: error.message });
  if (error instanceof DriverAuthenticationUnavailableError) return response.status(503).json({ code: "DRIVER_AUTH_UNAVAILABLE", message: error.message });
  if (error instanceof PaymentConfigurationError) return response.status(503).json({ code: "PAYMENTS_NOT_CONFIGURED", message: error.message });
  const message = error instanceof Error ? error.message : "Falha inesperada no provedor de pagamento.";
  return response.status(502).json({ code: "PAYMENT_PROVIDER_ERROR", message });
}

export function createPaymentRouter() {
  const router = Router();

  router.get("/config", (_request, response) => {
    response.json({ provider: "stripe", mode: "test", configured: stripeIsConfigured() });
  });

  router.post("/intents", async (request, response) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    const method = body.method as StripePaymentMethod;
    if (!validAmount(body.amount) || !["CARD", "PIX"].includes(method) || !validUuid(body.sessionId) || !validUuid(body.quoteId)) {
      return response.status(400).json({ code: "INVALID_PAYMENT_INPUT", message: "Revise o limite, o meio de pagamento e a cotação." });
    }
    const idempotencyKey = request.header("Idempotency-Key") ?? `intent-${body.sessionId}-${method}-${Math.round(body.amount * 100)}`;
    const commercialRepository = getCommercialRepository();
    let reserved = false;
    let intentCreated = false;
    try {
      const session = await commercialRepository.reserveQuotedSession({
        id: body.sessionId,
        quoteId: body.quoteId,
        access: await accessFor(request),
        method,
        authorizedCents: Math.round(body.amount * 100)
      });
      reserved = true;
      const result = await provider().createIntent({
        sessionId: session.id,
        method,
        amount: body.amount,
        email: session.driverEmail,
        establishmentId: session.establishmentId,
        chargerId: session.chargerId,
        idempotencyKey
      });
      intentCreated = true;
      await commercialRepository.attachPayment(session.id, result.paymentIntentId, result.providerStatus);
      return response.status(201).json(result);
    } catch (error) {
      if (reserved && !intentCreated) await commercialRepository.failSession(body.sessionId as string, "intent_creation_failed");
      return errorResponse(response, error);
    }
  });

  router.get("/:paymentIntentId", async (request, response) => {
    try {
      const commercialRepository = getCommercialRepository();
      const sessionId = await commercialRepository.sessionIdForPaymentIntent(request.params.paymentIntentId);
      await commercialRepository.sessionForAccess(sessionId, await accessFor(request));
      const payment = await provider().retrieve(request.params.paymentIntentId);
      const session = await commercialRepository.recordPayment(payment);
      return response.json({ ...payment, session });
    } catch (error) {
      return errorResponse(response, error);
    }
  });

  router.post("/:paymentIntentId/capture", async (request, response) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    if (typeof body.sessionId !== "string") return response.status(400).json({ code: "INVALID_CAPTURE_INPUT", message: "Sessão inválida." });
    try {
      const commercialRepository = getCommercialRepository();
      if (await commercialRepository.sessionIdForPaymentIntent(request.params.paymentIntentId) !== body.sessionId) throw new CommercialNotFoundError("Pagamento não vinculado à sessão.");
      const currentSession = await commercialRepository.sessionForAccess(body.sessionId, await accessFor(request));
      if (currentSession.status !== CommercialSessionStatus.ENERGY_FINISHED) throw new CommercialConflictError("Finalize a entrega de energia antes de capturar o pagamento.");
      await commercialRepository.assertReadyForCapture(body.sessionId);
      const amount = currentSession.totalCostCents / 100;
      const capture = await provider().capture({
        paymentIntentId: request.params.paymentIntentId,
        sessionId: body.sessionId,
        amount,
        idempotencyKey: request.header("Idempotency-Key") ?? `capture-${body.sessionId}-${currentSession.totalCostCents}`
      });
      const session = await commercialRepository.completeCapture({ sessionId: body.sessionId, status: capture.status, providerStatus: capture.providerStatus, capturedCents: Math.round(capture.amount * 100) });
      return response.json({ ...capture, session });
    } catch (error) {
      return errorResponse(response, error);
    }
  });

  router.post("/:paymentIntentId/refund", async (request, response) => {
    const body = (request.body ?? {}) as Record<string, unknown>;
    if (typeof body.sessionId !== "string") return response.status(400).json({ code: "INVALID_REFUND_INPUT", message: "Sessão inválida." });
    try {
      const commercialRepository = getCommercialRepository();
      if (await commercialRepository.sessionIdForPaymentIntent(request.params.paymentIntentId) !== body.sessionId) throw new CommercialNotFoundError("Pagamento não vinculado à sessão.");
      const currentSession = await commercialRepository.sessionForAccess(body.sessionId, await accessFor(request));
      if (currentSession.status !== CommercialSessionStatus.ENERGY_FINISHED) throw new CommercialConflictError("Finalize a entrega de energia antes de devolver o saldo.");
      await commercialRepository.assertReadyForCapture(body.sessionId);
      const refundCents = Math.max(0, currentSession.authorizedCents - currentSession.totalCostCents);
      if (refundCents === 0) return response.json({ status: PaymentStatus.PAID, amount: 0, session: await commercialRepository.completeRefund({ sessionId: body.sessionId, providerStatus: "no_refund_due", refundedCents: 0 }) });
      const refund = await provider().refund({
        paymentIntentId: request.params.paymentIntentId,
        sessionId: body.sessionId,
        amount: refundCents / 100,
        idempotencyKey: request.header("Idempotency-Key") ?? `refund-${body.sessionId}-${refundCents}`
      });
      const session = refund.status === PaymentStatus.REFUNDED
        ? await commercialRepository.completeRefund({ sessionId: body.sessionId, providerStatus: refund.status, refundedCents: refundCents })
        : undefined;
      return response.json({ ...refund, session });
    } catch (error) {
      return errorResponse(response, error);
    }
  });

  return router;
}

export function stripeWebhook(request: Request, response: Response) {
  const signature = request.header("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) return response.status(400).json({ code: "INVALID_WEBHOOK", message: "Assinatura ou segredo do webhook ausente." });
  try {
    const event = provider().constructWebhookEvent(request.body as Buffer, signature, webhookSecret);
    const trackedEvents = new Set([
      "payment_intent.amount_capturable_updated",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "payment_intent.canceled",
      "refund.created",
      "refund.updated",
      "refund.failed"
    ]);
    if (trackedEvents.has(event.type)) {
      console.log(JSON.stringify({ level: "info", service: "chargegrid-api", eventId: event.id, eventType: event.type, message: "Stripe webhook accepted" }));
    }
    return response.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assinatura inválida.";
    return response.status(400).json({ code: "INVALID_WEBHOOK_SIGNATURE", message });
  }
}
