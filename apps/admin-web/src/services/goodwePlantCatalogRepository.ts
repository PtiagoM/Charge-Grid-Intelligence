import type { AdminState, GoodWePlant } from "../domain/admin";
import { GOODWE_PLANT_CATALOG } from "../fixtures/goodwePlantCatalog";

export interface GoodWePlantCatalogRepository {
  list(): Promise<GoodWePlant[]>;
  inspect(plantId: string): Promise<GoodWePlant | null>;
}

function clonePlant(plant: GoodWePlant): GoodWePlant {
  return { ...plant, evChargers: plant.evChargers.map((charger) => ({ ...charger })) };
}

export function catalogWithCommercialPlants(state: AdminState): GoodWePlant[] {
  const commercial = state.commercialPlants.map((link) => {
    const establishment = state.establishments.find((item) => item.id === link.establishmentId);
    const location = state.locations.find((item) => item.id === link.locationId);
    const energy = state.energy.find((item) => item.establishmentId === link.establishmentId);
    const chargers = state.chargers.filter((item) => item.establishmentId === link.establishmentId);
    return {
      id: link.goodwePlantId,
      source: "COMMERCIAL_API" as const,
      name: establishment?.name ?? link.commercialName,
      organization: "ChargeGrid / GoodWe",
      address: location?.address ?? establishment?.address ?? "",
      number: location?.number ?? "",
      city: location?.city ?? establishment?.city ?? "",
      state: location?.state ?? establishment?.state ?? "",
      zipCode: location?.zipCode ?? "",
      timezone: "America/Sao_Paulo",
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
      capacityKwp: 0,
      batteryCapacityKwh: 0,
      authorization: "AUTHORIZED" as const,
      catalogState: !energy || energy.providerStatus === "OFFLINE" ? "OFFLINE" as const : "READY" as const,
      lastSyncAt: energy?.observedAt,
      evChargers: chargers.map((charger) => ({
        id: charger.id,
        code: charger.identifier,
        serial: charger.identifier,
        model: charger.model,
        powerKw: charger.powerKw,
        technicalStatus: charger.status === "offline" || charger.status === "limited" || charger.status === "fault" ? "OFFLINE" as const : "ONLINE" as const
      }))
    };
  });
  const ids = new Set(commercial.map((item) => item.id));
  return [...GOODWE_PLANT_CATALOG.filter((item) => !ids.has(item.id)).map(clonePlant), ...commercial];
}

export const mockGoodWePlantCatalogRepository: GoodWePlantCatalogRepository = {
  async list() {
    return GOODWE_PLANT_CATALOG.map(clonePlant);
  },
  async inspect(plantId) {
    const plant = GOODWE_PLANT_CATALOG.find((candidate) => candidate.id === plantId);
    return plant ? clonePlant(plant) : null;
  }
};
