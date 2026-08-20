import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { UserRole } from "@chargegrid/shared";

export interface DemoAdminAccount {
  email: string;
  password: string;
  role: UserRole.GOODWE_ADMIN | UserRole.ESTABLISHMENT_ADMIN;
  displayName: string;
  profileLabel: "GOODWE" | "ESTABELECIMENTO";
}

export const demoAdminAccounts: readonly DemoAdminAccount[] = [
  { email: "goodwe@teste.com", password: "teste", role: UserRole.GOODWE_ADMIN, displayName: "Painel Executivo GoodWe", profileLabel: "GOODWE" },
  { email: "estabelecimento@teste.com", password: "teste", role: UserRole.ESTABLISHMENT_ADMIN, displayName: "Hub Solar Aurora", profileLabel: "ESTABELECIMENTO" }
];

interface AuthContextValue {
  account: DemoAdminAccount | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const storageKey = "chargegrid-admin-demo-session-v1";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAccount() {
  const storedEmail = sessionStorage.getItem(storageKey);
  return demoAdminAccounts.find((account) => account.email === storedEmail) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<DemoAdminAccount | null>(readStoredAccount);

  const login = useCallback((email: string, password: string) => {
    const matched = demoAdminAccounts.find((candidate) => candidate.email === email.trim().toLowerCase() && candidate.password === password);
    if (!matched) return false;
    sessionStorage.setItem(storageKey, matched.email);
    setAccount(matched);
    return true;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(storageKey);
    setAccount(null);
  }, []);

  const value = useMemo(() => ({ account, login, logout }), [account, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa ser usado dentro de AuthProvider.");
  return context;
}
