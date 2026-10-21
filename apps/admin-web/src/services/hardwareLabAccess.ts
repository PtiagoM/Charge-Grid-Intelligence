import type { Account } from "../domain/admin";

export const hardwareLabEnabled = import.meta.env.DEV || import.meta.env.VITE_CHARGEGRID_HARDWARE_LAB_ENABLED === "true";

export function canUseHardwareLab(account: Account | null) {
  return account?.profile === "GOODWE" || account?.role === "ESTABLISHMENT_ADMIN";
}
