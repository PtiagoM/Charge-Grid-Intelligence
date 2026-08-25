import type { AdminState, Charger, CommercialPlantLink, Establishment, Location, SessionEvent } from "../domain/admin";

const establishments: Establishment[] = [
  { id: "est-fiap", clientId: "cli-fiap", name: "Shopping FIAP", city: "Sao Paulo", state: "SP", address: "Av. Lins de Vasconcelos, 1222", pricePerKwh: 2.95, contractCode: "CG-CTR-2026-001" },
  { id: "est-mercadox", clientId: "cli-mercadox", name: "MercadoX Pinheiros", city: "Sao Paulo", state: "SP", address: "Rua dos Pinheiros, 900", pricePerKwh: 3.1, contractCode: "CG-CTR-2026-002" },
  { id: "est-goodwe-california", clientId: "cli-goodwe-global", name: "GoodWe California Hub", city: "San Francisco", state: "CA", address: "Market Street, 1355", pricePerKwh: 0.52, contractCode: "CG-GLOBAL-CA" },
  { id: "est-goodwe-europe", clientId: "cli-goodwe-global", name: "GoodWe Europe Center", city: "Berlin", state: "BE", address: "Alexanderplatz, 4", pricePerKwh: 0.49, contractCode: "CG-GLOBAL-EU" },
  { id: "est-goodwe-shanghai", clientId: "cli-goodwe-global", name: "GoodWe Shanghai Lab", city: "Shanghai", state: "SH", address: "Century Avenue, 100", pricePerKwh: 0.78, contractCode: "CG-GLOBAL-SH" }
];

const locations: Location[] = [
  { id: "loc-fiap-aclimacao", establishmentId: "est-fiap", name: "Hub FIAP Aclimacao", address: "Av. Lins de Vasconcelos", number: "1222", city: "Sao Paulo", state: "SP", zipCode: "01538-001", latitude: -23.5746, longitude: -46.6232, status: "Ativo" },
  { id: "loc-mercadox-pinheiros", establishmentId: "est-mercadox", name: "MercadoX Pinheiros", address: "Rua dos Pinheiros", number: "900", city: "Sao Paulo", state: "SP", zipCode: "05422-001", latitude: -23.5668, longitude: -46.6889, status: "Ativo" },
  { id: "loc-goodwe-california", establishmentId: "est-goodwe-california", name: "GoodWe San Francisco", address: "Market Street", number: "1355", city: "San Francisco", state: "CA", zipCode: "94103", latitude: 37.7749, longitude: -122.4194, status: "Ativo" },
  { id: "loc-goodwe-europe", establishmentId: "est-goodwe-europe", name: "GoodWe Berlin", address: "Alexanderplatz", number: "4", city: "Berlin", state: "BE", zipCode: "10178", latitude: 52.52, longitude: 13.405, status: "Ativo" },
  { id: "loc-goodwe-shanghai", establishmentId: "est-goodwe-shanghai", name: "GoodWe Shanghai", address: "Century Avenue", number: "100", city: "Shanghai", state: "SH", zipCode: "200120", latitude: 31.2304, longitude: 121.4737, status: "Ativo" }
];

const commercialPlants: CommercialPlantLink[] = [
  ["fiap-aclimacao", "gw-plant-fiap-aclimacao", "est-fiap", "loc-fiap-aclimacao", "Hub FIAP Aclimação", "PUBLIC", true],
  ["mercadox-pinheiros", "gw-plant-mercadox-pinheiros", "est-mercadox", "loc-mercadox-pinheiros", "MercadoX Pinheiros", "PUBLIC", false],
  ["goodwe-california", "gw-plant-california", "est-goodwe-california", "loc-goodwe-california", "GoodWe San Francisco", "PRIVATE", true],
  ["goodwe-berlin", "gw-plant-berlin", "est-goodwe-europe", "loc-goodwe-europe", "GoodWe Berlin", "PRIVATE", true],
  ["goodwe-shanghai", "gw-plant-shanghai", "est-goodwe-shanghai", "loc-goodwe-shanghai", "GoodWe Shanghai", "PRIVATE", true]
].map(([id, goodwePlantId, establishmentId, locationId, commercialName, accessPolicy, alwaysOpen]) => ({
  id: `cplant-${id}`,
  goodwePlantId: String(goodwePlantId),
  establishmentId: String(establishmentId),
  locationId: String(locationId),
  commercialName: String(commercialName),
  accessPolicy: accessPolicy as CommercialPlantLink["accessPolicy"],
  alwaysOpen: Boolean(alwaysOpen),
  opensAt: alwaysOpen ? undefined : "07:00",
  closesAt: alwaysOpen ? undefined : "23:00",
  status: "PUBLISHED",
  publishedAt: "2026-08-01T10:00:00-03:00"
}));

const fiapChargers: Charger[] = [
  ["CG-FIAP-01", "FIAP-ACL-01", "charging", 22, 18.4, 54.28],
  ["CG-FIAP-03", "FIAP-ACL-03", "available", 60, 9.8, 28.91],
  ["CG-FIAP-05", "FIAP-ACL-05", "available", 22, 12.6, 37.17]
].map(([id, internalId, status, powerKw, todayEnergyKwh, revenueToday], index) => ({
  id: String(id), establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", identifier: String(id), internalId: String(internalId), serial: `GWFIAP000${index + 1}`, model: "GoodWe AC 22", powerKw: Number(powerKw), installationDate: "2026-01-15", status: status as Charger["status"], publicationStatus: "PUBLISHED", todayEnergyKwh: Number(todayEnergyKwh), revenueToday: Number(revenueToday)
}));

const sessionEvents: SessionEvent[] = [
  { id: "event-1001-payment", sessionId: "CG-2026-1001", type: "PAYMENT_AUTHORIZED", label: "Pagamento autorizado", at: "2026-08-18T17:18:00-03:00", source: "PAYMENT", detail: "Limite autorizado de R$ 100,00" },
  { id: "event-1001-start", sessionId: "CG-2026-1001", type: "START_ACCEPTED", label: "Comando aceito pelo provedor", at: "2026-08-18T17:19:00-03:00", source: "GOODWE" },
  { id: "event-1001-energy", sessionId: "CG-2026-1001", type: "ENERGY_CONFIRMED", label: "Energia confirmada no conector", at: "2026-08-18T17:20:00-03:00", source: "GOODWE", detail: "18,4 kW observados" },
  { id: "event-1001-charging", sessionId: "CG-2026-1001", type: "CHARGING", label: "Recarga em andamento", at: "2026-08-18T17:20:10-03:00", source: "CHARGEGRID" },
  { id: "event-0998-payment", sessionId: "CG-2026-0998", type: "PAYMENT_AUTHORIZED", label: "Pagamento autorizado", at: "2026-08-18T14:08:00-03:00", source: "PAYMENT" },
  { id: "event-0998-energy", sessionId: "CG-2026-0998", type: "ENERGY_CONFIRMED", label: "Energia confirmada no conector", at: "2026-08-18T14:10:00-03:00", source: "GOODWE" },
  { id: "event-0998-finished", sessionId: "CG-2026-0998", type: "ENERGY_FINISHED", label: "Fluxo de energia encerrado", at: "2026-08-18T15:12:00-03:00", source: "GOODWE" },
  { id: "event-0998-captured", sessionId: "CG-2026-0998", type: "PAYMENT_CAPTURED", label: "Pagamento capturado", at: "2026-08-18T15:13:00-03:00", source: "PAYMENT", detail: "R$ 55,17" },
  { id: "event-1002-payment", sessionId: "CG-2026-1002", type: "PAYMENT_AUTHORIZED", label: "Pagamento autorizado", at: "2026-08-18T18:02:00-03:00", source: "PAYMENT", detail: "Aguardando inicio no carregador" },
  { id: "event-1003-payment", sessionId: "CG-2026-1003", type: "PAYMENT_AUTHORIZED", label: "Pagamento autorizado", at: "2026-08-18T18:06:00-03:00", source: "PAYMENT", detail: "Aguardando inicio no carregador" }
];

export function createInitialState(): AdminState {
  const observedAt = new Date().toISOString();
  return {
    accounts: [
      { id: "acc-goodwe", email: "goodwe@teste.com", password: "teste", profile: "GOODWE", semsAccountType: "DISTRIBUTOR_INSTALLER", role: "GOODWE_CENTRAL", semsOrganizationFunction: "ADMINISTRATOR", displayName: "Central GoodWe Brasil", technicalEstablishmentIds: establishments.map((item) => item.id) },
      { id: "acc-goodwe-consultant", email: "consultor@teste.com", password: "teste", profile: "GOODWE", semsAccountType: "DISTRIBUTOR_INSTALLER", role: "GOODWE_PORTFOLIO_MANAGER", semsOrganizationFunction: "NAVIGATOR", displayName: "Consultora GoodWe SP", technicalEstablishmentIds: ["est-fiap", "est-mercadox"] },
      { id: "acc-goodwe-support", email: "suporte@teste.com", password: "teste", profile: "GOODWE", semsAccountType: "DISTRIBUTOR_INSTALLER", role: "GOODWE_TECH_SUPPORT", semsOrganizationFunction: "TECHNICIAN", displayName: "Suporte técnico GoodWe" },
      { id: "acc-sems-installer", email: "instalador@teste.com", password: "teste", profile: "GOODWE", semsAccountType: "DISTRIBUTOR_INSTALLER", semsOrganizationFunction: "ADMINISTRATOR", displayName: "Instaladora Solar SP", technicalEstablishmentIds: ["est-fiap", "est-mercadox"] },
      { id: "acc-est-fiap", email: "estabelecimento@teste.com", password: "teste", profile: "ESTABELECIMENTO", semsAccountType: "OWNER", role: "ESTABLISHMENT_ADMIN", displayName: "Gestora FIAP", establishmentId: "est-fiap" },
      { id: "acc-operator-fiap", email: "operador@teste.com", password: "teste", profile: "ESTABELECIMENTO", semsAccountType: "OWNER", role: "ESTABLISHMENT_OPERATOR", displayName: "Operacao FIAP", establishmentId: "est-fiap" },
      { id: "acc-reports-fiap", email: "relatorios@teste.com", password: "teste", profile: "ESTABELECIMENTO", semsAccountType: "OWNER", role: "REPORT_VIEWER", displayName: "Analista FIAP", establishmentId: "est-fiap" },
      { id: "acc-sems-owner", email: "usuario@teste.com", password: "teste", profile: "ESTABELECIMENTO", semsAccountType: "OWNER", displayName: "Usuário SEMS+", establishmentId: "est-mercadox" }
    ],
    accessGrants: [
      { id: "grant-acc-goodwe-initial", accountId: "acc-goodwe", role: "GOODWE_CENTRAL", establishmentIds: establishments.map((item) => item.id), status: "ACTIVE", grantedAt: "2026-01-01T09:00:00-03:00", grantedBy: "Governança GoodWe" },
      { id: "grant-acc-goodwe-consultant", accountId: "acc-goodwe-consultant", role: "GOODWE_PORTFOLIO_MANAGER", establishmentIds: ["est-fiap", "est-mercadox"], status: "ACTIVE", grantedAt: "2026-01-10T09:00:00-03:00", grantedBy: "Central GoodWe Brasil" },
      { id: "grant-acc-goodwe-support", accountId: "acc-goodwe-support", role: "GOODWE_TECH_SUPPORT", establishmentIds: ["est-fiap", "est-mercadox"], status: "ACTIVE", grantedAt: "2026-01-10T09:10:00-03:00", grantedBy: "Central GoodWe Brasil" },
      { id: "grant-acc-est-fiap-initial", accountId: "acc-est-fiap", role: "ESTABLISHMENT_ADMIN", establishmentIds: ["est-fiap"], status: "ACTIVE", grantedAt: "2026-01-15T09:00:00-03:00", grantedBy: "Consultora GoodWe SP" },
      { id: "grant-acc-operator-fiap-initial", accountId: "acc-operator-fiap", role: "ESTABLISHMENT_OPERATOR", establishmentIds: ["est-fiap"], status: "ACTIVE", grantedAt: "2026-02-01T09:00:00-03:00", grantedBy: "Gestora FIAP" },
      { id: "grant-acc-reports-fiap-initial", accountId: "acc-reports-fiap", role: "REPORT_VIEWER", establishmentIds: ["est-fiap"], status: "ACTIVE", grantedAt: "2026-02-01T09:05:00-03:00", grantedBy: "Gestora FIAP" }
    ],
    currentAccountId: null,
    clients: [
      { id: "cli-fiap", name: "Rede FIAP", corporateName: "FIAP Eco Smart Group S.A.", document: "12.345.678/0001-90", owner: "Marina Alves", contactName: "Gestora FIAP", contactEmail: "estabelecimento@teste.com", status: "Ativo" },
      { id: "cli-mercadox", name: "Rede MercadoX", corporateName: "MercadoX Mobilidade Ltda.", document: "98.765.432/0001-10", owner: "Rafael Nunes", contactName: "Marina Costa", contactEmail: "operacao@mercadox.com.br", status: "Ativo" },
      { id: "cli-goodwe-global", name: "GoodWe Global Mobility", corporateName: "GoodWe Technologies Co., Ltd.", document: "GLOBAL-GW-001", owner: "Global Operations", contactName: "Global Operations", contactEmail: "global.ops@goodwe.example", status: "Ativo" }
    ],
    establishments,
    commercialPlants,
    plantOnboardingDraft: {
      plantId: "",
      establishmentId: "",
      commercialName: "",
      accessPolicy: "PUBLIC",
      alwaysOpen: true,
      opensAt: "08:00",
      closesAt: "22:00",
      updatedAt: ""
    },
    locations,
    chargers: [
      ...fiapChargers,
      { id: "CG-MX-01", establishmentId: "est-mercadox", locationId: "loc-mercadox-pinheiros", identifier: "CARREGADORMX01", internalId: "MX-PIN-01", serial: "GWMX0001", model: "GoodWe AC 22", powerKw: 22, installationDate: "2026-03-10", status: "offline", publicationStatus: "PUBLISHED", todayEnergyKwh: 4.2, revenueToday: 13.02 },
      { id: "CG-US-01", establishmentId: "est-goodwe-california", locationId: "loc-goodwe-california", identifier: "GW-CALIFORNIA-01", internalId: "US-HUB-01", serial: "GWUS0001", model: "GoodWe DC 80", powerKw: 80, installationDate: "2026-02-18", status: "available", publicationStatus: "PUBLISHED", todayEnergyKwh: 31.2, revenueToday: 16.22 },
      { id: "CG-DE-01", establishmentId: "est-goodwe-europe", locationId: "loc-goodwe-europe", identifier: "GW-EUROPE-01", internalId: "DE-CENTER-01", serial: "GWDE0001", model: "GoodWe AC 22", powerKw: 22, installationDate: "2026-04-07", status: "charging", publicationStatus: "PUBLISHED", todayEnergyKwh: 24.7, revenueToday: 12.1 },
      { id: "CG-CN-01", establishmentId: "est-goodwe-shanghai", locationId: "loc-goodwe-shanghai", identifier: "GW-SHANGHAI-01", internalId: "CN-LAB-01", serial: "GWCN0001", model: "GoodWe DC 120", powerKw: 120, installationDate: "2026-05-12", status: "available", publicationStatus: "PUBLISHED", todayEnergyKwh: 48.9, revenueToday: 38.14 }
    ],
    chargerTelemetry: [
      { chargerId: "CG-FIAP-01", connectorState: "CHARGING", currentPowerKw: 18.4, observedAt: "2026-08-18T18:00:00-03:00", vehicleConnected: true },
      { chargerId: "CG-FIAP-03", connectorState: "CONNECTED", currentPowerKw: 0, observedAt: "2026-08-18T18:00:00-03:00", vehicleConnected: true },
      { chargerId: "CG-FIAP-05", connectorState: "CONNECTED", currentPowerKw: 0, observedAt: "2026-08-18T18:00:00-03:00", vehicleConnected: true },
      { chargerId: "CG-MX-01", connectorState: "OFFLINE", currentPowerKw: 0, observedAt: "2026-08-18T16:30:00-03:00", vehicleConnected: false, faultCode: "COMMUNICATION_LOST" },
      { chargerId: "CG-US-01", connectorState: "AVAILABLE", currentPowerKw: 0, observedAt: "2026-08-18T18:00:00-03:00", vehicleConnected: false },
      { chargerId: "CG-DE-01", connectorState: "CHARGING", currentPowerKw: 20.1, observedAt: "2026-08-18T18:00:00-03:00", vehicleConnected: true },
      { chargerId: "CG-CN-01", connectorState: "AVAILABLE", currentPowerKw: 0, observedAt: "2026-08-18T18:00:00-03:00", vehicleConnected: false }
    ],
    chargerCommands: [],
    sessions: [
      { id: "CG-2026-1001", chargerId: "CG-FIAP-01", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverId: "driver-ana", driverName: "Ana Souza", vehicle: "Volvo EX30", status: "active", startedAt: "2026-08-18T17:20:00-03:00", durationMinutes: 40, energyKwh: 13.4, tariffPerKwh: 2.95, consumedAmount: 39.53, payment: { status: "Aprovado", method: "Cartao", limitAmount: 100 }, servicePriority: "STANDARD", tariffPolicyId: "tariff-est-fiap-v1", idleMinutes: 0 },
      { id: "CG-2026-0998", chargerId: "CG-FIAP-01", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverId: "driver-paulo", driverName: "Paulo Lima", vehicle: "BYD Dolphin", status: "finished", startedAt: "2026-08-18T14:10:00-03:00", durationMinutes: 62, energyKwh: 18.7, tariffPerKwh: 2.95, consumedAmount: 55.17, finalAmount: 55.17, payment: { status: "Aprovado", method: "Pix", limitAmount: 80 }, tariffPolicyId: "tariff-est-fiap-v1", idleMinutes: 0 },
      { id: "CG-2026-1002", chargerId: "CG-FIAP-03", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverId: "driver-luiza", driverName: "Luiza Prado", vehicle: "Renault Kwid E-Tech", status: "authorized", startedAt: "2026-08-18T18:02:00-03:00", durationMinutes: 0, energyKwh: 0, tariffPerKwh: 2.95, consumedAmount: 0, payment: { status: "Aprovado", method: "Cartao", limitAmount: 90 }, tariffPolicyId: "tariff-est-fiap-v1", idleMinutes: 0 },
      { id: "CG-2026-1003", chargerId: "CG-FIAP-05", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverId: "driver-marcos", driverName: "Marcos Silva", vehicle: "GWM Ora 03", status: "authorized", startedAt: "2026-08-18T18:06:00-03:00", durationMinutes: 0, energyKwh: 0, tariffPerKwh: 2.95, consumedAmount: 0, payment: { status: "Aprovado", method: "Pix", limitAmount: 75 }, tariffPolicyId: "tariff-est-fiap-v1", idleMinutes: 0 }
    ],
    sessionEvents,
    queue: [
      { id: "Q-001", driverId: "driver-marcos-queue", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverName: "Marcos Silva", vehicle: "GWM Ora 03", requiredConnector: "TYPE_2", status: "waiting", joinedAt: "2026-08-18T17:40:00-03:00" },
      { id: "Q-002", driverId: "driver-luiza-queue", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverName: "Luiza Prado", vehicle: "Renault Kwid E-Tech", requiredConnector: "TYPE_2", status: "waiting", joinedAt: "2026-08-18T17:46:00-03:00" },
      { id: "Q-003", driverId: "driver-chen", establishmentId: "est-goodwe-shanghai", locationId: "loc-goodwe-shanghai", driverName: "Chen Wei", vehicle: "BYD Seal", requiredConnector: "CCS_2", status: "waiting", joinedAt: "2026-08-18T17:51:00-03:00" }
    ],
    queueEvents: [
      { id: "queue-event-Q-001-joined", queueEntryId: "Q-001", establishmentId: "est-fiap", type: "JOINED", label: "Entrada confirmada na fila", at: "2026-08-18T17:40:00-03:00", actor: "DRIVER_PWA", detail: "TYPE_2 · GWM Ora 03" },
      { id: "queue-event-Q-002-joined", queueEntryId: "Q-002", establishmentId: "est-fiap", type: "JOINED", label: "Entrada confirmada na fila", at: "2026-08-18T17:46:00-03:00", actor: "DRIVER_PWA", detail: "TYPE_2 · Renault Kwid E-Tech" },
      { id: "queue-event-Q-003-joined", queueEntryId: "Q-003", establishmentId: "est-goodwe-shanghai", type: "JOINED", label: "Entrada confirmada na fila", at: "2026-08-18T17:51:00-03:00", actor: "DRIVER_PWA", detail: "CCS_2 · BYD Seal" }
    ],
    supportTickets: [{ id: "ticket-0001", establishmentId: "est-mercadox", code: "SUP-2026-0001", title: "Carregador sem comunicacao", description: "Equipamento offline desde 16:30.", status: "Em atendimento", createdAt: "2026-08-18T16:42:00-03:00" }],
    audit: [{ id: "audit-0001", summary: "Chamado SUP-2026-0001 criado", at: "2026-08-18T16:42:00-03:00" }],
    energy: [
      { establishmentId: "est-fiap", demandState: "Alerta", observedAt, providerStatus: "ONLINE", demandKw: 76, contractedLimitKw: 100, powerMarginPercent: 24, batterySocPercent: 73, solarPowerKw: 12.4, gridPowerKw: 6.1, periodSolarKwh: 42.8, periodBatteryKwh: 11.2, periodGridKwh: 38.4 },
      { establishmentId: "est-mercadox", demandState: "Crítico", observedAt, providerStatus: "ONLINE", demandKw: 92, contractedLimitKw: 100, powerMarginPercent: 8, batterySocPercent: 38, solarPowerKw: 3.1, gridPowerKw: 18.7 }
    ],
    energyPolicies: [
      { establishmentId: "est-fiap", alertUtilizationPercent: 70, criticalUtilizationPercent: 90, freshnessMinutes: 15, blockStartOnCritical: true, blockStartWithoutFreshTelemetry: true },
      { establishmentId: "est-mercadox", alertUtilizationPercent: 80, criticalUtilizationPercent: 90, freshnessMinutes: 15, blockStartOnCritical: true, blockStartWithoutFreshTelemetry: true }
    ],
    tariffPolicies: [
      { id: "tariff-est-fiap-v1", establishmentId: "est-fiap", version: 1, status: "ACTIVE", energyPriceCentsPerKwh: 295, idlePriceCentsPerMinute: 50, idleGraceMinutes: 10, platformShareBps: 600, effectiveFrom: "2026-01-15T00:00:00-03:00", createdAt: "2026-01-10T10:00:00-03:00", createdBy: "Comercial GoodWe", changeReason: "Condicoes comerciais iniciais" },
      { id: "tariff-est-mercadox-v1", establishmentId: "est-mercadox", version: 1, status: "ACTIVE", energyPriceCentsPerKwh: 310, idlePriceCentsPerMinute: 65, idleGraceMinutes: 8, platformShareBps: 750, effectiveFrom: "2026-03-10T00:00:00-03:00", createdAt: "2026-03-05T10:00:00-03:00", createdBy: "Comercial GoodWe", changeReason: "Condicoes comerciais iniciais" }
    ],
    paymentTransactions: [
      { id: "pay-CG-2026-1001", sessionId: "CG-2026-1001", establishmentId: "est-fiap", tariffPolicyId: "tariff-est-fiap-v1", provider: "STRIPE_SANDBOX", providerReference: "pi_demo_1001", currency: "BRL", status: "AUTHORIZED", settlementStatus: "PENDING", authorizedCents: 10000, capturedCents: 0, refundedCents: 0, providerFeeCents: 0, platformShareBps: 600, createdAt: "2026-08-18T17:18:00-03:00" },
      { id: "pay-CG-2026-0998", sessionId: "CG-2026-0998", establishmentId: "est-fiap", tariffPolicyId: "tariff-est-fiap-v1", provider: "STRIPE_SANDBOX", providerReference: "pi_demo_0998", currency: "BRL", status: "CAPTURED", settlementStatus: "AVAILABLE", authorizedCents: 8000, capturedCents: 5517, refundedCents: 0, providerFeeCents: 180, platformShareBps: 600, createdAt: "2026-08-18T14:08:00-03:00", capturedAt: "2026-08-18T15:13:00-03:00" },
      { id: "pay-CG-2026-1002", sessionId: "CG-2026-1002", establishmentId: "est-fiap", tariffPolicyId: "tariff-est-fiap-v1", provider: "STRIPE_SANDBOX", providerReference: "pi_demo_1002", currency: "BRL", status: "AUTHORIZED", settlementStatus: "PENDING", authorizedCents: 9000, capturedCents: 0, refundedCents: 0, providerFeeCents: 0, platformShareBps: 600, createdAt: "2026-08-18T18:02:00-03:00" },
      { id: "pay-CG-2026-1003", sessionId: "CG-2026-1003", establishmentId: "est-fiap", tariffPolicyId: "tariff-est-fiap-v1", provider: "STRIPE_SANDBOX", providerReference: "pi_demo_1003", currency: "BRL", status: "AUTHORIZED", settlementStatus: "PENDING", authorizedCents: 7500, capturedCents: 0, refundedCents: 0, providerFeeCents: 0, platformShareBps: 600, createdAt: "2026-08-18T18:06:00-03:00" }
    ],
    financialEvents: [
      { id: "financial-authorized-1001", transactionId: "pay-CG-2026-1001", type: "AUTHORIZED", at: "2026-08-18T17:18:00-03:00", actor: "STRIPE_SANDBOX", amountCents: 10000 },
      { id: "financial-authorized-0998", transactionId: "pay-CG-2026-0998", type: "AUTHORIZED", at: "2026-08-18T14:08:00-03:00", actor: "STRIPE_SANDBOX", amountCents: 8000 },
      { id: "financial-captured-0998", transactionId: "pay-CG-2026-0998", type: "CAPTURED", at: "2026-08-18T15:13:00-03:00", actor: "STRIPE_SANDBOX", amountCents: 5517 }
    ],
    incidents: [
      { id: "incident-goodwe-CG-MX-01-offline", establishmentId: "est-mercadox", locationId: "loc-mercadox-pinheiros", chargerId: "CG-MX-01", source: "GOODWE", sourceEventId: "CG-MX-01-2026-08-18T16:30:00-03:00", correlationKey: "charger-CG-MX-01-availability", category: "COMMUNICATION", severity: "HIGH", status: "OPEN", title: "CG-MX-01 offline", summary: "GoodWe reportou COMMUNICATION_LOST.", occurrences: 1, createdAt: "2026-08-18T16:30:00-03:00", updatedAt: "2026-08-18T16:30:00-03:00" }
    ],
    incidentEvents: [
      { id: "incident-event-CG-MX-01-created", incidentId: "incident-goodwe-CG-MX-01-offline", sourceEventId: "CG-MX-01-2026-08-18T16:30:00-03:00", type: "CREATED", at: "2026-08-18T16:30:00-03:00", actor: "GOODWE", detail: "GoodWe reportou COMMUNICATION_LOST." }
    ],
    recommendations: [
      { id: "rec-incident-goodwe-CG-MX-01-offline", establishmentId: "est-mercadox", incidentId: "incident-goodwe-CG-MX-01-offline", title: "Investigar equipamento afetado", rationale: "GoodWe reportou COMMUNICATION_LOST.", evidence: ["Origem GOODWE.", "1 ocorrencia correlacionada.", "Severidade HIGH."], expectedImpact: "Reduzir indisponibilidade e evitar novas sessoes afetadas.", proposedAction: "OPEN_CHARGER", targetId: "CG-MX-01", confidence: "HIGH", deterministic: true, status: "OPEN", createdAt: "2026-08-18T16:30:00-03:00" },
      { id: "rec-energy-est-fiap", establishmentId: "est-fiap", title: "Monitorar margem antes da proxima admissao", rationale: "Margem reduzida; monitorar antes de ampliar a carga.", evidence: ["76,0 kW de 100,0 kW contratados.", "Limiar critico em 90%."], expectedImpact: "Preservar a operacao dentro da politica energetica.", proposedAction: "OPEN_ENERGY", targetId: "est-fiap", confidence: "MEDIUM", deterministic: true, status: "OPEN", createdAt: observedAt }
    ],
    reportJobs: [
      { id: "report-incidents-demo-failed", type: "INCIDENTS", requestedBy: "acc-goodwe", establishmentIds: ["est-mercadox"], periodFrom: "2026-08-01", periodTo: "2026-08-18", status: "FAILED", requestedAt: "2026-08-18T17:00:00-03:00", completedAt: "2026-08-18T17:00:04-03:00", failureReason: "Provider de armazenamento indisponivel na tentativa inicial." }
    ],
    reportSubscriptions: [
      { id: "subscription-acc-est-fiap-sessions", accountId: "acc-est-fiap", type: "SESSIONS", establishmentIds: ["est-fiap"], cadence: "WEEKLY", status: "PAUSED", updatedAt: "2026-08-18T17:00:00-03:00" }
    ]
  };
}
