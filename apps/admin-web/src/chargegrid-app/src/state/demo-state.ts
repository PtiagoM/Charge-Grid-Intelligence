// @ts-nocheck
const demoNow = '2026-08-18T18:00:00-03:00';

export const AUTH_PROFILES = {
  GOODWE: 'GOODWE',
  ESTABELECIMENTO: 'ESTABELECIMENTO',
  USUARIO: 'USUARIO'
};

export const DEMO_ACCOUNTS = [
  {
    id: 'acc-goodwe',
    email: 'goodwe@teste.com',
    password: 'teste',
    profile: AUTH_PROFILES.GOODWE,
    userId: 'user-goodwe-admin',
    status: 'Ativo'
  },
  {
    id: 'acc-est-fiap',
    email: 'estabelecimento@teste.com',
    password: 'teste',
    profile: AUTH_PROFILES.ESTABELECIMENTO,
    userId: 'user-est-fiap',
    establishmentId: 'est-fiap',
    status: 'Ativo'
  },
  {
    id: 'acc-driver',
    email: 'usuario@teste.com',
    password: 'teste',
    profile: AUTH_PROFILES.USUARIO,
    userId: 'user-driver-01',
    status: 'Ativo'
  }
];

const users = [
  {
    id: 'user-goodwe-admin',
    name: 'Painel Executivo GoodWe',
    email: 'goodwe@teste.com',
    phone: '+55 11 90000-1111',
    profile: AUTH_PROFILES.GOODWE
  },
  {
    id: 'user-est-fiap',
    name: 'Gestora FIAP',
    email: 'estabelecimento@teste.com',
    phone: '+55 11 90000-2222',
    profile: AUTH_PROFILES.ESTABELECIMENTO,
    establishmentId: 'est-fiap'
  },
  {
    id: 'user-driver-01',
    name: 'Usuario Demo',
    email: 'usuario@teste.com',
    phone: '+55 11 90000-3333',
    profile: AUTH_PROFILES.USUARIO,
    vehicle: {
      model: 'BYD Dolphin',
      plate: 'EV-2026'
    }
  }
];

const contracts = [
  {
    id: 'ctr-default',
    clientId: 'cli-fiap',
    establishmentId: 'est-fiap',
    code: 'CG-CTR-2026-001',
    name: 'ChargeGrid Performance',
    model: 'Hibrido',
    monthlyFee: 0,
    perActiveCharger: 0,
    perSession: 0,
    revenueSharePercent: 6,
    marginSharePercent: 8,
    startDate: '2026-01-01',
    renewalDate: '2027-01-01',
    status: 'Ativo',
    billingCycle: 'Mensal',
    paymentTermsDays: 15,
    slaHours: 8,
    notes: 'Contrato demonstrativo com compartilhamento de receita.'
  }
];

const clients = [
  {
    id: 'cli-fiap',
    name: 'Rede FIAP',
    corporateName: 'FIAP Eco Smart Group S.A.',
    document: '12.345.678/0001-90',
    segment: 'Shopping e educacao',
    tier: 'Enterprise',
    lifecycle: 'Operacao',
    status: 'Ativo',
    healthScore: 92,
    owner: 'Marina Alves',
    primaryContactId: 'contact-fiap-01',
    city: 'Sao Paulo',
    state: 'SP',
    image: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg',
    createdAt: '2026-01-12T10:00:00-03:00'
  },
  {
    id: 'cli-mercadox',
    name: 'Rede MercadoX',
    corporateName: 'MercadoX Mobilidade Ltda.',
    document: '98.765.432/0001-10',
    segment: 'Varejo',
    tier: 'Growth',
    lifecycle: 'Expansao',
    status: 'Ativo',
    healthScore: 74,
    owner: 'Rafael Nunes',
    primaryContactId: 'contact-mercadox-01',
    city: 'Sao Paulo',
    state: 'SP',
    image: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg',
    createdAt: '2026-03-05T14:00:00-03:00'
  },
  {
    id: 'cli-goodwe-global',
    name: 'GoodWe Global Mobility',
    corporateName: 'GoodWe Technologies Co., Ltd.',
    document: 'GLOBAL-GW-001',
    segment: 'Energia e mobilidade',
    tier: 'Strategic',
    lifecycle: 'Operacao',
    status: 'Ativo',
    healthScore: 96,
    owner: 'Global Operations',
    primaryContactId: 'contact-goodwe-01',
    city: 'Suzhou',
    state: 'Jiangsu',
    image: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg',
    createdAt: '2025-11-20T09:00:00-03:00'
  }
];

const contacts = [
  { id: 'contact-fiap-01', clientId: 'cli-fiap', name: 'Gestora FIAP', role: 'Gestora de mobilidade', email: 'estabelecimento@teste.com', phone: '+55 11 90000-2222', primary: true },
  { id: 'contact-mercadox-01', clientId: 'cli-mercadox', name: 'Marina Costa', role: 'Operacoes', email: 'operacao@mercadox.com.br', phone: '+55 11 3333-2000', primary: true },
  { id: 'contact-goodwe-01', clientId: 'cli-goodwe-global', name: 'Global Operations', role: 'Network Operations', email: 'global.ops@goodwe.example', phone: '+86 512 0000-1000', primary: true }
];

const establishments = [
  {
    id: 'est-fiap',
    clientId: 'cli-fiap',
    name: 'Shopping FIAP',
    corporateName: 'FIAP Eco Smart Hub Ltda.',
    cnpj: '12.345.678/0001-90',
    responsible: 'Gestora FIAP',
    phone: '+55 11 3333-1000',
    email: 'energia@fiap.com.br',
    notes: 'Cliente ancora do fluxo comercial ChargeGrid.',
    status: 'Ativo',
    city: 'Sao Paulo',
    state: 'SP',
    address: 'Av. Lins de Vasconcelos, 1222',
    contractId: 'ctr-default',
    pricePerKwh: 2.95,
    folderImage: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg'
  },
  {
    id: 'est-mercadox',
    clientId: 'cli-mercadox',
    name: 'MercadoX Pinheiros',
    corporateName: 'MercadoX Mobilidade Ltda.',
    cnpj: '98.765.432/0001-10',
    responsible: 'Marina Costa',
    phone: '+55 11 3333-2000',
    email: 'operacao@mercadox.com.br',
    notes: 'Cliente em expansao com potencial de novas vagas.',
    status: 'Ativo',
    city: 'Sao Paulo',
    state: 'SP',
    address: 'Rua dos Pinheiros, 900',
    contractId: 'ctr-default',
    pricePerKwh: 3.1,
    folderImage: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg'
  },
  {
    id: 'est-goodwe-california',
    clientId: 'cli-goodwe-global',
    name: 'GoodWe California Hub',
    corporateName: 'GoodWe Mobility USA Inc.',
    cnpj: 'US-CA-0001',
    responsible: 'Alex Morgan',
    phone: '+1 415 555-0188',
    email: 'ops.ca@goodwe.example',
    notes: 'Ponto internacional de demonstracao comercial.',
    status: 'Ativo',
    city: 'San Francisco',
    state: 'CA',
    address: 'Market Street, 1355',
    contractId: 'ctr-default',
    pricePerKwh: 0.52,
    folderImage: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg'
  },
  {
    id: 'est-goodwe-europe',
    clientId: 'cli-goodwe-global',
    name: 'GoodWe Europe Center',
    corporateName: 'GoodWe Europe GmbH',
    cnpj: 'DE-BE-0001',
    responsible: 'Klara Weber',
    phone: '+49 30 5550-1900',
    email: 'ops.eu@goodwe.example',
    notes: 'Hub europeu para carregadores GoodWe.',
    status: 'Ativo',
    city: 'Berlin',
    state: 'BE',
    address: 'Alexanderplatz, 4',
    contractId: 'ctr-default',
    pricePerKwh: 0.49,
    folderImage: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg'
  },
  {
    id: 'est-goodwe-shanghai',
    clientId: 'cli-goodwe-global',
    name: 'GoodWe Shanghai Lab',
    corporateName: 'GoodWe Smart Energy China',
    cnpj: 'CN-SH-0001',
    responsible: 'Li Wei',
    phone: '+86 21 5555-1020',
    email: 'ops.sh@goodwe.example',
    notes: 'Laboratorio comercial conectado ao mapa global.',
    status: 'Ativo',
    city: 'Shanghai',
    state: 'SH',
    address: 'Century Avenue, 100',
    contractId: 'ctr-default',
    pricePerKwh: 0.78,
    folderImage: '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg'
  }
];

const locations = [
  {
    id: 'loc-fiap-aclimacao',
    establishmentId: 'est-fiap',
    name: 'Hub FIAP Aclimacao',
    address: 'Av. Lins de Vasconcelos',
    number: '1222',
    complement: 'Subsolo G2',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '01538-001',
    country: 'Brasil',
    latitude: -23.5746,
    longitude: -46.6232,
    geocodingPrecision: 'address',
    description: 'Hub principal para demonstracao comercial.',
    status: 'Ativo'
  },
  {
    id: 'loc-mercadox-pinheiros',
    establishmentId: 'est-mercadox',
    name: 'MercadoX Pinheiros',
    address: 'Rua dos Pinheiros',
    number: '900',
    complement: 'Estacionamento coberto',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '05422-001',
    country: 'Brasil',
    latitude: -23.5668,
    longitude: -46.6889,
    geocodingPrecision: 'address',
    description: 'Unidade varejo com alta rotatividade.',
    status: 'Ativo'
  },
  {
    id: 'loc-goodwe-california',
    establishmentId: 'est-goodwe-california',
    name: 'GoodWe San Francisco',
    address: 'Market Street',
    number: '1355',
    complement: 'EV Deck',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    country: 'Estados Unidos',
    latitude: 37.7749,
    longitude: -122.4194,
    geocodingPrecision: 'city',
    description: 'Ponto internacional de demonstracao GoodWe.',
    status: 'Ativo'
  },
  {
    id: 'loc-goodwe-europe',
    establishmentId: 'est-goodwe-europe',
    name: 'GoodWe Berlin Center',
    address: 'Alexanderplatz',
    number: '4',
    complement: 'Garage 1',
    city: 'Berlin',
    state: 'BE',
    zipCode: '10178',
    country: 'Alemanha',
    latitude: 52.52,
    longitude: 13.405,
    geocodingPrecision: 'city',
    description: 'Centro comercial europeu GoodWe.',
    status: 'Ativo'
  },
  {
    id: 'loc-goodwe-shanghai',
    establishmentId: 'est-goodwe-shanghai',
    name: 'GoodWe Shanghai Lab',
    address: 'Century Avenue',
    number: '100',
    complement: 'Smart Energy Lab',
    city: 'Shanghai',
    state: 'SH',
    zipCode: '200120',
    country: 'China',
    latitude: 31.2304,
    longitude: 121.4737,
    geocodingPrecision: 'city',
    description: 'Laboratorio asiatico de carregadores GoodWe.',
    status: 'Ativo'
  }
];

locations.forEach((location) => {
  location.coverImage = '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg';
  location.gallery = [];
  location.operatingHours = '24 horas';
  location.operationalNotes = '';
});

const chargers = [
  {
    id: 'CG-FIAP-01',
    internalId: 'FIAP-ACL-01',
    serial: 'GWFIAP0001',
    model: 'GoodWe AC 22',
    powerKw: 22,
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    installationDate: '2026-08-01',
    status: 'charging',
    currentPowerKw: 16.7,
    linkedSessionId: 'S-ACT-0001',
    todayEnergyKwh: 18.4,
    todayRevenue: 54.28,
    utilizationPercent: 84,
    lastCommunication: demoNow,
    technicalNotes: 'Carregador principal em operacao.'
  },
  {
    id: 'CG-FIAP-03',
    internalId: 'FIAP-ACL-03',
    serial: 'GWFIAP0003',
    model: 'GoodWe DC 60',
    powerKw: 60,
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    installationDate: '2026-08-02',
    status: 'available',
    currentPowerKw: 0,
    linkedSessionId: null,
    todayEnergyKwh: 9.8,
    todayRevenue: 28.91,
    utilizationPercent: 62,
    lastCommunication: demoNow,
    technicalNotes: 'Disponivel para fluxo Drive.'
  },
  {
    id: 'CG-FIAP-05',
    internalId: 'FIAP-ACL-05',
    serial: 'GWFIAP0005',
    model: 'GoodWe AC 22',
    powerKw: 22,
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    installationDate: '2026-08-03',
    status: 'available',
    currentPowerKw: 0,
    linkedSessionId: null,
    todayEnergyKwh: 12.6,
    todayRevenue: 37.17,
    utilizationPercent: 58,
    lastCommunication: demoNow,
    technicalNotes: 'Equipamento usado nos testes de QR.'
  },
  {
    id: 'CG-MX-01',
    internalId: 'MX-PIN-01',
    serial: 'GWMX0001',
    model: 'GoodWe AC 22',
    powerKw: 22,
    establishmentId: 'est-mercadox',
    locationId: 'loc-mercadox-pinheiros',
    installationDate: '2026-07-21',
    status: 'offline',
    currentPowerKw: 0,
    linkedSessionId: null,
    todayEnergyKwh: 0,
    todayRevenue: 0,
    utilizationPercent: 22,
    lastCommunication: '2026-08-18T16:30:00-03:00',
    technicalNotes: 'Manutencao programada.'
  },
  {
    id: 'CG-US-01',
    internalId: 'US-SF-01',
    serial: 'GWUS0001',
    model: 'GoodWe DC 80',
    powerKw: 80,
    establishmentId: 'est-goodwe-california',
    locationId: 'loc-goodwe-california',
    installationDate: '2026-06-12',
    status: 'available',
    currentPowerKw: 0,
    linkedSessionId: null,
    todayEnergyKwh: 31.2,
    todayRevenue: 16.22,
    utilizationPercent: 51,
    lastCommunication: demoNow,
    technicalNotes: 'Demo global para mapa mundial.'
  },
  {
    id: 'CG-DE-01',
    internalId: 'DE-BER-01',
    serial: 'GWDE0001',
    model: 'GoodWe AC 22',
    powerKw: 22,
    establishmentId: 'est-goodwe-europe',
    locationId: 'loc-goodwe-europe',
    installationDate: '2026-05-18',
    status: 'charging',
    currentPowerKw: 14.1,
    linkedSessionId: null,
    todayEnergyKwh: 24.7,
    todayRevenue: 12.1,
    utilizationPercent: 76,
    lastCommunication: demoNow,
    technicalNotes: 'Ponto europeu no mapa mundial.'
  },
  {
    id: 'CG-CN-01',
    internalId: 'CN-SH-01',
    serial: 'GWCN0001',
    model: 'GoodWe DC 120',
    powerKw: 120,
    establishmentId: 'est-goodwe-shanghai',
    locationId: 'loc-goodwe-shanghai',
    installationDate: '2026-04-03',
    status: 'available',
    currentPowerKw: 0,
    linkedSessionId: null,
    todayEnergyKwh: 48.9,
    todayRevenue: 38.14,
    utilizationPercent: 69,
    lastCommunication: demoNow,
    technicalNotes: 'Ponto asiatico no mapa mundial.'
  }
];

chargers.forEach((charger) => {
  charger.assetTag = charger.internalId;
  charger.warrantyEndDate = '2029-08-01';
  charger.maintenancePlan = 'Preventiva semestral';
  charger.nextMaintenanceDate = '2027-02-01';
  charger.commissioningStatus = 'Comissionado';
  charger.healthScore = charger.status === 'offline' ? 63 : Math.max(82, 100 - Math.round((charger.utilizationPercent ?? 0) / 8));
});

const sessions = [
  {
    id: 'S-ACT-0001',
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    chargerId: 'CG-FIAP-01',
    driverId: 'user-driver-01',
    driverName: 'Usuario Demo',
    vehicle: 'BYD Dolphin',
    status: 'active',
    source: 'drive',
    startedAt: '2026-08-18T17:20:00-03:00',
    endedAt: null,
    durationMinutes: 40,
    energyKwh: 18.4,
    powerKw: 16.7,
    maxPowerKw: 22,
    tariffPerKwh: 2.95,
    tariffBasePerKwh: 2.95,
    tariffFactors: [],
    tariffFormula: 'Tarifa base',
    consumedAmount: 54.28,
    finalAmount: null,
    limitAmount: 80,
    payment: {
      method: 'Cartao',
      status: 'Aprovado',
      preAuthAmount: 80
    },
    origin: 'Hibrida estimada'
  },
  {
    id: 'S-FIN-0001',
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    chargerId: 'CG-FIAP-05',
    driverId: 'guest-qr',
    driverName: 'Visitante QR',
    vehicle: 'Visitante',
    status: 'finished',
    source: 'quick',
    startedAt: '2026-08-18T14:10:00-03:00',
    endedAt: '2026-08-18T15:02:00-03:00',
    durationMinutes: 52,
    energyKwh: 12.6,
    powerKw: 12.2,
    maxPowerKw: 22,
    tariffPerKwh: 2.95,
    tariffBasePerKwh: 2.95,
    tariffFactors: [],
    tariffFormula: 'Tarifa base',
    consumedAmount: 37.17,
    finalAmount: 37.17,
    limitAmount: 50,
    payment: {
      method: 'Pix',
      status: 'Aprovado',
      preAuthAmount: 50
    },
    origin: 'Hibrida estimada'
  }
];

const queues = [
  {
    id: 'Q-0001',
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    driverId: 'guest-queue',
    driverName: 'Cliente em espera',
    vehicle: 'Volvo EX30',
    chargerPreference: 'CG-FIAP-03',
    enteredAt: '2026-08-18T17:45:00-03:00',
    status: 'waiting',
    note: 'Aguardando liberacao comercial'
  }
];

const payments = sessions.map((session, index) => ({
  id: `PAY-${String(index + 1).padStart(4, '0')}`,
  sessionId: session.id,
  establishmentId: session.establishmentId,
  locationId: session.locationId,
  driverId: session.driverId,
  method: session.payment.method,
  status: session.payment.status,
  authorizedAmount: session.limitAmount,
  capturedAmount: session.finalAmount ?? session.consumedAmount,
  createdAt: session.startedAt,
  updatedAt: session.endedAt ?? demoNow
}));

const energyByEstablishment = {
  'est-fiap': {
    demandKw: 168,
    contractLimitKw: 260,
    chargerLoadKw: 34,
    baseLoadKw: 134,
    solarKw: 52,
    batteryKw: 18,
    batterySocPercent: 68,
    marginPercent: 35.38,
    state: 'Favoravel',
    generationTrend: [42, 48, 55, 52, 50, 49],
    occupancyTrend: [42, 55, 62, 71, 79, 86]
  },
  'est-mercadox': {
    demandKw: 92,
    contractLimitKw: 160,
    chargerLoadKw: 0,
    baseLoadKw: 92,
    solarKw: 18,
    batteryKw: 6,
    batterySocPercent: 57,
    marginPercent: 42.5,
    state: 'Alerta',
    generationTrend: [12, 18, 21, 20, 16, 14],
    occupancyTrend: [12, 18, 22, 28, 32, 35]
  },
  'est-goodwe-california': {
    demandKw: 148,
    contractLimitKw: 340,
    chargerLoadKw: 0,
    baseLoadKw: 148,
    solarKw: 64,
    batteryKw: 24,
    batterySocPercent: 72,
    marginPercent: 56.47,
    state: 'Favoravel',
    generationTrend: [36, 42, 58, 64, 60, 54],
    occupancyTrend: [24, 32, 39, 44, 51, 55]
  },
  'est-goodwe-europe': {
    demandKw: 126,
    contractLimitKw: 220,
    chargerLoadKw: 14,
    baseLoadKw: 112,
    solarKw: 30,
    batteryKw: 12,
    batterySocPercent: 61,
    marginPercent: 42.73,
    state: 'Favoravel',
    generationTrend: [18, 24, 31, 30, 27, 22],
    occupancyTrend: [34, 46, 58, 63, 71, 76]
  },
  'est-goodwe-shanghai': {
    demandKw: 210,
    contractLimitKw: 420,
    chargerLoadKw: 0,
    baseLoadKw: 210,
    solarKw: 72,
    batteryKw: 28,
    batterySocPercent: 66,
    marginPercent: 50,
    state: 'Favoravel',
    generationTrend: [48, 58, 72, 76, 70, 64],
    occupancyTrend: [38, 46, 54, 61, 69, 72]
  }
};

const energyByLocation = Object.fromEntries(
  locations.map((location) => {
    const source = energyByEstablishment[location.establishmentId];
    const siblingCount = Math.max(
      1,
      locations.filter((item) => item.establishmentId === location.establishmentId).length
    );
    const snapshot = JSON.parse(JSON.stringify(source));
    snapshot.demandKw = Math.round((source.demandKw / siblingCount) * 100) / 100;
    snapshot.contractLimitKw = Math.round((source.contractLimitKw / siblingCount) * 100) / 100;
    snapshot.chargerLoadKw = Math.round((source.chargerLoadKw / siblingCount) * 100) / 100;
    snapshot.baseLoadKw = Math.round((source.baseLoadKw / siblingCount) * 100) / 100;
    snapshot.solarKw = Math.round((source.solarKw / siblingCount) * 100) / 100;
    snapshot.batteryKw = Math.round((source.batteryKw / siblingCount) * 100) / 100;
    return [location.id, snapshot];
  })
);

const financeLedger = [
  {
    id: 'FIN-0001',
    sessionId: 'S-FIN-0001',
    establishmentId: 'est-fiap',
    grossAmount: 37.17,
    goodweShare: 2.23,
    establishmentShare: 34.94,
    status: 'Liquidado',
    createdAt: '2026-08-18T15:02:00-03:00'
  },
  {
    id: 'FIN-0002',
    sessionId: 'S-ACT-0001',
    establishmentId: 'est-fiap',
    grossAmount: 54.28,
    goodweShare: 3.26,
    establishmentShare: 51.02,
    status: 'Pendente',
    createdAt: demoNow
  }
];

const driverDiscovery = [
  {
    establishmentId: 'est-fiap',
    distanceKm: 1.4,
    queueEstimateMinutes: 8
  },
  {
    establishmentId: 'est-mercadox',
    distanceKm: 4.6,
    queueEstimateMinutes: 18
  }
];

const installations = [
  {
    id: 'ins-fiap-aclimacao',
    clientId: 'cli-fiap',
    establishmentId: 'est-fiap',
    locationId: 'loc-fiap-aclimacao',
    code: 'CG-IMP-2026-001',
    status: 'Concluida',
    progress: 100,
    owner: 'Equipe Field Service SP',
    plannedStart: '2026-07-20',
    plannedEnd: '2026-08-03',
    actualEnd: '2026-08-03',
    checklist: [
      { id: 'survey', label: 'Vistoria tecnica', done: true },
      { id: 'energy', label: 'Validacao eletrica', done: true },
      { id: 'civil', label: 'Infraestrutura civil', done: true },
      { id: 'devices', label: 'Instalacao dos equipamentos', done: true },
      { id: 'commissioning', label: 'Comissionamento', done: true },
      { id: 'handover', label: 'Aceite do cliente', done: true }
    ]
  },
  {
    id: 'ins-mercadox-pinheiros',
    clientId: 'cli-mercadox',
    establishmentId: 'est-mercadox',
    locationId: 'loc-mercadox-pinheiros',
    code: 'CG-IMP-2026-002',
    status: 'Em acompanhamento',
    progress: 83,
    owner: 'Equipe Field Service SP',
    plannedStart: '2026-07-01',
    plannedEnd: '2026-07-24',
    actualEnd: '',
    checklist: [
      { id: 'survey', label: 'Vistoria tecnica', done: true },
      { id: 'energy', label: 'Validacao eletrica', done: true },
      { id: 'civil', label: 'Infraestrutura civil', done: true },
      { id: 'devices', label: 'Instalacao dos equipamentos', done: true },
      { id: 'commissioning', label: 'Comissionamento', done: true },
      { id: 'handover', label: 'Aceite do cliente', done: false }
    ]
  }
];

const supportTickets = [
  {
    id: 'ticket-0001',
    code: 'SUP-2026-0001',
    clientId: 'cli-mercadox',
    establishmentId: 'est-mercadox',
    locationId: 'loc-mercadox-pinheiros',
    chargerId: 'CG-MX-01',
    category: 'Conectividade',
    severity: 'Alta',
    title: 'Carregador sem comunicacao',
    description: 'Equipamento offline desde 16:30. Necessaria verificacao de rede local.',
    status: 'Em atendimento',
    slaDueAt: '2026-08-18T20:30:00-03:00',
    owner: 'Suporte Nivel 2',
    requester: 'Marina Costa',
    createdAt: '2026-08-18T16:42:00-03:00',
    updates: [{ at: '2026-08-18T17:05:00-03:00', author: 'Suporte Nivel 1', message: 'Diagnostico remoto iniciado.' }]
  }
];

const documents = [
  { id: 'doc-0001', clientId: 'cli-fiap', establishmentId: 'est-fiap', type: 'Contrato', name: 'Contrato ChargeGrid 2026', version: '1.0', status: 'Vigente', updatedAt: '2026-01-12T10:00:00-03:00' },
  { id: 'doc-0002', clientId: 'cli-fiap', establishmentId: 'est-fiap', locationId: 'loc-fiap-aclimacao', type: 'Instalacao', name: 'Termo de aceite Aclimacao', version: '1.0', status: 'Assinado', updatedAt: '2026-08-03T16:00:00-03:00' }
];

const notifications = [
  { id: 'not-0001', profile: AUTH_PROFILES.GOODWE, clientId: 'cli-mercadox', severity: 'Alta', title: 'SLA de conectividade em risco', message: 'O chamado SUP-2026-0001 exige acao antes das 20:30.', read: false, createdAt: '2026-08-18T17:10:00-03:00' },
  { id: 'not-0002', profile: AUTH_PROFILES.ESTABELECIMENTO, establishmentId: 'est-fiap', severity: 'Info', title: 'Operacao saudavel', message: 'Todos os pontos FIAP estao dentro da margem energetica.', read: false, createdAt: '2026-08-18T17:30:00-03:00' }
];

const expansionOpportunities = [
  { id: 'opp-0001', clientId: 'cli-fiap', establishmentId: 'est-fiap', locationId: 'loc-fiap-aclimacao', score: 86, status: 'Qualificada', title: 'Expansao de duas vagas AC', evidence: 'Ocupacao acima de 78% em horarios de pico e fila recorrente.', recommendation: 'Validar capacidade para adicionar dois carregadores de 22 kW.', estimatedMonthlyRevenue: 6800 },
  { id: 'opp-0002', clientId: 'cli-mercadox', establishmentId: 'est-mercadox', locationId: 'loc-mercadox-pinheiros', score: 54, status: 'Em analise', title: 'Recuperacao antes da expansao', evidence: 'Baixa disponibilidade causada por equipamento offline.', recommendation: 'Restabelecer conectividade e medir a ocupacao por 30 dias.', estimatedMonthlyRevenue: 2100 }
];

const auditLogs = [
  { id: 'audit-0001', at: '2026-08-18T16:42:00-03:00', userId: 'user-goodwe-admin', userName: 'Painel Executivo GoodWe', profile: AUTH_PROFILES.GOODWE, action: 'CREATE', entityType: 'supportTicket', entityId: 'ticket-0001', summary: 'Chamado SUP-2026-0001 criado', origin: 'Backoffice', reason: 'Equipamento offline', changes: [] }
];

export function createDemoState() {
  const seed = {
    auth: {
      currentUserId: null,
      error: null
    },
    now: demoNow,
    tickMinutes: 5,
    accounts: DEMO_ACCOUNTS,
    users,
    clients,
    contacts,
    establishments,
    locations,
    contracts,
    chargers,
    chargerMovements: [],
    sessions,
    queues,
    payments,
    alerts: [],
    predictions: [],
    events: [],
    energyByEstablishment,
    energyByLocation,
    financeLedger,
    invoices: [],
    installations,
    supportTickets,
    documents,
    notifications,
    expansionOpportunities,
    auditLogs,
    driverDiscovery,
    simulation: {
      nextPaymentStatus: 'Aprovado',
      quickModeEnabled: true
    },
    ui: {
      selectedEstablishmentId: null,
      selectedLocationId: null,
      selectedChargerId: null,
      selectedSessionFilter: 'all',
      selectedQueueFilter: 'all',
      selectedDriverTab: 'home',
      selectedGoodweTab: 'overview',
      selectedBusinessTab: 'overview',
      searchTerm: '',
      locationStatusFilter: 'all',
      chargerStatusFilter: 'all',
      monitorLocationFilter: 'all',
      monitorStatusFilter: 'all',
      reportPeriod: 'day',
      selectedSessionId: null,
      selectedLocationViewId: null,
      selectedMapLocationId: 'loc-fiap-aclimacao',
      mapSearchAddress: '',
      mapSearchResult: null,
      assistantOpen: false,
      chatDraft: '',
      qrGuestName: 'Visitante QR',
      flashMessage: '',
      flashTone: 'info'
    }
  };

  return JSON.parse(JSON.stringify(seed));
}

