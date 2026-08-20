import {
  ChargerCommercialStatus,
  ChargerTechnicalStatus,
  CommercialSessionStatus,
  PaymentStatus,
  PlantEnergyStatus,
  demoScenarioD0
} from "@chargegrid/shared";

export interface AdminMapPlant {
  id: string;
  name: string;
  address: string;
  position: { lat: number; lng: number };
  energyStatus: PlantEnergyStatus;
  availableChargers: number;
  chargerCount: number;
  commercialStatus: string;
  observedAt: string;
}

/**
 * Posição de cidade usada exclusivamente para tornar o cenário sintético D0
 * visível no mapa. A integração SEMS+ substituirá este ponto por coordenadas
 * autorizadas da planta, sem alterar a projeção consumida pelo Admin.
 */
export const adminMapPlantsD0: readonly AdminMapPlant[] = [
  {
    id: demoScenarioD0.plant.plantId,
    name: demoScenarioD0.establishment.name,
    address: demoScenarioD0.establishment.address ?? "Localização não informada",
    position: { lat: -23.55052, lng: -46.63331 },
    energyStatus: demoScenarioD0.plant.energyStatus,
    availableChargers: demoScenarioD0.establishment.availableChargerCount,
    chargerCount: demoScenarioD0.chargers.length,
    commercialStatus: demoScenarioD0.establishment.commercialAvailability,
    observedAt: demoScenarioD0.plant.observedAt
  }
] as const;

export const technicalStatusLabel: Record<ChargerTechnicalStatus, string> = {
  AVAILABLE: "Disponível",
  CONNECTED: "Conectado",
  STARTING: "Iniciando",
  CHARGING: "Carregando",
  UNAVAILABLE: "Indisponível",
  FAULT: "Falha",
  OFFLINE: "Offline"
};

export const commercialStatusLabel: Record<ChargerCommercialStatus, string> = {
  AVAILABLE_TO_START: "Disponível",
  OCCUPIED: "Ocupado",
  RESTRICTED_BY_ENERGY: "Restrito por energia",
  MAINTENANCE: "Manutenção",
  FAULTED: "Falha",
  CLOSED: "Fechado",
  UNKNOWN: "Sem confirmação"
};

export const sessionStatusLabel: Record<CommercialSessionStatus, string> = {
  SESSION_CREATED: "Criada",
  AWAITING_PAYMENT: "Aguardando pagamento",
  AUTHORIZED: "Garantia aprovada",
  WAITING_START: "Aguardando início",
  STARTING: "Iniciando",
  CHARGING: "Carregando",
  SUSPENDED_BY_DEMAND: "Suspensa por demanda",
  ENERGY_FINISHED: "Energia finalizada",
  IDLE_GRACE_PERIOD: "Tolerância de ociosidade",
  IDLE_FEE: "Ociosidade cobrada",
  SETTLING: "Liquidando",
  COMPLETED: "Concluída",
  PAYMENT_FAILED: "Pagamento falhou",
  START_FAILED: "Início falhou",
  FAULTED: "Falha técnica",
  CANCELLED: "Cancelada",
  SETTLEMENT_PENDING: "Liquidação pendente",
  DISPUTED: "Em disputa",
  OUTSTANDING_BALANCE: "Saldo pendente"
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Pendente",
  AUTHORIZED: "Autorizado",
  PAID: "Pago",
  REFUND_PENDING: "Devolução pendente",
  REFUNDED: "Devolvido",
  FAILED: "Falhou",
  SETTLEMENT_PENDING: "Liquidação pendente",
  DISPUTED: "Em disputa",
  OUTSTANDING_BALANCE: "Saldo pendente"
};

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function shortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export { demoScenarioD0 };
