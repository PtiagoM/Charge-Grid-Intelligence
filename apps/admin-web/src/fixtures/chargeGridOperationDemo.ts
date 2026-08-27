import type { Charger, ChargerTelemetry, Session } from "../domain/admin";

export interface ChargeGridOperationScenario {
  chargers: Charger[];
  telemetry: ChargerTelemetry[];
  sessions: Session[];
}

interface ScenarioSource {
  chargers: Charger[];
  telemetry: ChargerTelemetry[];
  sessions: Session[];
}

const demoObservedAt = "2026-08-18T18:10:00-03:00";

export function buildFullOccupancyScenario(source: ScenarioSource, establishmentId: string): ChargeGridOperationScenario {
  const chargers = source.chargers.filter((item) => item.establishmentId === establishmentId).map((item) => ({ ...item }));
  const chargerIds = new Set(chargers.map((item) => item.id));
  const telemetry = source.telemetry.filter((item) => chargerIds.has(item.chargerId)).map((item) => ({
    ...item,
    connectorState: item.connectorState === "AVAILABLE" ? "CONNECTED" as const : item.connectorState,
    vehicleConnected: true
  }));
  const sessions = source.sessions.filter((item) => chargerIds.has(item.chargerId)).map((item) => ({ ...item, payment: { ...item.payment } }));
  const template = chargers[0];

  if (!template || establishmentId !== "est-fiap") return { chargers, telemetry, sessions };

  const extras = [
    { suffix: "06", status: "charging" as const, connectorState: "CHARGING" as const, currentPowerKw: 16.8 },
    { suffix: "07", status: "available" as const, connectorState: "CONNECTED" as const, currentPowerKw: 0 },
    { suffix: "08", status: "available" as const, connectorState: "CONNECTED" as const, currentPowerKw: 0 }
  ];

  for (const extra of extras) {
    const chargerId = `CG-FIAP-${extra.suffix}`;
    chargers.push({
      ...template,
      id: chargerId,
      identifier: chargerId,
      internalId: `FIAP-ACL-${extra.suffix}`,
      serial: `GWFIAP00${extra.suffix}`,
      status: extra.status,
      todayEnergyKwh: extra.currentPowerKw,
      revenueToday: extra.currentPowerKw * 2.95
    });
    telemetry.push({
      chargerId,
      connectorState: extra.connectorState,
      currentPowerKw: extra.currentPowerKw,
      observedAt: demoObservedAt,
      vehicleConnected: true
    });
  }

  sessions.push(
    { id: "CG-2026-2006", chargerId: "CG-FIAP-06", establishmentId, locationId: template.locationId, driverId: "driver-demo-06", driverName: "Demonstração A06", vehicle: "EV A06", status: "active", startedAt: "2026-08-18T18:00:00-03:00", durationMinutes: 10, energyKwh: 2.8, tariffPerKwh: 2.95, consumedAmount: 8.26, payment: { status: "Aprovado", method: "Cartao", limitAmount: 80 }, tariffPolicyId: "tariff-est-fiap-v1", idleMinutes: 0 },
    { id: "CG-2026-2007", chargerId: "CG-FIAP-07", establishmentId, locationId: template.locationId, driverId: "driver-demo-07", driverName: "Demonstração A07", vehicle: "EV A07", status: "authorized", startedAt: "2026-08-18T18:08:00-03:00", durationMinutes: 0, energyKwh: 0, tariffPerKwh: 2.95, consumedAmount: 0, payment: { status: "Aprovado", method: "Pix", limitAmount: 80 }, tariffPolicyId: "tariff-est-fiap-v1", idleMinutes: 0 },
    { id: "CG-2026-2008", chargerId: "CG-FIAP-08", establishmentId, locationId: template.locationId, driverId: "driver-demo-08", driverName: "Demonstração A08", vehicle: "EV A08", status: "authorized", startedAt: "2026-08-18T18:09:00-03:00", durationMinutes: 0, energyKwh: 0, tariffPerKwh: 2.95, consumedAmount: 0, payment: { status: "Aprovado", method: "Pix", limitAmount: 80 }, tariffPolicyId: "tariff-est-fiap-v1", idleMinutes: 0 }
  );

  return { chargers, telemetry, sessions };
}
