import type { ChargerCommand, ChargerTelemetry } from "../domain/admin";
import type { ChargerCommandOutcome } from "../domain/chargerOperations";

export interface AdminChargerCommandRepository {
  submit(command: ChargerCommand): Promise<{ providerCommandId: string; acceptedAt: string }>;
  observe(command: ChargerCommand): Promise<{ outcome: ChargerCommandOutcome; observedAt: string }>;
}

export const demoAdminChargerCommandRepository: AdminChargerCommandRepository = {
  async submit(command) {
    return {
      providerCommandId: `goodwe-${command.id.replace("cmd-", "")}`,
      acceptedAt: new Date().toISOString()
    };
  },
  async observe(command) {
    const observedAt = new Date().toISOString();
    if (command.type === "START_CHARGE" && command.chargerId === "CG-FIAP-05") {
      return {
        observedAt,
        outcome: {
          status: "FAILED",
          failureCode: "START_FAILED",
          failureReason: "O veiculo nao confirmou o handshake com o conector."
        }
      };
    }

    const telemetry: ChargerTelemetry = {
      chargerId: command.chargerId,
      connectorState: command.type === "START_CHARGE" ? "CHARGING" : "AVAILABLE",
      currentPowerKw: command.type === "START_CHARGE" ? 18.6 : 0,
      vehicleConnected: command.type === "START_CHARGE",
      observedAt
    };
    return { observedAt, outcome: { status: "CONFIRMED", telemetry } };
  }
};
