import { CommercialSessionStatus } from "../enums/index.js";
import { demoEstablishmentD0 } from "./establishment.js";
import { demoPlantD0 } from "./plant.js";
import type { DemoSession } from "./models.js";

const brl = (amount: number) => ({ amount, currency: "BRL" as const });

export const demoSessionsD0: readonly DemoSession[] = [
  {
    sessionId: "sess_demo_001", driverRef: "driver_demo_ana", establishmentId: demoEstablishmentD0.id,
    chargerId: "charger_demo_01", status: CommercialSessionStatus.CHARGING,
    startedAt: "2026-08-19T17:25:00-03:00", updatedAt: demoPlantD0.observedAt, durationMinutes: 20,
    averagePowerKw: 6.2, currentPowerKw: 6.2, energyDeliveredKwh: 2.07, tariffPerKwh: 1.9,
    costEstimate: brl(3.93), paymentMethod: "CARD", financialLimit: 40
  },
  {
    sessionId: "sess_demo_002", driverRef: "guest_demo_7f3a", establishmentId: demoEstablishmentD0.id,
    chargerId: "charger_demo_02", status: CommercialSessionStatus.CHARGING,
    startedAt: "2026-08-19T17:10:00-03:00", updatedAt: demoPlantD0.observedAt, durationMinutes: 35,
    averagePowerKw: 5.8, currentPowerKw: 5.8, energyDeliveredKwh: 3.38, tariffPerKwh: 1.9,
    costEstimate: brl(6.42), paymentMethod: "PIX", financialLimit: 30
  },
  {
    sessionId: "sess_demo_003", driverRef: "driver_demo_bruno", establishmentId: demoEstablishmentD0.id,
    chargerId: "charger_demo_03", status: CommercialSessionStatus.IDLE_GRACE_PERIOD,
    startedAt: "2026-08-19T15:05:00-03:00", updatedAt: demoPlantD0.observedAt, durationMinutes: 160,
    averagePowerKw: 6.75, currentPowerKw: 0, energyDeliveredKwh: 18, tariffPerKwh: 2,
    costEstimate: brl(36), paymentMethod: "CARD", financialLimit: 55,
    idleGraceEndsAt: "2026-08-19T17:54:00-03:00", note: "Energia finalizada às 17:39; tolerância em curso."
  },
  {
    sessionId: "sess_demo_004", driverRef: "guest_demo_historical_04", establishmentId: demoEstablishmentD0.id,
    chargerId: "charger_demo_04", status: CommercialSessionStatus.COMPLETED,
    startedAt: "2026-08-19T14:00:00-03:00", updatedAt: "2026-08-19T16:00:00-03:00", durationMinutes: 120,
    averagePowerKw: 6.2, energyDeliveredKwh: 12.4, tariffPerKwh: 1.9,
    costEstimate: brl(23.56), paymentMethod: "CARD"
  },
  {
    sessionId: "sess_demo_005", driverRef: "driver_demo_ana", establishmentId: demoEstablishmentD0.id,
    chargerId: "charger_demo_05", status: CommercialSessionStatus.FAULTED,
    startedAt: "2026-08-19T13:20:00-03:00", updatedAt: "2026-08-19T14:02:00-03:00", durationMinutes: 42,
    averagePowerKw: 6, energyDeliveredKwh: 4.2, tariffPerKwh: 2,
    costEstimate: brl(8.4), paymentMethod: "CARD", note: "EV_COMMUNICATION_FAULT; sem ociosidade."
  },
  {
    sessionId: "sess_demo_006", driverRef: "guest_demo_historical_06", establishmentId: demoEstablishmentD0.id,
    chargerId: "charger_demo_06", status: CommercialSessionStatus.COMPLETED,
    startedAt: "2026-08-19T11:00:00-03:00", updatedAt: "2026-08-19T12:20:00-03:00", durationMinutes: 80,
    averagePowerKw: 6, energyDeliveredKwh: 8, tariffPerKwh: 1.9,
    costEstimate: brl(15.2), paymentMethod: "PIX", financialLimit: 25,
    note: "Devolução Pix confirmada de R$ 9,80."
  }
] as const;
