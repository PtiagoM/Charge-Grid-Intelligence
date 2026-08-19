import { CommercialAvailability } from "../enums/index.js";
import type { EstablishmentSummary, QueueSummary } from "../contracts/index.js";

const brl = (amount: number) => ({ amount, currency: "BRL" as const });

export const demoQueueD0: QueueSummary = {
  establishmentId: "est_demo_aurora_001",
  activeCount: 0,
  commercialAvailability: CommercialAvailability.OPEN_PARTIAL,
  registeredCount: 0,
  guestCount: 0
};

export const demoEstablishmentD0: EstablishmentSummary = {
  id: "est_demo_aurora_001",
  name: "Hub Solar Aurora",
  commercialAvailability: CommercialAvailability.OPEN_PARTIAL,
  availableChargerCount: 1,
  queueSummary: demoQueueD0,
  address: "Avenida das Energias, 700 — Distrito Solar, São Paulo — SP (fictício)",
  timezone: "America/Sao_Paulo",
  openingHours: "segunda a sábado, 08:00–22:00",
  tariffFrom: brl(1.9),
  favorableEnergyCondition: true
};
