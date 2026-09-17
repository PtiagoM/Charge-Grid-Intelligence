import type { DemoRuntimeError, DemoRuntimeState, DemoStartSessionInput } from "@chargegrid/shared";
import { apiBaseUrl } from "./paymentApi";

export const demoEnabled = import.meta.env.VITE_CHARGEGRID_DEMO_ENABLED === "true";

async function request(path: string, body?: unknown): Promise<DemoRuntimeState> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(`${apiBaseUrl()}/demo${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store"
    });
    const payload = await response.json() as DemoRuntimeState | DemoRuntimeError;
    if (!response.ok || "error" in payload) {
      throw new Error("error" in payload ? payload.error.message : "A demonstração está indisponível.");
    }
    return payload;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("A API demorou para responder. Tente novamente.");
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}

export const loadDemo = () => request("/state");
export const startDemoSession = (input: DemoStartSessionInput) => request("/sessions", input);
export const stopDemoSession = (id: string) => request(`/sessions/${encodeURIComponent(id)}/stop`, {});
