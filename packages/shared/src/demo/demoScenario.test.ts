import { describe, expect, it } from "vitest";
import {
  ChargerCommercialStatus,
  ChargerTechnicalStatus,
  CommercialAvailability,
  CommercialSessionStatus,
  PaymentStatus,
  PlantEnergyStatus,
  QueueStatus,
  UserRole
} from "../enums/index.js";
import { demoScenarioD0 } from "./demoScenario.js";

describe("shared baseline", () => {
  it("preserva os enums oficiais", () => {
    expect(Object.values(UserRole)).toEqual(["GOODWE_ADMIN", "ESTABLISHMENT_ADMIN", "ESTABLISHMENT_OPERATOR", "DRIVER", "GUEST"]);
    expect(Object.values(ChargerTechnicalStatus)).toEqual(["AVAILABLE", "CONNECTED", "STARTING", "CHARGING", "UNAVAILABLE", "FAULT", "OFFLINE"]);
    expect(Object.values(ChargerCommercialStatus)).toEqual(["AVAILABLE_TO_START", "OCCUPIED", "RESTRICTED_BY_ENERGY", "MAINTENANCE", "FAULTED", "CLOSED", "UNKNOWN"]);
    expect(Object.values(CommercialAvailability)).toEqual(["OPEN_AVAILABLE", "OPEN_PARTIAL", "FULL_QUEUE", "CLOSED", "MAINTENANCE", "FAULT"]);
    expect(Object.values(CommercialSessionStatus)).toEqual(["SESSION_CREATED", "AWAITING_PAYMENT", "AUTHORIZED", "WAITING_START", "STARTING", "CHARGING", "SUSPENDED_BY_DEMAND", "ENERGY_FINISHED", "IDLE_GRACE_PERIOD", "IDLE_FEE", "SETTLING", "COMPLETED", "PAYMENT_FAILED", "START_FAILED", "FAULTED", "CANCELLED", "SETTLEMENT_PENDING", "DISPUTED", "OUTSTANDING_BALANCE"]);
    expect(Object.values(PaymentStatus)).toEqual(["PENDING", "AUTHORIZED", "PAID", "REFUND_PENDING", "REFUNDED", "FAILED", "SETTLEMENT_PENDING", "DISPUTED", "OUTSTANDING_BALANCE"]);
    expect(Object.values(QueueStatus)).toEqual(["WAITING", "CALLED", "ASSIGNED", "EXPIRED", "LEFT", "COMPLETED"]);
    expect(Object.values(PlantEnergyStatus)).toEqual(["NORMAL", "ALERT", "CRITICAL"]);
  });

  it("carrega os seis carregadores oficiais de D0", () => {
    expect(demoScenarioD0.chargers).toHaveLength(6);
  });

  it("mantém o balanço energético de D0 em 54 kW", () => {
    const { plant } = demoScenarioD0;
    const supply = plant.pvKw + plant.gridImportKw + (plant.batteryDischargeKw ?? 0);
    const demand = plant.buildingLoadKw + plant.evLoadKw + (plant.batteryChargeKw ?? 0) + (plant.gridExportKw ?? 0);

    expect(supply).toBe(54);
    expect(demand).toBe(54);
    expect(supply).toBe(demand);
  });

  it("usa a potência dos dois carregadores ativos como carga EV", () => {
    const chargingPower = demoScenarioD0.chargers.reduce((sum, charger) => sum + (charger.currentPowerKw ?? 0), 0);
    expect(chargingPower).toBe(demoScenarioD0.plant.evLoadKw);
  });
});
