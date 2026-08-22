import type { AppState, Charger, Establishment, Location } from "./model";

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

const fiapChargers: Charger[] = [
  ["CG-FIAP-01", "FIAP-ACL-01", "charging", 22, 18.4, 54.28],
  ["CG-FIAP-03", "FIAP-ACL-03", "available", 60, 9.8, 28.91],
  ["CG-FIAP-05", "FIAP-ACL-05", "available", 22, 12.6, 37.17]
].map(([id, internalId, status, powerKw, todayEnergyKwh, revenueToday], index) => ({
  id: String(id), establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", identifier: String(id), internalId: String(internalId), serial: `GWFIAP000${index + 1}`, model: "GoodWe AC 22", powerKw: Number(powerKw), installationDate: "2026-01-15", status: status as Charger["status"], todayEnergyKwh: Number(todayEnergyKwh), revenueToday: Number(revenueToday)
}));

export function createInitialState(): AppState {
  return {
    accounts: [
      { id: "acc-goodwe", email: "goodwe@teste.com", password: "teste", profile: "GOODWE", displayName: "Painel Executivo GoodWe" },
      { id: "acc-est-fiap", email: "estabelecimento@teste.com", password: "teste", profile: "ESTABELECIMENTO", displayName: "Gestora FIAP", establishmentId: "est-fiap" },
      { id: "acc-driver", email: "usuario@teste.com", password: "teste", profile: "USUARIO", displayName: "Usuario Demo" }
    ],
    currentAccountId: null,
    clients: [
      { id: "cli-fiap", name: "Rede FIAP", corporateName: "FIAP Eco Smart Group S.A.", document: "12.345.678/0001-90", owner: "Marina Alves", contactName: "Gestora FIAP", contactEmail: "estabelecimento@teste.com", status: "Ativo" },
      { id: "cli-mercadox", name: "Rede MercadoX", corporateName: "MercadoX Mobilidade Ltda.", document: "98.765.432/0001-10", owner: "Rafael Nunes", contactName: "Marina Costa", contactEmail: "operacao@mercadox.com.br", status: "Ativo" },
      { id: "cli-goodwe-global", name: "GoodWe Global Mobility", corporateName: "GoodWe Technologies Co., Ltd.", document: "GLOBAL-GW-001", owner: "Global Operations", contactName: "Global Operations", contactEmail: "global.ops@goodwe.example", status: "Ativo" }
    ],
    establishments,
    locations,
    chargers: [
      ...fiapChargers,
      { id: "CG-MX-01", establishmentId: "est-mercadox", locationId: "loc-mercadox-pinheiros", identifier: "CARREGADORMX01", internalId: "MX-PIN-01", serial: "GWMX0001", model: "GoodWe AC 22", powerKw: 22, installationDate: "2026-03-10", status: "offline", todayEnergyKwh: 4.2, revenueToday: 13.02 },
      { id: "CG-US-01", establishmentId: "est-goodwe-california", locationId: "loc-goodwe-california", identifier: "GW-CALIFORNIA-01", internalId: "US-HUB-01", serial: "GWUS0001", model: "GoodWe DC 80", powerKw: 80, installationDate: "2026-02-18", status: "available", todayEnergyKwh: 31.2, revenueToday: 16.22 },
      { id: "CG-DE-01", establishmentId: "est-goodwe-europe", locationId: "loc-goodwe-europe", identifier: "GW-EUROPE-01", internalId: "DE-CENTER-01", serial: "GWDE0001", model: "GoodWe AC 22", powerKw: 22, installationDate: "2026-04-07", status: "charging", todayEnergyKwh: 24.7, revenueToday: 12.1 },
      { id: "CG-CN-01", establishmentId: "est-goodwe-shanghai", locationId: "loc-goodwe-shanghai", identifier: "GW-SHANGHAI-01", internalId: "CN-LAB-01", serial: "GWCN0001", model: "GoodWe DC 120", powerKw: 120, installationDate: "2026-05-12", status: "available", todayEnergyKwh: 48.9, revenueToday: 38.14 }
    ],
    sessions: [
      { id: "CG-2026-1001", chargerId: "CG-FIAP-02", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverId: "driver-ana", driverName: "Ana Souza", vehicle: "Volvo EX30", status: "active", startedAt: "2026-08-18T17:20:00-03:00", durationMinutes: 40, energyKwh: 13.4, tariffPerKwh: 2.95, consumedAmount: 39.53, payment: { status: "Aprovado", method: "Cartao", limitAmount: 100 } },
      { id: "CG-2026-0998", chargerId: "CG-FIAP-01", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverId: "driver-paulo", driverName: "Paulo Lima", vehicle: "BYD Dolphin", status: "finished", startedAt: "2026-08-18T14:10:00-03:00", durationMinutes: 62, energyKwh: 18.7, tariffPerKwh: 2.95, consumedAmount: 55.17, finalAmount: 55.17, payment: { status: "Aprovado", method: "Pix", limitAmount: 80 } }
    ],
    queue: [
      { id: "Q-001", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverName: "Marcos Silva", vehicle: "GWM Ora 03", status: "waiting" },
      { id: "Q-002", establishmentId: "est-fiap", locationId: "loc-fiap-aclimacao", driverName: "Luiza Prado", vehicle: "Renault Kwid E-Tech", status: "waiting" }
    ],
    supportTickets: [{ id: "ticket-0001", establishmentId: "est-mercadox", code: "SUP-2026-0001", title: "Carregador sem comunicacao", description: "Equipamento offline desde 16:30.", status: "Em atendimento", createdAt: "2026-08-18T16:42:00-03:00" }],
    audit: [{ id: "audit-0001", summary: "Chamado SUP-2026-0001 criado", at: "2026-08-18T16:42:00-03:00" }],
    energy: [
      { establishmentId: "est-fiap", demandState: "Alerta", powerMarginPercent: 24, batterySocPercent: 73, solarPowerKw: 12.4, gridPowerKw: 6.1 },
      { establishmentId: "est-mercadox", demandState: "Crítico", powerMarginPercent: 8, batterySocPercent: 38, solarPowerKw: 3.1, gridPowerKw: 18.7 }
    ]
  };
}
