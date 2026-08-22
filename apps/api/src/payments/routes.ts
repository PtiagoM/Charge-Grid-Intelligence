import { Router, type Request, type Response } from "express";
import { PaymentConfigurationError, StripePaymentProvider, stripeIsConfigured, type StripePaymentMethod } from "./stripe-payment-provider.js";

function provider() {
  return new StripePaymentProvider();
}

function validAmount(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0.5 && value <= 1000;
}

function errorResponse(response: Response, error: unknown) {
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
    const body = request.body as Record<string, unknown>;
    const method = body.method as StripePaymentMethod;
    if (!validAmount(body.amount) || !["CARD", "PIX"].includes(method) || typeof body.sessionId !== "string" || typeof body.establishmentId !== "string" || typeof body.chargerId !== "string") {
      return response.status(400).json({ code: "INVALID_PAYMENT_INPUT", message: "Revise o limite, o meio de pagamento e o ponto de recarga." });
    }
    const idempotencyKey = request.header("Idempotency-Key") ?? `intent-${body.sessionId}-${method}-${Math.round(body.amount * 100)}`;
    try {
      const result = await provider().createIntent({
        sessionId: body.sessionId,
        method,
        amount: body.amount,
        email: typeof body.email === "string" ? body.email : undefined,
        establishmentId: body.establishmentId,
        chargerId: body.chargerId,
        idempotencyKey
      });
      return response.status(201).json(result);
    } catch (error) {
      return errorResponse(response, error);
    }
  });

  router.get("/:paymentIntentId", async (request, response) => {
    try {
      return response.json(await provider().retrieve(request.params.paymentIntentId));
    } catch (error) {
      return errorResponse(response, error);
    }
  });

  router.post("/:paymentIntentId/capture", async (request, response) => {
    const body = request.body as Record<string, unknown>;
    if (!validAmount(body.amount) || typeof body.sessionId !== "string") return response.status(400).json({ code: "INVALID_CAPTURE_INPUT", message: "Valor ou sessão inválidos." });
    try {
      return response.json(await provider().capture({
        paymentIntentId: request.params.paymentIntentId,
        sessionId: body.sessionId,
        amount: body.amount,
        idempotencyKey: request.header("Idempotency-Key") ?? `capture-${body.sessionId}-${Math.round(body.amount * 100)}`
      }));
    } catch (error) {
      return errorResponse(response, error);
    }
  });

  router.post("/:paymentIntentId/refund", async (request, response) => {
    const body = request.body as Record<string, unknown>;
    if (!validAmount(body.amount) || typeof body.sessionId !== "string") return response.status(400).json({ code: "INVALID_REFUND_INPUT", message: "Valor ou sessão inválidos." });
    try {
      return response.json(await provider().refund({
        paymentIntentId: request.params.paymentIntentId,
        sessionId: body.sessionId,
        amount: body.amount,
        idempotencyKey: request.header("Idempotency-Key") ?? `refund-${body.sessionId}-${Math.round(body.amount * 100)}`
      }));
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
