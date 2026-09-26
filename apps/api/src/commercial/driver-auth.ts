import type { Request } from "express";

export interface DriverIdentity {
  id: string;
  fullName: string;
  email?: string;
  vehicleName: string;
}

export type DriverVerifier = (accessToken: string) => Promise<DriverIdentity>;

export class DriverAuthenticationError extends Error {}
export class DriverAuthenticationUnavailableError extends Error {}

function bearerToken(request: Request) {
  const value = request.header("authorization");
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function verifySupabaseDriver(accessToken: string): Promise<DriverIdentity> {
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.VITE_SUPABASE_URL?.trim();
  const anonKey = process.env.SUPABASE_ANON_KEY?.trim() ?? process.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) throw new DriverAuthenticationUnavailableError("A verificação Supabase Auth não está configurada na API.");
  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, { headers: { Authorization: `Bearer ${accessToken}`, apikey: anonKey } });
  } catch {
    throw new DriverAuthenticationUnavailableError("O Supabase Auth não respondeu à verificação de identidade.");
  }
  if (response.status === 401 || response.status === 403) throw new DriverAuthenticationError("Credencial de motorista inválida.");
  if (!response.ok) throw new DriverAuthenticationUnavailableError("O Supabase Auth não conseguiu verificar a identidade.");
  const user = await response.json() as { id?: unknown; email?: unknown; user_metadata?: unknown };
  if (typeof user.id !== "string" || !user.id) throw new DriverAuthenticationError("O Supabase Auth não retornou um motorista válido.");
  const metadata = typeof user.user_metadata === "object" && user.user_metadata !== null ? user.user_metadata as Record<string, unknown> : {};
  const email = typeof user.email === "string" ? user.email : undefined;
  return {
    id: user.id,
    fullName: typeof metadata.full_name === "string" && metadata.full_name.trim() ? metadata.full_name.trim() : email?.split("@")[0] ?? "Motorista",
    email,
    vehicleName: typeof metadata.vehicle_name === "string" && metadata.vehicle_name.trim() ? metadata.vehicle_name.trim() : "Veículo elétrico"
  };
}

export async function requireDriver(request: Request, verify: DriverVerifier = verifySupabaseDriver) {
  const token = bearerToken(request);
  if (!token) throw new DriverAuthenticationError("Informe uma credencial de motorista.");
  return verify(token);
}

export function guestToken(request: Request) {
  const token = request.header("x-session-token")?.trim();
  return token || null;
}
