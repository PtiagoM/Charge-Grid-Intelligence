import { CommercialAvailability } from "@chargegrid/shared";
import type { CommercialPlant } from "./commercialPlants";

const availabilityRank: Record<CommercialAvailability, number> = {
  [CommercialAvailability.OPEN_AVAILABLE]: 3,
  [CommercialAvailability.OPEN_PARTIAL]: 2,
  [CommercialAvailability.FULL_QUEUE]: 1,
  [CommercialAvailability.CLOSED]: 0,
  [CommercialAvailability.MAINTENANCE]: 0,
  [CommercialAvailability.FAULT]: 0
};

export interface PlantRecommendation {
  plant: CommercialPlant;
  reason: string;
}

function waitMinutes(plant: CommercialPlant) {
  return plant.queueSummary.estimatedWaitMinutes ?? (plant.queueSummary.activeCount ? 60 : 0);
}

export function recommendedPlants(plants: readonly CommercialPlant[], limit = 3): PlantRecommendation[] {
  const eligible = plants.filter((plant) => availabilityRank[plant.commercialAvailability] > 1 && plant.availableChargerCount > 0);
  const ranked = [...eligible].sort((a, b) => {
    const availabilityDifference = availabilityRank[b.commercialAvailability] - availabilityRank[a.commercialAvailability];
    if (availabilityDifference) return availabilityDifference;
    const queueDifference = a.queueSummary.activeCount - b.queueSummary.activeCount;
    if (queueDifference) return queueDifference;
    const waitDifference = waitMinutes(a) - waitMinutes(b);
    if (waitDifference) return waitDifference;
    const distanceDifference = (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
    if (distanceDifference) return distanceDifference;
    const powerDifference = b.nominalPowerKw - a.nominalPowerKw;
    if (powerDifference) return powerDifference;
    const tariffDifference = (a.tariffFrom?.amount ?? Number.POSITIVE_INFINITY) - (b.tariffFrom?.amount ?? Number.POSITIVE_INFINITY);
    if (tariffDifference) return tariffDifference;
    return Number(b.favorableEnergyCondition) - Number(a.favorableEnergyCondition);
  });

  const cheapest = eligible.reduce<CommercialPlant | null>((best, plant) => !best || (plant.tariffFrom?.amount ?? Infinity) < (best.tariffFrom?.amount ?? Infinity) ? plant : best, null);
  const nearest = eligible.reduce<CommercialPlant | null>((best, plant) => !best || (plant.distanceKm ?? Infinity) < (best.distanceKm ?? Infinity) ? plant : best, null);
  const mostPowerful = eligible.reduce<CommercialPlant | null>((best, plant) => !best || plant.nominalPowerKw > best.nominalPowerKw ? plant : best, null);

  return ranked.slice(0, limit).map((plant, index) => ({
    plant,
    reason: index === 0
      ? "Melhor opção"
      : plant.id === cheapest?.id
        ? "Melhor tarifa"
        : plant.id === nearest?.id
          ? "Mais próximo"
          : plant.id === mostPowerful?.id
            ? "Maior potência"
            : "Mais próximo"
  }));
}
