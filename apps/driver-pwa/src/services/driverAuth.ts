import { createClient, type Session, type User } from "@supabase/supabase-js";
import type { DriverProfile, RegisterInput } from "../app/DriverAppContext";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const remoteAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);
const supabase = remoteAuthConfigured ? createClient(supabaseUrl!, supabaseAnonKey!, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
}) : null;

function profileFromUser(user: User): DriverProfile {
  const metadata = user.user_metadata as Record<string, unknown>;
  return {
    id: user.id,
    fullName: typeof metadata.full_name === "string" ? metadata.full_name : user.email?.split("@")[0] ?? "Motorista",
    email: user.email ?? "",
    vehicleName: typeof metadata.vehicle_name === "string" ? metadata.vehicle_name : "Veículo elétrico",
    batteryCapacityKwh: typeof metadata.battery_capacity_kwh === "number" ? metadata.battery_capacity_kwh : undefined
  };
}

export async function signUpDriver(input: RegisterInput) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLocaleLowerCase("pt-BR"),
    password: input.password,
    options: {
      emailRedirectTo: `${window.location.origin}/login`,
      data: {
        full_name: input.fullName.trim(),
        vehicle_name: input.vehicleName.trim() || "Veículo elétrico",
        battery_capacity_kwh: input.batteryCapacityKwh,
        chargegrid_role: "DRIVER"
      }
    }
  });
  if (error) throw error;
  if (!data.user) throw new Error("O Supabase não retornou o motorista cadastrado.");
  return { profile: profileFromUser(data.user), authenticated: Boolean(data.session), requiresEmailConfirmation: !data.session };
}

export async function signInDriver(email: string, password: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLocaleLowerCase("pt-BR"), password });
  if (error) throw error;
  return { profile: profileFromUser(data.user) };
}

export async function signOutDriver() {
  if (supabase) await supabase.auth.signOut();
}

export function subscribeToRemoteSession(onSession: (profile: DriverProfile | null) => void) {
  if (!supabase) return () => undefined;
  void supabase.auth.getSession().then(({ data }) => onSession(data.session ? profileFromUser(data.session.user) : null));
  const { data } = supabase.auth.onAuthStateChange((_event, session: Session | null) => onSession(session ? profileFromUser(session.user) : null));
  return () => data.subscription.unsubscribe();
}
