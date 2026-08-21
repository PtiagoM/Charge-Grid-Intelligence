import type { PaymentMethod } from "../app/DriverAppContext";

const configuredApiBaseUrl = (import.meta.env.VITE_CHARGEGRID_API_URL || "/api").replace(/\/$/, "");

function apiBaseUrl() {
  if (typeof window === "undefined" || !configuredApiBaseUrl.startsWith("http")) return configuredApiBaseUrl;
  const configuredUrl = new URL(configuredApiBaseUrl);
  const isLocalApi = configuredUrl.hostname === "localhost" || configuredUrl.hostname === "127.0.0.1";
  const isRemoteDevice = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
  if (!isLocalApi || !isRemoteDevice) return configuredApiBaseUrl;
  configuredUrl.hostname = window.location.hostname;
  return configuredUrl.toString().replace(/\/$/, "");
}

interface ApiErrorBody {
  message?: string;
  code?: string;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, signal: controller.signal });
    const payload = await response.json().catch(() => ({})) as T & ApiErrorBody;
    if (!response.ok) throw new Error(payload.message || "O gateway de pagamento não respondeu como esperado.");
    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("A API de pagamento não respondeu. Confirme que a API ChargeGrid está acessível nesta rede.");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export interface PaymentIntentResult {
  paymentIntentId: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: "BRL";
  mode: "test";
}

export function createPaymentIntent(input: {
  sessionId: string;
  method: PaymentMethod;
  amount: number;
  email?: string;
  establishmentId: string;
  chargerId: string;
}) {
  return apiRequest<PaymentIntentResult>("/payments/intents", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": `intent-${input.sessionId}-${input.method}-${Math.round(input.amount * 100)}` },
    body: JSON.stringify(input)
  });
}

export function getPaymentStatus(paymentIntentId: string) {
  return apiRequest<{ paymentIntentId: string; status: string; providerStatus: string; amount: number; capturableAmount: number; receivedAmount: number }>(`/payments/${encodeURIComponent(paymentIntentId)}`);
}

export async function settlePayment(input: {
  paymentIntentId: string;
  sessionId: string;
  method: PaymentMethod;
  totalAmount: number;
  financialLimit: number;
}) {
  if (input.method === "CARD") {
    return apiRequest(`/payments/${encodeURIComponent(input.paymentIntentId)}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": `capture-${input.sessionId}-${Math.round(input.totalAmount * 100)}` },
      body: JSON.stringify({ sessionId: input.sessionId, amount: input.totalAmount })
    });
  }
  const refundAmount = Number(Math.max(0, input.financialLimit - input.totalAmount).toFixed(2));
  if (refundAmount < 0.5) return { status: "PAID", amount: input.totalAmount };
  return apiRequest(`/payments/${encodeURIComponent(input.paymentIntentId)}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": `refund-${input.sessionId}-${Math.round(refundAmount * 100)}` },
    body: JSON.stringify({ sessionId: input.sessionId, amount: refundAmount })
  });
}
