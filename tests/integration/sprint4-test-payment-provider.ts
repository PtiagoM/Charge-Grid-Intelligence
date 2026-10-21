import { PaymentStatus } from "@chargegrid/shared";
import type { StripePaymentProvider } from "../../apps/api/src/payments/stripe-payment-provider.js";

type TestPaymentProvider = Pick<StripePaymentProvider, "createIntent" | "retrieve" | "capture" | "refund">;

function paymentIdentity(paymentIntentId: string) {
  const match = /^pi_e2e_([0-9a-f]{32})_(\d+)$/.exec(paymentIntentId);
  if (!match) throw new Error("PaymentIntent de teste inválido.");
  const compact = match[1]!;
  return {
    sessionId: `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`,
    amount: Number(match[2]) / 100
  };
}

export const sprint4TestPaymentProvider: TestPaymentProvider = {
  async createIntent(input) {
    const amountCents = Math.round(input.amount * 100);
    const paymentIntentId = `pi_e2e_${input.sessionId.replaceAll("-", "")}_${amountCents}`;
    return {
      paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_e2e`,
      status: PaymentStatus.PENDING,
      providerStatus: "requires_capture",
      amount: input.amount,
      currency: "BRL",
      mode: "test"
    };
  },
  async retrieve(paymentIntentId) {
    const identity = paymentIdentity(paymentIntentId);
    return {
      paymentIntentId,
      status: PaymentStatus.AUTHORIZED,
      providerStatus: "requires_capture",
      amount: identity.amount,
      capturableAmount: identity.amount,
      receivedAmount: 0,
      method: "CARD",
      sessionId: identity.sessionId
    };
  },
  async capture(input) {
    return { paymentIntentId: input.paymentIntentId, status: PaymentStatus.PAID, providerStatus: "succeeded", amount: input.amount, currency: "BRL" };
  },
  async refund(input) {
    return { operationId: `re_e2e_${input.sessionId}`, status: PaymentStatus.REFUNDED, amount: input.amount, currency: "BRL" };
  }
};
