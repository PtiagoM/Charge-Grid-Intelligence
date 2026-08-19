import { ChargerCommercialStatus, ChargerTechnicalStatus } from "../enums/index.js";
import { demoPlantD0 } from "./plant.js";
import type { DemoCharger } from "./models.js";

export const demoChargersD0: readonly DemoCharger[] = [
  {
    id: "charger_demo_01", plantId: demoPlantD0.plantId, commercialName: "Aurora 01", parkingSpot: "A01",
    nominalPowerKw: 7, currentPowerKw: 6.2, technicalStatus: ChargerTechnicalStatus.CHARGING,
    commercialStatus: ChargerCommercialStatus.OCCUPIED, vehicleConnectionStatus: 2,
    activeSessionId: "sess_demo_001", lastTechnicalUpdateAt: "2026-08-19T17:45:00-03:00"
  },
  {
    id: "charger_demo_02", plantId: demoPlantD0.plantId, commercialName: "Aurora 02", parkingSpot: "A02",
    nominalPowerKw: 7, currentPowerKw: 5.8, technicalStatus: ChargerTechnicalStatus.CHARGING,
    commercialStatus: ChargerCommercialStatus.OCCUPIED, vehicleConnectionStatus: 2,
    activeSessionId: "sess_demo_002", lastTechnicalUpdateAt: "2026-08-19T17:45:00-03:00"
  },
  {
    id: "charger_demo_03", plantId: demoPlantD0.plantId, commercialName: "Aurora 03", parkingSpot: "A03",
    nominalPowerKw: 7, currentPowerKw: 0, technicalStatus: ChargerTechnicalStatus.CONNECTED,
    commercialStatus: ChargerCommercialStatus.OCCUPIED, vehicleConnectionStatus: 1,
    activeSessionId: "sess_demo_003", lastTechnicalUpdateAt: "2026-08-19T17:45:00-03:00"
  },
  {
    id: "charger_demo_04", plantId: demoPlantD0.plantId, commercialName: "Aurora 04", parkingSpot: "A04",
    nominalPowerKw: 7, currentPowerKw: 0, technicalStatus: ChargerTechnicalStatus.AVAILABLE,
    commercialStatus: ChargerCommercialStatus.AVAILABLE_TO_START, vehicleConnectionStatus: 0,
    lastTechnicalUpdateAt: "2026-08-19T17:45:00-03:00"
  },
  {
    id: "charger_demo_05", plantId: demoPlantD0.plantId, commercialName: "Aurora 05", parkingSpot: "A05",
    nominalPowerKw: 7, technicalStatus: ChargerTechnicalStatus.FAULT,
    commercialStatus: ChargerCommercialStatus.FAULTED, vehicleConnectionStatus: null,
    faultCode: "EV_COMMUNICATION_FAULT", lastTechnicalUpdateAt: "2026-08-19T17:44:52-03:00"
  },
  {
    id: "charger_demo_06", plantId: demoPlantD0.plantId, commercialName: "Aurora 06", parkingSpot: "A06",
    nominalPowerKw: 7, currentPowerKw: 0, technicalStatus: ChargerTechnicalStatus.AVAILABLE,
    commercialStatus: ChargerCommercialStatus.MAINTENANCE, vehicleConnectionStatus: 0,
    maintenanceReason: "manutenção comercial programada", lastTechnicalUpdateAt: "2026-08-19T17:45:00-03:00"
  }
] as const;
