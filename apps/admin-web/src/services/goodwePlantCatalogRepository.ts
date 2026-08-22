import type { GoodWePlant } from "../domain/admin";
import { GOODWE_PLANT_CATALOG } from "../fixtures/goodwePlantCatalog";

export interface GoodWePlantCatalogRepository {
  list(): Promise<GoodWePlant[]>;
  inspect(plantId: string): Promise<GoodWePlant | null>;
}

function clonePlant(plant: GoodWePlant): GoodWePlant {
  return { ...plant, evChargers: plant.evChargers.map((charger) => ({ ...charger })) };
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
