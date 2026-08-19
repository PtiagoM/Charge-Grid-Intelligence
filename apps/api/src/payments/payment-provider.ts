import type { PaymentStatus } from "@chargegrid/shared";

export type PaymentMethod = "CARD" | "PIX";

export interface PaymentOperationResult {
  operationId: string;
  status: PaymentStatus;
  amount: number;
  currency: "BRL";
}

export interface PaymentProvider {
  authorize(input: { sessionId: string; method: PaymentMethod; amount: number }): Promise<PaymentOperationResult>;
  capture(input: { sessionId: string; amount: number }): Promise<PaymentOperationResult>;
  refund(input: { sessionId: string; amount: number }): Promise<PaymentOperationResult>;
}
