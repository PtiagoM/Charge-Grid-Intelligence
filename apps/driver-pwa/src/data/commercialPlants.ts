import {
  ChargerCommercialStatus,
  ChargerTechnicalStatus,
  CommercialAvailability,
  type ChargerSummary,
  type EstablishmentSummary
} from "@chargegrid/shared";
import { assets } from "../constants/assets";

export interface CommercialPlant extends EstablishmentSummary {
  position: { lat: number; lng: number };
  chargerCount: number;
  nominalPowerKw: number;
  imageUrl: string;
  category: string;
  qrSlug: string;
  chargers: ChargerSummary[];
}

interface PlantSeed {
  id: string;
  name: string;
  address: string;
  position: { lat: number; lng: number };
  available: number;
  total: number;
  queued: number;
  wait?: number;
  tariff: number;
  power: number;
  distance: number;
  openingHours: string;
  category: string;
  qrSlug: string;
}

function createPlant(seed: PlantSeed): CommercialPlant {
  const commercialAvailability = seed.available === 0
    ? CommercialAvailability.FULL_QUEUE
    : seed.available === seed.total
      ? CommercialAvailability.OPEN_AVAILABLE
      : CommercialAvailability.OPEN_PARTIAL;
  const prefix = seed.name.split(" ").filter((word) => word.length > 2).slice(-1)[0] ?? "Carga";
  const qrChargerNumber = Number(seed.qrSlug.match(/-(\d+)$/)?.[1] ?? 1);
  const qrChargerIndex = Math.min(seed.total - 1, Math.max(0, qrChargerNumber - 1));
  const availableIndexes = new Set<number>();
  if (seed.available > 0) availableIndexes.add(qrChargerIndex);
  for (let index = 0; index < seed.total && availableIndexes.size < seed.available; index += 1) availableIndexes.add(index);
  const chargers = Array.from({ length: seed.total }, (_, index): ChargerSummary => {
    const commercialStatus = availableIndexes.has(index)
      ? ChargerCommercialStatus.AVAILABLE_TO_START
      : index === seed.total - 1 && seed.total > 5
        ? ChargerCommercialStatus.MAINTENANCE
        : ChargerCommercialStatus.OCCUPIED;
    return {
      id: `${seed.id}_charger_${String(index + 1).padStart(2, "0")}`,
      commercialName: `${prefix} ${String(index + 1).padStart(2, "0")}`,
      technicalStatus: commercialStatus === ChargerCommercialStatus.AVAILABLE_TO_START
        ? ChargerTechnicalStatus.AVAILABLE
        : commercialStatus === ChargerCommercialStatus.MAINTENANCE
          ? ChargerTechnicalStatus.UNAVAILABLE
          : ChargerTechnicalStatus.CONNECTED,
      commercialStatus,
      nominalPowerKw: seed.power,
      parkingSpot: `${String.fromCharCode(65 + (index % 4))}${String(index + 1).padStart(2, "0")}`
    };
  });

  return {
    id: seed.id,
    name: seed.name,
    address: seed.address,
    timezone: "America/Sao_Paulo",
    openingHours: seed.openingHours,
    distanceKm: seed.distance,
    commercialAvailability,
    availableChargerCount: seed.available,
    tariffFrom: { amount: seed.tariff, currency: "BRL" },
    favorableEnergyCondition: seed.available > 0,
    queueSummary: {
      establishmentId: seed.id,
      activeCount: seed.queued,
      commercialAvailability,
      estimatedWaitMinutes: seed.wait,
      registeredCount: seed.queued
    },
    position: seed.position,
    chargerCount: seed.total,
    nominalPowerKw: seed.power,
    imageUrl: assets.plant,
    category: seed.category,
    qrSlug: seed.qrSlug,
    chargers
  };
}

export const commercialPlants: readonly CommercialPlant[] = [
  createPlant({
    id: "est_aurora_001",
    name: "Hub Solar Aurora",
    address: "Av. Mercúrio, 420 · Centro, São Paulo",
    position: { lat: -23.55052, lng: -46.633308 },
    available: 2,
    total: 6,
    queued: 0,
    tariff: 1.9,
    power: 7,
    distance: 2.4,
    openingHours: "08:00–22:00",
    category: "Hub solar",
    qrSlug: "aurora-04"
  }),
  createPlant({
    id: "est_parque_norte_002",
    name: "Shopping Parque Norte",
    address: "Av. Otto Baumgart, 680 · Vila Guilherme, São Paulo",
    position: { lat: -23.4829, lng: -46.6418 },
    available: 5,
    total: 8,
    queued: 0,
    tariff: 1.79,
    power: 22,
    distance: 4.8,
    openingHours: "07:00–23:00",
    category: "Shopping center",
    qrSlug: "parque-norte-01"
  }),
  createPlant({
    id: "est_pinheiros_003",
    name: "Mercado GoodLife Pinheiros",
    address: "R. dos Pinheiros, 985 · Pinheiros, São Paulo",
    position: { lat: -23.5665, lng: -46.6907 },
    available: 3,
    total: 4,
    queued: 0,
    tariff: 1.65,
    power: 11,
    distance: 5.6,
    openingHours: "06:00–00:00",
    category: "Varejo",
    qrSlug: "goodlife-pinheiros-02"
  }),
  createPlant({
    id: "est_paulista_004",
    name: "Centro Empresarial Paulista",
    address: "Al. Santos, 1550 · Bela Vista, São Paulo",
    position: { lat: -23.5708, lng: -46.6451 },
    available: 0,
    total: 10,
    queued: 4,
    wait: 24,
    tariff: 2.1,
    power: 22,
    distance: 3.1,
    openingHours: "24 horas",
    category: "Centro empresarial",
    qrSlug: "empresarial-paulista-03"
  }),
  createPlant({
    id: "est_connect_005",
    name: "Hotel Aeroporto Connect",
    address: "Rod. Hélio Smidt, 1180 · Guarulhos",
    position: { lat: -23.4321, lng: -46.4679 },
    available: 4,
    total: 6,
    queued: 0,
    tariff: 2.25,
    power: 22,
    distance: 18.7,
    openingHours: "24 horas",
    category: "Hotel",
    qrSlug: "aeroporto-connect-01"
  }),
  createPlant({
    id: "est_abc_006",
    name: "Estação Solar ABC",
    address: "Av. Pereira Barreto, 1420 · Santo André",
    position: { lat: -23.6738, lng: -46.5437 },
    available: 6,
    total: 12,
    queued: 1,
    wait: 8,
    tariff: 1.72,
    power: 60,
    distance: 17.2,
    openingHours: "05:00–01:00",
    category: "Eletroposto",
    qrSlug: "estacao-solar-abc-04"
  })
];

export function getPlantById(id?: string | null) {
  return commercialPlants.find((plant) => plant.id === id);
}

export function getChargingPointBySlug(slug?: string | null) {
  const plant = commercialPlants.find((item) => item.qrSlug === slug);
  if (!plant) return null;
  const chargerNumber = Number(slug?.match(/-(\d+)$/)?.[1] ?? 1);
  const charger = plant.chargers[chargerNumber - 1] ?? plant.chargers[0];
  return charger ? { plant, charger } : null;
}

export function distanceBetweenKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const radius = 6371;
  const toRadians = (value: number) => value * Math.PI / 180;
  const latDelta = toRadians(to.lat - from.lat);
  const lngDelta = toRadians(to.lng - from.lng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(lngDelta / 2) ** 2;
  return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
