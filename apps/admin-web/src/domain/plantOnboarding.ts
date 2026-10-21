import type {
  AdminState,
  CommercialPlantLink,
  GoodWePlant,
  PlantOnboardingDraft,
  PlantOnboardingIssue,
  PlantOnboardingPublishResult
} from "./admin";

export function createEmptyPlantOnboardingDraft(): PlantOnboardingDraft {
  return {
    plantId: "",
    establishmentId: "",
    commercialName: "",
    accessPolicy: "PUBLIC",
    alwaysOpen: true,
    opensAt: "08:00",
    closesAt: "22:00",
    updatedAt: ""
  };
}

export function validatePlantOnboarding(
  state: AdminState,
  catalog: readonly GoodWePlant[],
  draft: PlantOnboardingDraft
): PlantOnboardingIssue[] {
  const issues: PlantOnboardingIssue[] = [];
  const plant = catalog.find((candidate) => candidate.id === draft.plantId);

  if (!draft.plantId) issues.push({ code: "PLANT_REQUIRED", message: "Selecione uma planta do catálogo GoodWe." });
  else if (!plant) issues.push({ code: "PLANT_NOT_FOUND", message: "A planta selecionada não está mais disponível no catálogo." });
  else {
    if (plant.authorization !== "AUTHORIZED") issues.push({ code: "PLANT_NOT_AUTHORIZED", message: "Sua organização não possui autorização para vincular esta planta." });
    if (plant.catalogState !== "READY") issues.push({ code: "PLANT_NOT_READY", message: "A planta ainda não possui dados técnicos suficientes para publicação." });
    if (plant.evChargers.length === 0) issues.push({ code: "PLANT_WITHOUT_EV", message: "Nenhum carregador EV foi detectado nesta planta." });
    if (state.commercialPlants.some((link) => link.goodwePlantId === plant.id)) issues.push({ code: "PLANT_ALREADY_LINKED", message: "Esta planta já possui vínculo comercial publicado." });
  }

  if (!draft.establishmentId) issues.push({ code: "ESTABLISHMENT_REQUIRED", message: "Selecione o estabelecimento responsável pela operação comercial." });
  else if (!state.establishments.some((item) => item.id === draft.establishmentId)) issues.push({ code: "ESTABLISHMENT_NOT_FOUND", message: "O estabelecimento selecionado não foi encontrado." });

  if (!draft.commercialName.trim()) issues.push({ code: "COMMERCIAL_NAME_REQUIRED", message: "Informe o nome comercial exibido no ChargeGrid." });
  if (!draft.alwaysOpen && (!draft.opensAt || !draft.closesAt || draft.opensAt >= draft.closesAt)) {
    issues.push({ code: "OPERATING_HOURS_INVALID", message: "O horário de fechamento deve ser posterior ao horário de abertura." });
  }

  return issues;
}

export function publishPlantOnboarding(
  state: AdminState,
  catalog: readonly GoodWePlant[],
  draft: PlantOnboardingDraft,
  publishedAt = new Date().toISOString()
): { state: AdminState; result: PlantOnboardingPublishResult } {
  const issues = validatePlantOnboarding(state, catalog, draft);
  if (issues.length) return { state, result: { ok: false, issues } };

  const plant = catalog.find((candidate) => candidate.id === draft.plantId)!;
  const locationId = `loc-${plant.id}`;
  const commercialPlantId = `cplant-${plant.id}`;
  const link: CommercialPlantLink = {
    id: commercialPlantId,
    goodwePlantId: plant.id,
    establishmentId: draft.establishmentId,
    locationId,
    commercialName: draft.commercialName.trim(),
    accessPolicy: draft.accessPolicy,
    alwaysOpen: draft.alwaysOpen,
    opensAt: draft.alwaysOpen ? undefined : draft.opensAt,
    closesAt: draft.alwaysOpen ? undefined : draft.closesAt,
    status: "PUBLISHED",
    publishedAt
  };

  return {
    state: {
      ...state,
      commercialPlants: [...state.commercialPlants, link],
      plantOnboardingDraft: createEmptyPlantOnboardingDraft(),
      locations: [...state.locations, {
        id: locationId,
        establishmentId: draft.establishmentId,
        name: draft.commercialName.trim(),
        address: plant.address,
        number: plant.number,
        city: plant.city,
        state: plant.state,
        zipCode: plant.zipCode,
        latitude: plant.latitude,
        longitude: plant.longitude,
        status: "Ativo"
      }],
      chargers: [...state.chargers, ...plant.evChargers.map((charger) => ({
        id: charger.id,
        establishmentId: draft.establishmentId,
        locationId,
        identifier: charger.id,
        internalId: charger.id,
        serial: charger.serial,
        model: charger.model,
        powerKw: charger.powerKw,
        installationDate: publishedAt.slice(0, 10),
        status: charger.technicalStatus === "ONLINE" ? "available" as const : "offline" as const,
        publicationStatus: "ELIGIBLE" as const,
        todayEnergyKwh: 0,
        revenueToday: 0
      }))],
      audit: [...state.audit, {
        id: `audit-plant-${commercialPlantId}`,
        summary: `Planta ${plant.name} vinculada; ${plant.evChargers.length} carregador(es) aguardam configuracao comercial`,
        at: publishedAt
      }]
    },
    result: { ok: true, issues: [], commercialPlantId }
  };
}
