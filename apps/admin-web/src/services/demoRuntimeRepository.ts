import type { DemoRuntimeError, DemoRuntimeState } from "@chargegrid/shared";
import type { Account, AdminState } from "../domain/admin";
import { activeGrantFor } from "../domain/accessOperations";

export const demoRuntimeEnabled = import.meta.env.VITE_CHARGEGRID_DEMO_ENABLED === "true";
const apiUrl = (import.meta.env.VITE_CHARGEGRID_API_URL || "http://localhost:3333").replace(/\/$/, "");

export function canUseDemoRuntime(state: AdminState, account: Account | null) {
  if (!account || !activeGrantFor(state, account.id)?.establishmentIds.includes("est-fiap")) return false;
  return account.profile === "GOODWE" || account.role === "ESTABLISHMENT_ADMIN";
}

export async function requestDemoRuntime(path = "/state", body?: object): Promise<DemoRuntimeState> {
  const response = await fetch(`${apiUrl}/demo${path}`, {
    method: path === "/state" ? "GET" : "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(10_000)
  });
  const result = await response.json() as DemoRuntimeState | DemoRuntimeError;
  if (!response.ok || "error" in result) {
    throw new Error("error" in result ? `${result.error.code}: ${result.error.message}` : `API indisponível (${response.status}).`);
  }
  return result;
}
