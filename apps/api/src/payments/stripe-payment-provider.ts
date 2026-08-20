import { PaymentStatus } from "@chargegrid/shared";
import Stripe from "stripe";

export type StripePaymentMethod = "CARD" | "PIX";

export interface CreateStripeIntentInput {
  sessionId: string;
  method: StripePaymentMethod;
  amount: number;
  email?: string;
  establishmentId: string;
  chargerId: string;
  idempotencyKey: string;
}

export class PaymentConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaymentConfigurationError";
  }
}

function toMinorUnits(amount: number) {
  return Math.round(amount * 100);
}

function fromMinorUnits(amount: number) {
  return amount / 100;
}

function paymentStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
  if (status === "requires_capture") return PaymentStatus.AUTHORIZED;
  if (status === "succeeded") return PaymentStatus.PAID;
  if (status === "canceled") return PaymentStatus.FAILED;
  return PaymentStatus.PENDING;
}

export class StripePaymentProvider {
  readonly mode = "test" as const;
  private readonly stripe: Stripe;

  constructor(secretKey = process.env.STRIPE_SECRET_KEY) {
    if (!secretKey) throw new PaymentConfigurationError("STRIPE_SECRET_KEY não configurada.");
    if (!secretKey.startsWith("sk_test_") || secretKey.length <= 16) throw new PaymentConfigurationError("Somente chaves Stripe de teste válidas são permitidas neste ambiente.");
    this.stripe = new Stripe(secretKey, { apiVersion: "2026-07-29.dahlia", typescript: true, maxNetworkRetries: 2 });
  }

  async createIntent(input: CreateStripeIntentInput) {
    const intent = await this.stripe.paymentIntents.create({
      amount: toMinorUnits(input.amount),
      currency: "brl",
      capture_method: input.method === "CARD" ? "manual" : "automatic",
      payment_method_types: [input.method === "CARD" ? "card" : "pix"],
      receipt_email: input.email,
      description: `ChargeGrid · ${input.establishmentId} · ${input.chargerId}`,
      metadata: {
        chargegrid_session_id: input.sessionId,
        establishment_id: input.establishmentId,
        charger_id: input.chargerId,
        payment_method: input.method,
        environment: "test"
      }
    }, { idempotencyKey: input.idempotencyKey });

    if (!intent.client_secret) throw new Error("A Stripe não retornou client_secret para o PaymentIntent.");
    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      status: paymentStatus(intent.status),
      amount: fromMinorUnits(intent.amount),
      currency: "BRL" as const,
      mode: this.mode
    };
  }

  async retrieve(paymentIntentId: string) {
    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return {
      paymentIntentId: intent.id,
      status: paymentStatus(intent.status),
      providerStatus: intent.status,
      amount: fromMinorUnits(intent.amount),
      capturableAmount: fromMinorUnits(intent.amount_capturable),
      receivedAmount: fromMinorUnits(intent.amount_received),
      method: intent.metadata.payment_method
    };
  }

  async capture(input: { paymentIntentId: string; sessionId: string; amount: number; idempotencyKey: string }) {
    const existing = await this.stripe.paymentIntents.retrieve(input.paymentIntentId);
    if (existing.metadata.chargegrid_session_id !== input.sessionId) throw new Error("Pagamento não pertence à sessão informada.");
    const intent = await this.stripe.paymentIntents.capture(input.paymentIntentId, {
      amount_to_capture: Math.min(toMinorUnits(input.amount), existing.amount_capturable),
      metadata: { settlement_type: "chargegrid_final_capture" }
    }, { idempotencyKey: input.idempotencyKey });
    return { paymentIntentId: intent.id, status: paymentStatus(intent.status), amount: fromMinorUnits(intent.amount_received), currency: "BRL" as const };
  }

  async refund(input: { paymentIntentId: string; sessionId: string; amount: number; idempotencyKey: string }) {
    const existing = await this.stripe.paymentIntents.retrieve(input.paymentIntentId);
    if (existing.metadata.chargegrid_session_id !== input.sessionId) throw new Error("Pagamento não pertence à sessão informada.");
    const refund = await this.stripe.refunds.create({
      payment_intent: input.paymentIntentId,
      amount: Math.min(toMinorUnits(input.amount), existing.amount_received),
      metadata: { chargegrid_session_id: input.sessionId, settlement_type: "unused_pix_balance" }
    }, { idempotencyKey: input.idempotencyKey });
    return {
      operationId: refund.id,
      status: refund.status === "succeeded" ? PaymentStatus.REFUNDED : PaymentStatus.REFUND_PENDING,
      amount: fromMinorUnits(refund.amount),
      currency: "BRL" as const
    };
  }

  constructWebhookEvent(payload: Buffer, signature: string, webhookSecret: string) {
    if (!webhookSecret.startsWith("whsec_") || webhookSecret.length <= 12) throw new PaymentConfigurationError("STRIPE_WEBHOOK_SECRET inválido.");
    return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  }
}

export function stripeIsConfigured() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  return Boolean(secretKey?.startsWith("sk_test_") && secretKey.length > 16);
}
