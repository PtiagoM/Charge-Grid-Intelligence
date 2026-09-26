import type { PaymentMethod } from "../app/DriverAppContext";
import type { CommercialCatalog, CommercialChargerResolution, CommercialQueueRecord, CommercialQuote, CommercialSessionRecord, CommercialSnapshot } from "@chargegrid/shared";
import { currentDriverAccessToken } from "./driverAuth";

const configuredApiBaseUrl = (import.meta.env.VITE_CHARGEGRID_API_URL || "/api").replace(/\/$/, "");
const guestTokenKey = (sessionId: string) => `chargegrid.guest-session-token.${sessionId}`;

export function apiBaseUrl() {
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

async function apiRequest<T>(path: string, init?: RequestInit, sessionToken?: string | null): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15_000);
  try {
    const headers = new Headers(init?.headers);
    const accessToken = await currentDriverAccessToken();
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (sessionToken) headers.set("X-Session-Token", sessionToken);
    const response = await fetch(`${apiBaseUrl()}${path}`, { ...init, headers, signal: controller.signal });
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

export interface QuoteResult {
  quote: CommercialQuote;
  guestToken?: string;
}

export function rememberGuestSessionToken(sessionId: string, token?: string) {
  if (token) sessionStorage.setItem(guestTokenKey(sessionId), token);
}

function guestSessionToken(sessionId: string) {
  return sessionStorage.getItem(guestTokenKey(sessionId));
}

export function createCommercialQuote(input: { chargerId: string; establishmentId: string; guestToken?: string }) {
  return apiRequest<QuoteResult>("/commercial/quotes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chargerId: input.chargerId, establishmentId: input.establishmentId })
  }, input.guestToken);
}

export function createPaymentIntent(input: {
  sessionId: string;
  quoteId: string;
  method: PaymentMethod;
  amount: number;
  guestToken?: string;
}) {
  const { guestToken, ...payload } = input;
  return apiRequest<PaymentIntentResult>("/payments/intents", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": `intent-${input.sessionId}-${input.method}-${Math.round(input.amount * 100)}` },
    body: JSON.stringify(payload)
  }, guestToken);
}

export function getPaymentStatus(paymentIntentId: string, sessionToken?: string) {
  return apiRequest<{ paymentIntentId: string; status: string; providerStatus: string; amount: number; capturableAmount: number; receivedAmount: number; session: CommercialSessionRecord }>(`/payments/${encodeURIComponent(paymentIntentId)}`, undefined, sessionToken);
}

export function getCommercialSession(sessionId: string) {
  return apiRequest<CommercialSessionRecord>(`/commercial/sessions/${encodeURIComponent(sessionId)}`, undefined, guestSessionToken(sessionId));
}

export function stopCommercialSession(sessionId: string) {
  return apiRequest<CommercialSessionRecord>(`/commercial/sessions/${encodeURIComponent(sessionId)}/stop`, { method: "POST" }, guestSessionToken(sessionId));
}

export function getCommercialSnapshot(establishmentId?: string) {
  const query = establishmentId ? `?establishmentId=${encodeURIComponent(establishmentId)}` : "";
  return apiRequest<CommercialSnapshot>(`/commercial/snapshot${query}`);
}

export function getCommercialCatalog() {
  return apiRequest<CommercialCatalog>("/commercial/catalog");
}

export function resolveCommercialCharger(identifier: string) {
  return apiRequest<CommercialChargerResolution>(`/commercial/chargers/resolve/${encodeURIComponent(identifier)}`);
}

export function getCommercialQueue(driverId: string) {
  return apiRequest<{ entry: CommercialQueueRecord | null }>(`/commercial/queue/driver/${encodeURIComponent(driverId)}`);
}

export function joinCommercialQueue(input: { driverId: string; driverName: string; driverVehicle: string; establishmentId: string }) {
  return apiRequest<CommercialQueueRecord>("/commercial/queue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
}

export function leaveCommercialQueue(entryId: string, driverId: string) {
  return apiRequest<void>(`/commercial/queue/${encodeURIComponent(entryId)}/leave`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  });
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
    }, guestSessionToken(input.sessionId));
  }
  const refundAmount = Number(Math.max(0, input.financialLimit - input.totalAmount).toFixed(2));
  if (refundAmount <= 0) return { status: "PAID", amount: input.totalAmount };
  return apiRequest(`/payments/${encodeURIComponent(input.paymentIntentId)}/refund`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": `refund-${input.sessionId}-${Math.round(refundAmount * 100)}` },
    body: JSON.stringify({ sessionId: input.sessionId, amount: refundAmount })
  }, guestSessionToken(input.sessionId));
}
