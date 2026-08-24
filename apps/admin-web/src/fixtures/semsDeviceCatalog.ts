export type SemsDeviceKind = "inverter" | "dongle" | "charger" | "third-party-inverter";

export type SemsDeviceStatus =
  | "operating"
  | "online"
  | "offline"
  | "charging"
  | "inactive"
  | "maintenance"
  | "fault"
  | "standby";

export interface SemsTechnicalDevice {
  id: string;
  establishmentId: string;
  locationId: string;
  kind: Exclude<SemsDeviceKind, "charger">;
  name: string;
  serial: string;
  status: SemsDeviceStatus;
  typeLabel: string;
  primaryMetric: string;
  secondaryMetric: string;
  email?: string;
}

// Technical SEMS+ fixtures keep the reconstructed device tabs useful while
// charger records continue to come from the ChargeGrid application state.
export const SEMS_TECHNICAL_DEVICES: readonly SemsTechnicalDevice[] = [
  {
    id: "sems-inverter-fiap-01",
    establishmentId: "est-fiap",
    locationId: "loc-fiap-aclimacao",
    kind: "inverter",
    name: "ES LD",
    serial: "97500NAP25BL0008",
    status: "operating",
    typeLabel: "Inversor de armazenamento de energia",
    primaryMetric: "1,00",
    secondaryMetric: "0,70"
  },
  {
    id: "sems-dongle-fiap-16",
    establishmentId: "est-fiap",
    locationId: "loc-fiap-aclimacao",
    kind: "dongle",
    name: "Dongle 16",
    serial: "7210WFA25801304",
    status: "online",
    typeLabel: "Dongle",
    primaryMetric: "--",
    secondaryMetric: "--"
  },
  {
    id: "sems-dongle-fiap-14",
    establishmentId: "est-fiap",
    locationId: "loc-fiap-aclimacao",
    kind: "dongle",
    name: "Dongle 14",
    serial: "7200IWLA24502114",
    status: "offline",
    typeLabel: "Dongle",
    primaryMetric: "--",
    secondaryMetric: "--"
  },
  {
    id: "sems-third-party-fiap-01",
    establishmentId: "est-fiap",
    locationId: "loc-fiap-aclimacao",
    kind: "third-party-inverter",
    name: "Third-party Inverter 1",
    serial: "VDI009097500NAP25BL0008",
    status: "offline",
    typeLabel: "Inversor de terceiros",
    primaryMetric: "--",
    secondaryMetric: "0,00"
  }
];
