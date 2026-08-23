import type { GoodWePlant } from "../domain/admin";

export const GOODWE_PLANT_CATALOG: readonly GoodWePlant[] = [
  {
    id: "gw-plant-fiap-aclimacao", name: "FIAP Aclimação", organization: "GoodWe Brasil",
    address: "Av. Lins de Vasconcelos", number: "1222", city: "São Paulo", state: "SP", zipCode: "01538-001",
    timezone: "America/Sao_Paulo", latitude: -23.5746, longitude: -46.6232, capacityKwp: 92, batteryCapacityKwh: 64,
    authorization: "AUTHORIZED", catalogState: "READY", lastSyncAt: "2026-08-22T09:38:00-03:00",
    evChargers: [
      { id: "CG-FIAP-01", serial: "GWFIAP0001", model: "GoodWe AC 22", powerKw: 22, technicalStatus: "ONLINE" },
      { id: "CG-FIAP-03", serial: "GWFIAP0002", model: "GoodWe DC 60", powerKw: 60, technicalStatus: "ONLINE" },
      { id: "CG-FIAP-05", serial: "GWFIAP0003", model: "GoodWe AC 22", powerKw: 22, technicalStatus: "ONLINE" }
    ]
  },
  {
    id: "gw-plant-mercadox-pinheiros", name: "MercadoX Pinheiros", organization: "GoodWe Brasil",
    address: "Rua dos Pinheiros", number: "900", city: "São Paulo", state: "SP", zipCode: "05422-001",
    timezone: "America/Sao_Paulo", latitude: -23.5668, longitude: -46.6889, capacityKwp: 48, batteryCapacityKwh: 32,
    authorization: "AUTHORIZED", catalogState: "READY", lastSyncAt: "2026-08-22T09:35:00-03:00",
    evChargers: [{ id: "CG-MX-01", serial: "GWMX0001", model: "GoodWe AC 22", powerKw: 22, technicalStatus: "OFFLINE" }]
  },
  {
    id: "gw-plant-california", name: "GoodWe California Hub", organization: "GoodWe Americas",
    address: "Market Street", number: "1355", city: "San Francisco", state: "CA", zipCode: "94103",
    timezone: "America/Los_Angeles", latitude: 37.7749, longitude: -122.4194, capacityKwp: 130, batteryCapacityKwh: 96,
    authorization: "AUTHORIZED", catalogState: "READY", lastSyncAt: "2026-08-22T05:31:00-07:00",
    evChargers: [{ id: "CG-US-01", serial: "GWUS0001", model: "GoodWe DC 80", powerKw: 80, technicalStatus: "ONLINE" }]
  },
  {
    id: "gw-plant-berlin", name: "GoodWe Europe Center", organization: "GoodWe Europe",
    address: "Alexanderplatz", number: "4", city: "Berlin", state: "BE", zipCode: "10178",
    timezone: "Europe/Berlin", latitude: 52.52, longitude: 13.405, capacityKwp: 76, batteryCapacityKwh: 48,
    authorization: "AUTHORIZED", catalogState: "READY", lastSyncAt: "2026-08-22T14:29:00+02:00",
    evChargers: [{ id: "CG-DE-01", serial: "GWDE0001", model: "GoodWe AC 22", powerKw: 22, technicalStatus: "ONLINE" }]
  },
  {
    id: "gw-plant-shanghai", name: "GoodWe Shanghai Lab", organization: "GoodWe China",
    address: "Century Avenue", number: "100", city: "Shanghai", state: "SH", zipCode: "200120",
    timezone: "Asia/Shanghai", latitude: 31.2304, longitude: 121.4737, capacityKwp: 180, batteryCapacityKwh: 128,
    authorization: "AUTHORIZED", catalogState: "READY", lastSyncAt: "2026-08-22T20:26:00+08:00",
    evChargers: [{ id: "CG-CN-01", serial: "GWCN0001", model: "GoodWe DC 120", powerKw: 120, technicalStatus: "ONLINE" }]
  },
  {
    id: "gw-plant-fiap-vila-mariana", name: "FIAP Vila Mariana", organization: "GoodWe Brasil",
    address: "Rua Tito", number: "54", city: "São Paulo", state: "SP", zipCode: "05051-000",
    timezone: "America/Sao_Paulo", latitude: -23.5891, longitude: -46.6347, capacityKwp: 68, batteryCapacityKwh: 48,
    authorization: "AUTHORIZED", catalogState: "READY", lastSyncAt: "2026-08-22T09:40:00-03:00",
    evChargers: [
      { id: "GW-FIAP-VM-01", serial: "GWVM0001", model: "GoodWe AC 22", powerKw: 22, technicalStatus: "ONLINE" },
      { id: "GW-FIAP-VM-02", serial: "GWVM0002", model: "GoodWe AC 22", powerKw: 22, technicalStatus: "ONLINE" }
    ]
  },
  {
    id: "gw-plant-empty", name: "Planta sem dados", organization: "GoodWe Brasil",
    address: "Av. Paulista", number: "1000", city: "São Paulo", state: "SP", zipCode: "01310-100",
    timezone: "America/Sao_Paulo", latitude: -23.5629, longitude: -46.6544, capacityKwp: 0, batteryCapacityKwh: 0,
    authorization: "AUTHORIZED", catalogState: "EMPTY", evChargers: []
  },
  {
    id: "gw-plant-without-ev", name: "Centro Solar sem EV", organization: "GoodWe Brasil",
    address: "Rodovia Anhanguera", number: "500", city: "Campinas", state: "SP", zipCode: "13098-000",
    timezone: "America/Sao_Paulo", latitude: -22.9056, longitude: -47.0608, capacityKwp: 210, batteryCapacityKwh: 128,
    authorization: "AUTHORIZED", catalogState: "READY", lastSyncAt: "2026-08-22T09:28:00-03:00", evChargers: []
  },
  {
    id: "gw-plant-denied", name: "Planta de outra organização", organization: "Organização não autorizada",
    address: "Endereço protegido", number: "—", city: "Curitiba", state: "PR", zipCode: "80000-000",
    timezone: "America/Sao_Paulo", latitude: -25.4284, longitude: -49.2733, capacityKwp: 84, batteryCapacityKwh: 64,
    authorization: "DENIED", catalogState: "READY", lastSyncAt: "2026-08-22T09:15:00-03:00", evChargers: []
  }
];
