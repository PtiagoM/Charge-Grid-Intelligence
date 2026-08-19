import { PaymentStatus } from "@chargegrid/shared";
import type { PaymentOperationResult, PaymentProvider } from "./payment-provider.js";

const result = (sessionId: string, operation: string, amount: number, status: PaymentStatus): PaymentOperationResult => ({
  operationId: `demo_${operation}_${sessionId}`,
  status,
  amount,
  currency: "BRL"
});

export class MockPaymentProvider implements PaymentProvider {
  async authorize(input: Parameters<PaymentProvider["authorize"]>[0]) {
    const status = input.method === "CARD" ? PaymentStatus.AUTHORIZED : PaymentStatus.PAID;
    return result(input.sessionId, "authorize", input.amount, status);
  }

  async capture(input: Parameters<PaymentProvider["capture"]>[0]) {
    return result(input.sessionId, "capture", input.amount, PaymentStatus.PAID);
  }

  async refund(input: Parameters<PaymentProvider["refund"]>[0]) {
    return result(input.sessionId, "refund", input.amount, PaymentStatus.REFUNDED);
  }
}
