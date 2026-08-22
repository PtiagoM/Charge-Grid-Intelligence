// @ts-nocheck
import { AUTH_PROFILES, createDemoState } from './demo-state.js';

const STORAGE_KEY = 'chargegrid-intelligence-state-v4';
const SYNC_EVENT = 'chargegrid:state-sync';

const GOODWE_ALLOWED_TABS = new Set([
  'overview',
  'clients',
  'client',
  'new-client',
  'establishments',
  'new-establishment',
  'establishment',
  'locations',
  'new-location',
  'location',
  'charger',
  'chargers',
  'sessions',
  'operations',
  'installations',
  'installation',
  'contracts',
  'contract',
  'finance',
  'energy',
  'pricing',
  'ai',
  'reports',
  'support',
  'ticket',
  'audit',
  'expansion',
  'settings'
]);

const ESTABLISHMENT_ALLOWED_TABS = new Set([
  'overview',
  'locations',
  'location',
  'charger',
  'chargers',
  'sessions',
  'operations',
  'energy',
  'pricing',
  'finance',
  'invoices',
  'contract',
  'support',
  'ticket',
  'documents',
  'ai',
  'reports',
  'settings'
]);

export const PERMISSIONS = {
  NETWORK_VIEW: 'network:view',
  CLIENT_MANAGE: 'client:manage',
  STRUCTURE_MANAGE: 'structure:manage',
  CONTRACT_MANAGE: 'contract:manage',
  INSTALLATION_MANAGE: 'installation:manage',
  FINANCE_VIEW: 'finance:view',
  SUPPORT_VIEW: 'support:view',
  SUPPORT_CREATE: 'support:create',
  SUPPORT_MANAGE: 'support:manage',
  AUDIT_VIEW: 'audit:view',
  SETTINGS_MANAGE: 'settings:manage'
};

const PROFILE_PERMISSIONS = {
  [AUTH_PROFILES.GOODWE]: new Set(Object.values(PERMISSIONS)),
  [AUTH_PROFILES.ESTABELECIMENTO]: new Set([
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.SUPPORT_VIEW,
    PERMISSIONS.SUPPORT_CREATE
  ]),
  [AUTH_PROFILES.USUARIO]: new Set()
};

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const clone = (value) => JSON.parse(JSON.stringify(value));

function minutesFromIso(startIso, endIso) {
  const diff = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(0, Math.round(diff / 60000));
}

function addMinutes(isoValue, minutes) {
  const date = new Date(isoValue);
  date.setMinutes(date.getMinutes() + minutes);
  return date.toISOString();
}

function slugify(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function createEntityId(prefix, label, list) {
  const base = slugify(label) || `${prefix}-${list.length + 1}`;
  let candidate = `${prefix}-${base}`;
  let index = 2;

  while (list.some((item) => item.id === candidate)) {
    candidate = `${prefix}-${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function createChargerPublicId(label, list) {
  const normalized = String(label ?? `carregador-${list.length + 1}`)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);

  const base = normalized.startsWith('CG-') ? normalized : `CG-${normalized}`;
  let candidate = base;
  let index = 2;

  while (list.some((item) => item.id === candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function nextId(prefix, list) {
  const max = list.reduce((current, item) => {
    const parts = String(item.id).split('-');
    const n = Number(parts[parts.length - 1]);
    return Number.isFinite(n) ? Math.max(current, n) : current;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(4, '0')}`;
}

const ADDRESS_COORDINATES = [
  { terms: ['lins de vasconcelos', 'sao paulo'], latitude: -23.5746, longitude: -46.6232, country: 'Brasil' },
  { terms: ['rua dos pinheiros', 'sao paulo'], latitude: -23.5668, longitude: -46.6889, country: 'Brasil' },
  { terms: ['sao paulo', 'sp'], latitude: -23.5505, longitude: -46.6333, country: 'Brasil' },
  { terms: ['rio de janeiro', 'rj'], latitude: -22.9068, longitude: -43.1729, country: 'Brasil' },
  { terms: ['curitiba', 'pr'], latitude: -25.4284, longitude: -49.2733, country: 'Brasil' },
  { terms: ['lisboa'], latitude: 38.7223, longitude: -9.1393, country: 'Portugal' },
  { terms: ['madrid'], latitude: 40.4168, longitude: -3.7038, country: 'Espanha' },
  { terms: ['berlin'], latitude: 52.52, longitude: 13.405, country: 'Alemanha' },
  { terms: ['san francisco'], latitude: 37.7749, longitude: -122.4194, country: 'Estados Unidos' },
  { terms: ['los angeles'], latitude: 34.0522, longitude: -118.2437, country: 'Estados Unidos' },
  { terms: ['miami'], latitude: 25.7617, longitude: -80.1918, country: 'Estados Unidos' },
  { terms: ['mexico city'], latitude: 19.4326, longitude: -99.1332, country: 'Mexico' },
  { terms: ['cidade do mexico'], latitude: 19.4326, longitude: -99.1332, country: 'Mexico' },
  { terms: ['shanghai'], latitude: 31.2304, longitude: 121.4737, country: 'China' },
  { terms: ['sydney'], latitude: -33.8688, longitude: 151.2093, country: 'Australia' }
];

function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolveLocationCoordinates(payload) {
  const manualLatitude = Number(payload.latitude);
  const manualLongitude = Number(payload.longitude);
  if (Number.isFinite(manualLatitude) && Number.isFinite(manualLongitude)) {
    return {
      latitude: manualLatitude,
      longitude: manualLongitude,
      country: payload.country ?? '',
      geocodingPrecision: 'manual'
    };
  }

  const haystack = normalizeSearchText(
    `${payload.address ?? ''} ${payload.number ?? ''} ${payload.city ?? ''} ${payload.state ?? ''} ${
      payload.zipCode ?? ''
    } ${payload.country ?? ''}`
  );
  const match = ADDRESS_COORDINATES.find((entry) =>
    entry.terms.every((term) => haystack.includes(normalizeSearchText(term)))
  );

  if (!match) {
    return {
      latitude: null,
      longitude: null,
      country: payload.country ?? '',
      geocodingPrecision: 'pending'
    };
  }

  return {
    latitude: match.latitude,
    longitude: match.longitude,
    country: payload.country ?? match.country,
    geocodingPrecision: match.terms.length > 1 ? 'address' : 'city'
  };
}

function computeEnergyState(energy) {
  const margin = round(((energy.contractLimitKw - energy.demandKw) / energy.contractLimitKw) * 100);
  energy.marginPercent = margin;

  if (margin < 10 || energy.batterySocPercent < 40) {
    energy.state = 'Critico';
  } else if (margin <= 30 || energy.batterySocPercent <= 60) {
    energy.state = 'Alerta';
  } else {
    energy.state = 'Favoravel';
  }

  return energy;
}

function buildDefaultEnergySnapshot() {
  return {
    demandKw: 120,
    contractLimitKw: 260,
    chargerLoadKw: 0,
    baseLoadKw: 120,
    solarKw: 30,
    batteryKw: 10,
    batterySocPercent: 62,
    marginPercent: 53,
    state: 'Favoravel',
    generationTrend: [28, 32, 36, 33, 31, 30],
    occupancyTrend: [8, 12, 15, 18, 20, 22]
  };
}

function energyForCharger(state, charger) {
  return state.energyByLocation?.[charger.locationId] ?? state.energyByEstablishment[charger.establishmentId];
}

function energyForAction(state, payload) {
  return (payload.locationId && state.energyByLocation?.[payload.locationId]) || state.energyByEstablishment[payload.establishmentId];
}

function syncEstablishmentEnergy(state, establishmentId) {
  const snapshots = state.locations
    .filter((location) => location.establishmentId === establishmentId)
    .map((location) => state.energyByLocation?.[location.id])
    .filter(Boolean);

  if (!snapshots.length) return;

  const total = (key) => round(snapshots.reduce((sum, item) => sum + Number(item[key] ?? 0), 0));
  const aggregate = state.energyByEstablishment[establishmentId] ?? buildDefaultEnergySnapshot();
  aggregate.demandKw = total('demandKw');
  aggregate.contractLimitKw = total('contractLimitKw');
  aggregate.chargerLoadKw = total('chargerLoadKw');
  aggregate.baseLoadKw = total('baseLoadKw');
  aggregate.solarKw = total('solarKw');
  aggregate.batteryKw = total('batteryKw');
  aggregate.batterySocPercent = round(total('batterySocPercent') / snapshots.length);
  computeEnergyState(aggregate);
  state.energyByEstablishment[establishmentId] = aggregate;
}

function calculateAppliedTariff({ state, establishment, energySnapshot }) {
  const baseRate = establishment?.pricePerKwh ?? 2.95;
  const now = new Date(state.now);
  const hour = now.getHours();
  const factors = [];
  let multiplier = 1;

  if (hour >= 17 && hour <= 20) {
    multiplier += 0.16;
    factors.push({ label: 'Horario de pico', value: 0.16 });
  }

  if (energySnapshot.state === 'Alerta') {
    multiplier += 0.09;
    factors.push({ label: 'Demanda em alerta', value: 0.09 });
  }

  if (energySnapshot.state === 'Critico') {
    multiplier += 0.18;
    factors.push({ label: 'Estado critico', value: 0.18 });
  }

  if (energySnapshot.solarKw > energySnapshot.chargerLoadKw * 0.55) {
    multiplier -= 0.08;
    factors.push({ label: 'Aproveitamento solar', value: -0.08 });
  }

  return {
    baseRate,
    appliedRate: round(baseRate * multiplier),
    factors,
    formulaText: 'Valor = energia (kWh) x tarifa aplicada + taxa de sessao (se houver)'
  };
}

function getContractByEstablishment(state, establishmentId) {
  const establishment = state.establishments.find((item) => item.id === establishmentId);
  if (!establishment) return null;
  return state.contracts.find((contract) => contract.id === establishment.contractId) ?? null;
}

function calculateGoodweShare(contract, amount) {
  if (!contract) return round(amount * 0.06);

  const revenuePart = amount * (contract.revenueSharePercent / 100);
  const marginReference = amount * 0.48;
  const marginPart = marginReference * (contract.marginSharePercent / 100);
  const sessionFee = contract.perSession;

  return round(revenuePart + marginPart + sessionFee);
}

function pushLedgerFromSession(state, session, status = 'Liquidado') {
  const contract = getContractByEstablishment(state, session.establishmentId);
  const goodweShare = calculateGoodweShare(contract, session.finalAmount ?? session.consumedAmount);

  state.financeLedger.unshift({
    id: nextId('LED', state.financeLedger),
    date: state.now.slice(0, 10),
    establishmentId: session.establishmentId,
    source: `Sessao ${session.id}`,
    revenueType: 'Receita por sessao',
    movedAmount: round(session.finalAmount ?? session.consumedAmount),
    goodweShare,
    status
  });
}

function releaseNextQueue(state, establishmentId, chargerId) {
  const waitingItem = state.queues.find(
    (item) => item.establishmentId === establishmentId && item.status === 'waiting'
  );

  if (!waitingItem) return null;

  waitingItem.status = 'released';
  waitingItem.releasedAt = state.now;
  waitingItem.assignedChargerId = chargerId;
  waitingItem.note = 'Carregador liberado para inicio de sessao';
  return waitingItem;
}

function queueDriver(state, payload, reason) {
  if (!payload?.driverId || payload.driverId === 'guest-qr') return null;

  const exists = state.queues.some(
    (item) =>
      item.driverId === payload.driverId &&
      item.establishmentId === payload.establishmentId &&
      item.status === 'waiting'
  );

  if (exists) return null;

  const queueItem = {
    id: nextId('Q', state.queues),
    establishmentId: payload.establishmentId,
    locationId: payload.locationId,
    driverId: payload.driverId,
    driverName: payload.driverName,
    vehicle: payload.vehicle,
    chargerPreference: payload.chargerId,
    enteredAt: state.now,
    status: 'waiting',
    note: reason
  };

  state.queues.push(queueItem);
  return queueItem;
}

function tryReleaseQueue(state, establishmentId) {
  const energy = state.energyByEstablishment[establishmentId];
  if (!energy || energy.state === 'Critico') return null;

  const availableCharger = state.chargers.find(
    (charger) => charger.establishmentId === establishmentId && charger.status === 'available'
  );

  if (!availableCharger) return null;

  return releaseNextQueue(state, establishmentId, availableCharger.id);
}

function finalizeSession(state, sessionId, reason = 'manual') {
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || session.status !== 'active') return null;

  const charger = state.chargers.find((item) => item.id === session.chargerId);
  const finalAmount = round(Math.min(session.limitAmount, session.consumedAmount));

  session.status = 'finished';
  session.finalAmount = finalAmount;
  session.consumedAmount = finalAmount;
  session.durationMinutes = minutesFromIso(session.startedAt, state.now);
  session.endedAt = state.now;
  session.endReason = reason;
  if (session.payment.status === 'Pendente') {
    session.payment.status = 'Aprovado';
  }

  const payment = state.payments?.find((item) => item.sessionId === session.id);
  if (payment) {
    payment.status = session.payment.status;
    payment.capturedAmount = finalAmount;
    payment.updatedAt = state.now;
  }

  if (charger) {
    charger.status = 'available';
    charger.currentPowerKw = 0;
    charger.allocatedPowerKw = charger.powerKw;
    charger.limitReason = 'Sem limitacao ativa';
    charger.linkedSessionId = null;
    charger.lastCommunication = state.now;
    charger.utilizationPercent = Math.max(8, charger.utilizationPercent - 2);

    const energy = energyForCharger(state, charger);
    if (energy) {
      energy.chargerLoadKw = Math.max(0, energy.chargerLoadKw - session.powerKw);
      energy.demandKw = Math.max(0, energy.baseLoadKw + energy.chargerLoadKw);
      computeEnergyState(energy);
      syncEstablishmentEnergy(state, charger.establishmentId);
    }

    releaseNextQueue(state, session.establishmentId, charger.id);
    tryReleaseQueue(state, session.establishmentId);
  }

  pushLedgerFromSession(state, session, session.payment.status === 'Aprovado' ? 'Liquidado' : 'Pendente');
  return session;
}

function buildNewSession({ state, payload, paymentStatus }) {
  const charger = state.chargers.find((item) => item.id === payload.chargerId);
  if (!charger) {
    return { ok: false, message: 'Carregador nao encontrado.' };
  }

  if (!['available', 'reserved'].includes(charger.status)) {
    return { ok: false, message: 'Carregador indisponivel neste momento.' };
  }

  const establishment = state.establishments.find((item) => item.id === charger.establishmentId);
  const energy = energyForCharger(state, charger);
  const user = state.users.find((item) => item.id === payload.driverId);

  if (!establishment || !energy) {
    return { ok: false, message: 'Dados energeticos indisponiveis para liberar sessao.' };
  }

  if (paymentStatus === 'Recusado') {
    return { ok: false, message: 'Pagamento recusado. Sessao bloqueada.' };
  }

  if (paymentStatus !== 'Aprovado') {
    return { ok: false, message: 'Sessao liberada apenas com pagamento aprovado.' };
  }

  if (energy.state === 'Critico') {
    queueDriver(
      state,
      {
        establishmentId: establishment.id,
        locationId: charger.locationId,
        driverId: payload.driverId,
        driverName: payload.driverName ?? user?.name ?? 'Motorista',
        vehicle: payload.vehicle ?? user?.vehicle?.model ?? 'Nao informado',
        chargerId: charger.id
      },
      'Demanda critica: aguardando capacidade energetica'
    );

    return {
      ok: false,
      queued: true,
      message: 'Demanda critica: nova sessao mantida em espera para proteger a infraestrutura.'
    };
  }

  const headroomKw = round(energy.contractLimitKw - energy.demandKw);
  let allocatedPowerKw = round(charger.powerKw * 0.76);
  let limitReason = 'Sem limitacao ativa';

  if (energy.state === 'Alerta') {
    if (headroomKw <= 8) {
      queueDriver(
        state,
        {
          establishmentId: establishment.id,
          locationId: charger.locationId,
          driverId: payload.driverId,
          driverName: payload.driverName ?? user?.name ?? 'Motorista',
          vehicle: payload.vehicle ?? user?.vehicle?.model ?? 'Nao informado',
          chargerId: charger.id
        },
        'Margem energetica reduzida: sessao aguardando liberacao'
      );

      return {
        ok: false,
        queued: true,
        message: 'Estado de alerta sem margem suficiente: usuario colocado em espera.'
      };
    }

    allocatedPowerKw = Math.max(7, Math.min(allocatedPowerKw, round(headroomKw * 0.8)));
    limitReason = 'Preservacao da margem energetica da planta';
  }

  const tariff = calculateAppliedTariff({ state, establishment, energySnapshot: energy });

  const session = {
    id: nextId('S-ACT', state.sessions),
    establishmentId: charger.establishmentId,
    locationId: charger.locationId,
    chargerId: charger.id,
    driverId: payload.driverId,
    driverName: payload.driverName ?? user?.name ?? 'Motorista',
    vehicle: payload.vehicle ?? user?.vehicle?.model ?? 'Nao informado',
    status: 'active',
    source: payload.source ?? 'drive',
    startedAt: state.now,
    endedAt: null,
    durationMinutes: 0,
    energyKwh: 0,
    powerKw: allocatedPowerKw,
    maxPowerKw: charger.powerKw,
    tariffPerKwh: tariff.appliedRate,
    tariffBasePerKwh: tariff.baseRate,
    tariffFactors: tariff.factors,
    tariffFormula: tariff.formulaText,
    consumedAmount: 0,
    finalAmount: null,
    limitAmount: Number(payload.limitAmount),
    payment: {
      method: payload.paymentMethod,
      status: 'Aprovado',
      preAuthAmount: Number(payload.limitAmount)
    },
    origin: 'Hibrida estimada'
  };

  state.sessions.unshift(session);
  state.payments ||= [];
  state.payments.unshift({
    id: nextId('PAY', state.payments),
    sessionId: session.id,
    establishmentId: session.establishmentId,
    locationId: session.locationId,
    driverId: session.driverId,
    method: session.payment.method,
    status: session.payment.status,
    authorizedAmount: session.limitAmount,
    capturedAmount: 0,
    createdAt: state.now,
    updatedAt: state.now
  });

  charger.status = 'charging';
  charger.linkedSessionId = session.id;
  charger.currentPowerKw = allocatedPowerKw;
  charger.allocatedPowerKw = allocatedPowerKw;
  charger.limitReason = limitReason;
  charger.lastCommunication = state.now;
  charger.utilizationPercent = Math.min(98, charger.utilizationPercent + 6);

  energy.chargerLoadKw = round(energy.chargerLoadKw + allocatedPowerKw);
  energy.demandKw = round(energy.baseLoadKw + energy.chargerLoadKw);
  computeEnergyState(energy);
  syncEstablishmentEnergy(state, charger.establishmentId);

  return { ok: true, session, message: 'Sessao iniciada com sucesso.' };
}

function runTick(state) {
  state.now = addMinutes(state.now, state.tickMinutes);
  const toFinalize = [];

  state.sessions.forEach((session) => {
    if (session.status !== 'active') return;

    const charger = state.chargers.find((item) => item.id === session.chargerId);
    const power = charger?.currentPowerKw ?? session.powerKw;
    const deltaEnergy = round(((power * state.tickMinutes) / 60) * 0.92);
    const deltaValue = round(deltaEnergy * session.tariffPerKwh);

    session.energyKwh = round(session.energyKwh + deltaEnergy);
    session.consumedAmount = round(session.consumedAmount + deltaValue);
    session.durationMinutes = minutesFromIso(session.startedAt, state.now);

    if (charger) {
      charger.todayEnergyKwh = round(charger.todayEnergyKwh + deltaEnergy);
      charger.todayRevenue = round(charger.todayRevenue + deltaValue);
      charger.lastCommunication = state.now;
    }

    if (session.consumedAmount >= session.limitAmount) {
      toFinalize.push({ sessionId: session.id, reason: 'limite_atingido' });
    }
  });

  toFinalize.forEach((entry) => finalizeSession(state, entry.sessionId, entry.reason));

  const energySnapshots = Object.values(state.energyByLocation ?? state.energyByEstablishment);
  energySnapshots.forEach((energy) => {
    energy.baseLoadKw = round(Math.max(0, energy.baseLoadKw + (Math.random() - 0.5) * 4));
    energy.demandKw = round(energy.baseLoadKw + energy.chargerLoadKw);
    energy.solarKw = round(Math.max(0, energy.solarKw + (Math.random() - 0.5) * 5));
    energy.batterySocPercent = round(
      Math.max(20, Math.min(96, energy.batterySocPercent + (Math.random() - 0.5) * 2))
    );
    computeEnergyState(energy);
  });

  state.establishments.forEach((establishment) => syncEstablishmentEnergy(state, establishment.id));

  state.establishments.forEach((establishment) => {
    tryReleaseQueue(state, establishment.id);
  });
}

function persistState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(SYNC_EVENT));
}

function normalizeLoadedState(parsed) {
  const fresh = createDemoState();

  if (!parsed || typeof parsed !== 'object') {
    return fresh;
  }

  if (!Array.isArray(parsed.locations)) {
    return fresh;
  }

  const next = {
    ...fresh,
    ...parsed,
    auth: { ...fresh.auth, ...parsed.auth },
    simulation: { ...fresh.simulation, ...parsed.simulation },
    ui: { ...fresh.ui, ...parsed.ui },
    energyByEstablishment: {
      ...fresh.energyByEstablishment,
      ...(parsed.energyByEstablishment ?? {})
    },
    energyByLocation: {
      ...fresh.energyByLocation,
      ...(parsed.energyByLocation ?? {})
    }
  };

  if (!Array.isArray(next.chargerMovements)) {
    next.chargerMovements = [];
  }

  [
    'payments',
    'alerts',
    'predictions',
    'events',
    'clients',
    'contacts',
    'installations',
    'supportTickets',
    'documents',
    'notifications',
    'expansionOpportunities',
    'auditLogs'
  ].forEach((key) => {
    if (!Array.isArray(next[key])) next[key] = [];
  });

  fresh.clients.forEach((client) => {
    if (!next.clients.some((item) => item.id === client.id)) next.clients.push(client);
  });

  fresh.contacts.forEach((contact) => {
    if (!next.contacts.some((item) => item.id === contact.id)) next.contacts.push(contact);
  });

  fresh.establishments.forEach((establishment) => {
    if (!next.establishments.some((item) => item.id === establishment.id)) {
      next.establishments.push(establishment);
    }
  });

  next.establishments.forEach((establishment) => {
    establishment.clientId ||= fresh.establishments.find((item) => item.id === establishment.id)?.clientId ?? null;
  });

  ['installations', 'supportTickets', 'documents', 'notifications', 'expansionOpportunities', 'auditLogs'].forEach((key) => {
    fresh[key].forEach((record) => {
      if (!next[key].some((item) => item.id === record.id)) next[key].push(record);
    });
  });

  fresh.locations.forEach((seedLocation) => {
    const currentLocation = next.locations.find((item) => item.id === seedLocation.id);
    if (!currentLocation) {
      next.locations.push(seedLocation);
      return;
    }

    ['country', 'latitude', 'longitude', 'geocodingPrecision'].forEach((key) => {
      if (currentLocation[key] === undefined || currentLocation[key] === null || currentLocation[key] === '') {
        currentLocation[key] = seedLocation[key];
      }
    });
    currentLocation.coverImage ||= seedLocation.coverImage;
    currentLocation.gallery ||= seedLocation.gallery ?? [];
    currentLocation.operatingHours ||= seedLocation.operatingHours ?? '24 horas';
  });

  fresh.chargers.forEach((charger) => {
    if (!next.chargers.some((item) => item.id === charger.id)) {
      next.chargers.push(charger);
    }
  });

  Object.entries(fresh.energyByEstablishment).forEach(([establishmentId, energy]) => {
    if (!next.energyByEstablishment[establishmentId]) {
      next.energyByEstablishment[establishmentId] = energy;
    }
  });

  return next;
}

function loadState() {
  const persisted = localStorage.getItem(STORAGE_KEY);
  if (!persisted) {
    return createDemoState();
  }

  try {
    const parsed = JSON.parse(persisted);
    return normalizeLoadedState(parsed);
  } catch {
    return createDemoState();
  }
}

export function canAccessMvpTab(profile, tab) {
  if (profile === AUTH_PROFILES.GOODWE) {
    return GOODWE_ALLOWED_TABS.has(tab);
  }
  if (profile === AUTH_PROFILES.ESTABELECIMENTO) {
    return ESTABLISHMENT_ALLOWED_TABS.has(tab);
  }
  return false;
}

export function resolveHomeHash(profile) {
  if (profile === AUTH_PROFILES.GOODWE || profile === AUTH_PROFILES.ESTABELECIMENTO) {
    return '#/mvp/overview';
  }
  return '#/drive/home';
}

function isGoodweAccount(account) {
  return account?.profile === AUTH_PROFILES.GOODWE;
}

function getCurrentAccountFromState(state) {
  const user = state.users.find((item) => item.id === state.auth.currentUserId);
  if (!user) return null;
  return state.accounts.find((account) => account.userId === user.id) ?? null;
}

export function hasPermission(state, permission, account = getCurrentAccountFromState(state)) {
  if (!account || account.status !== 'Ativo') return false;
  return PROFILE_PERMISSIONS[account.profile]?.has(permission) ?? false;
}

export function canAccessRecord(state, record, account = getCurrentAccountFromState(state)) {
  if (!account || account.status !== 'Ativo') return false;
  if (account.profile === AUTH_PROFILES.GOODWE) return true;
  if (account.profile === AUTH_PROFILES.ESTABELECIMENTO) {
    const establishmentId = record?.establishmentId ??
      (state.establishments.some((item) => item.id === record?.id) ? record.id : null);
    return Boolean(establishmentId && establishmentId === account.establishmentId);
  }
  return false;
}

function authorize(next, permission, record = null) {
  const account = getCurrentAccountFromState(next);
  if (!hasPermission(next, permission, account)) {
    return { ok: false, message: 'Seu perfil nao possui permissao para esta acao.' };
  }
  if (record && !canAccessRecord(next, record, account)) {
    return { ok: false, message: 'Este registro nao pertence ao escopo autorizado da conta.' };
  }
  return { ok: true, account };
}

function audit(next, { action, entityType, entityId, summary, reason = '', origin = 'Backoffice', changes = [] }) {
  const account = getCurrentAccountFromState(next);
  const user = next.users.find((item) => item.id === account?.userId);
  next.auditLogs ||= [];
  next.auditLogs.unshift({
    id: nextId('audit', next.auditLogs),
    at: next.now,
    userId: user?.id ?? 'system',
    userName: user?.name ?? 'Sistema ChargeGrid',
    profile: account?.profile ?? 'SYSTEM',
    action,
    entityType,
    entityId,
    summary,
    origin,
    reason,
    changes
  });
}

function ensureGoodweAction(next) {
  return authorize(next, PERMISSIONS.STRUCTURE_MANAGE);
}

function getFirstLocationId(next, establishmentId) {
  return next.locations.find((location) => location.establishmentId === establishmentId)?.id ?? null;
}

function createLocationRecord(next, payload) {
  const id = createEntityId('loc', payload.name, next.locations);
  const coordinates = resolveLocationCoordinates(payload);
  return {
    id,
    establishmentId: payload.establishmentId,
    name: payload.name,
    address: payload.address,
    number: payload.number,
    complement: payload.complement ?? '',
    city: payload.city,
    state: payload.state,
    zipCode: payload.zipCode,
    country: coordinates.country,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    geocodingPrecision: coordinates.geocodingPrecision,
    formattedAddress: payload.formattedAddress ?? '',
    description: payload.description ?? '',
    status: payload.status ?? 'Ativo',
    coverImage: payload.coverImage || '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg',
    gallery: [payload.galleryImage1, payload.galleryImage2].filter(Boolean),
    operatingHours: payload.operatingHours || '24 horas',
    operationalNotes: payload.operationalNotes ?? ''
  };
}

function createChargerRecord(next, payload) {
  const publicId = createChargerPublicId(payload.identifier, next.chargers);
  return {
    id: publicId,
    internalId: payload.internalId || publicId,
    serial: payload.serial,
    model: payload.model,
    powerKw: Number(payload.powerKw),
    establishmentId: payload.establishmentId,
    locationId: payload.locationId,
    installationDate: payload.installationDate || next.now.slice(0, 10),
    status: payload.status || 'available',
    currentPowerKw: 0,
    linkedSessionId: null,
    todayEnergyKwh: 0,
    todayRevenue: 0,
    utilizationPercent: 0,
    lastCommunication: next.now,
    technicalNotes: payload.technicalNotes ?? '',
    ports: Number(payload.ports ?? 1),
    connectionType: payload.connectionType || 'Tipo 2',
    firmware: payload.firmware || 'Nao informado',
    image: payload.image || '/assets/sems/devices/charging_pile_off.b86d796d.png',
    healthScore: Number(payload.healthScore ?? 96),
    anomaly: null,
    assetTag: payload.assetTag || payload.internalId || publicId,
    warrantyEndDate: payload.warrantyEndDate || '',
    maintenancePlan: payload.maintenancePlan || 'Preventiva semestral',
    nextMaintenanceDate: payload.nextMaintenanceDate || '',
    commissioningStatus: payload.commissioningStatus || 'Pendente'
  };
}

export function createStore() {
  let state = loadState();
  const listeners = new Set();

  const notify = () => {
    listeners.forEach((listener) => listener(state));
  };

  function setState(nextState) {
    state = nextState;
    persistState(state);
    notify();
  }

  function dispatch(action) {
    const next = clone(state);
    let result = { ok: true };

    switch (action.type) {
      case 'LOGIN': {
        const account = next.accounts.find(
          (item) =>
            item.email === action.payload.email &&
            item.password === action.payload.password &&
            item.status !== 'Inativo'
        );

        if (!account) {
          next.auth.error = 'Credenciais invalidas.';
          result = { ok: false, message: next.auth.error };
        } else {
          next.auth.currentUserId = account.userId;
          next.auth.error = null;

          if (account.profile === AUTH_PROFILES.ESTABELECIMENTO && account.establishmentId) {
            next.ui.selectedEstablishmentId = account.establishmentId;
            next.ui.selectedLocationId = getFirstLocationId(next, account.establishmentId);
          }

          result = { ok: true, account };
        }
        break;
      }
      case 'LOGOUT': {
        next.auth.currentUserId = null;
        next.auth.error = null;
        result = { ok: true };
        break;
      }
      case 'CLEAR_AUTH_ERROR': {
        next.auth.error = null;
        break;
      }
      case 'TICK': {
        runTick(next);
        break;
      }
      case 'START_SESSION': {
        const paymentStatus = action.payload.paymentStatus ?? next.simulation.nextPaymentStatus;
        result = buildNewSession({ state: next, payload: action.payload, paymentStatus });
        break;
      }
      case 'END_SESSION': {
        const session = finalizeSession(next, action.payload.sessionId, action.payload.reason ?? 'manual');
        if (!session) {
          result = { ok: false, message: 'Sessao ativa nao encontrada.' };
        } else {
          result = { ok: true, session };
        }
        break;
      }
      case 'JOIN_QUEUE': {
        next.queues.push({
          id: nextId('Q', next.queues),
          establishmentId: action.payload.establishmentId,
          locationId: action.payload.locationId ?? null,
          driverId: action.payload.driverId,
          driverName: action.payload.driverName,
          vehicle: action.payload.vehicle,
          chargerPreference: action.payload.chargerPreference,
          enteredAt: next.now,
          status: 'waiting',
          note: action.payload.note ?? 'Aguardando disponibilidade'
        });
        break;
      }
      case 'SET_CHARGER_STATUS': {
        const charger = next.chargers.find((item) => item.id === action.payload.chargerId);
        if (charger) {
          charger.status = action.payload.status;
          charger.currentPowerKw = action.payload.currentPowerKw ?? charger.currentPowerKw;
          charger.lastCommunication = next.now;
          if (action.payload.status === 'offline') {
            charger.linkedSessionId = null;
            charger.currentPowerKw = 0;
          }
        }
        break;
      }
      case 'UPDATE_ENERGY': {
        const energy = energyForAction(next, action.payload);
        if (energy) {
          Object.assign(energy, action.payload.patch);
          if (energy.baseLoadKw + energy.chargerLoadKw !== energy.demandKw) {
            energy.demandKw = round(energy.baseLoadKw + energy.chargerLoadKw);
          }
          computeEnergyState(energy);
          if (action.payload.locationId) syncEstablishmentEnergy(next, action.payload.establishmentId);
        }
        break;
      }
      case 'SET_SIMULATION_PAYMENT': {
        next.simulation.nextPaymentStatus = action.payload.status;
        break;
      }
      case 'SET_UI': {
        next.ui = {
          ...next.ui,
          ...action.payload
        };
        break;
      }
      case 'UPDATE_DRIVER_PROFILE': {
        const user = next.users.find((item) => item.id === action.payload.userId);
        if (user) {
          Object.assign(user, action.payload.patch);
        }
        break;
      }
      case 'APPROVE_PAYMENT': {
        const session = next.sessions.find((item) => item.id === action.payload.sessionId);
        if (session && session.payment.status !== 'Aprovado') {
          session.payment.status = 'Aprovado';
        }
        break;
      }
      case 'DECLINE_PAYMENT': {
        const session = next.sessions.find((item) => item.id === action.payload.sessionId);
        if (session) {
          session.payment.status = 'Recusado';
          if (session.status === 'active') {
            finalizeSession(next, session.id, 'pagamento_recusado');
          }
        }
        break;
      }
      case 'SIMULATE_PEAK': {
        const energy = energyForAction(next, action.payload);
        if (energy) {
          energy.baseLoadKw = round(Math.max(0, energy.baseLoadKw + 28));
          energy.demandKw = round(energy.baseLoadKw + energy.chargerLoadKw);
          computeEnergyState(energy);
          if (action.payload.locationId) syncEstablishmentEnergy(next, action.payload.establishmentId);
          tryReleaseQueue(next, action.payload.establishmentId);
        }
        break;
      }
      case 'SIMULATE_CRITICAL': {
        const energy = energyForAction(next, action.payload);
        if (energy) {
          energy.batterySocPercent = 33;
          energy.baseLoadKw = round(Math.max(energy.baseLoadKw, energy.contractLimitKw - 15));
          energy.demandKw = round(energy.baseLoadKw + energy.chargerLoadKw);
          computeEnergyState(energy);
          if (action.payload.locationId) syncEstablishmentEnergy(next, action.payload.establishmentId);
        }
        break;
      }
      case 'SIMULATE_FAVORABLE': {
        const energy = energyForAction(next, action.payload);
        if (energy) {
          energy.baseLoadKw = Math.max(0, energy.baseLoadKw - 22);
          energy.solarKw = energy.solarKw + 18;
          energy.batterySocPercent = Math.min(98, energy.batterySocPercent + 14);
          energy.demandKw = round(energy.baseLoadKw + energy.chargerLoadKw);
          computeEnergyState(energy);
          if (action.payload.locationId) syncEstablishmentEnergy(next, action.payload.establishmentId);
          tryReleaseQueue(next, action.payload.establishmentId);
        }
        break;
      }
      case 'SIMULATE_ALERT': {
        const energy = energyForAction(next, action.payload);
        if (energy) {
          energy.baseLoadKw = Math.min(energy.contractLimitKw - 6, energy.baseLoadKw + 12);
          energy.solarKw = Math.max(0, energy.solarKw - 6);
          energy.batterySocPercent = Math.max(35, energy.batterySocPercent - 10);
          energy.demandKw = round(energy.baseLoadKw + energy.chargerLoadKw);
          computeEnergyState(energy);
          if (action.payload.locationId) syncEstablishmentEnergy(next, action.payload.establishmentId);
          tryReleaseQueue(next, action.payload.establishmentId);
        }
        break;
      }
      case 'CREATE_CLIENT': {
        const permission = authorize(next, PERMISSIONS.CLIENT_MANAGE);
        const payload = action.payload;
        if (!permission.ok) {
          result = permission;
          break;
        }
        if (!payload.name?.trim() || !payload.corporateName?.trim() || !payload.document?.trim()) {
          result = { ok: false, message: 'Nome, razao social e documento sao obrigatorios.' };
          break;
        }
        if (next.clients.some((item) => item.document === payload.document.trim())) {
          result = { ok: false, message: 'Ja existe um cliente com este documento.' };
          break;
        }
        const clientId = createEntityId('cli', payload.name, next.clients);
        const client = {
          id: clientId,
          name: payload.name.trim(),
          corporateName: payload.corporateName.trim(),
          document: payload.document.trim(),
          segment: payload.segment || 'Comercial',
          tier: payload.tier || 'Growth',
          lifecycle: payload.lifecycle || 'Onboarding',
          status: payload.status || 'Ativo',
          healthScore: 100,
          owner: payload.owner || permission.account.email,
          primaryContactId: null,
          city: payload.city || '',
          state: payload.state || '',
          image: payload.image || '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg',
          createdAt: next.now,
          notes: payload.notes || ''
        };
        next.clients.push(client);
        if (payload.contactName && payload.contactEmail) {
          const contact = {
            id: createEntityId('contact', payload.contactName, next.contacts),
            clientId,
            name: payload.contactName,
            role: payload.contactRole || 'Responsavel',
            email: payload.contactEmail,
            phone: payload.contactPhone || '',
            primary: true
          };
          next.contacts.push(contact);
          client.primaryContactId = contact.id;
        }
        audit(next, { action: 'CREATE', entityType: 'client', entityId: clientId, summary: `Cliente ${client.name} criado`, reason: payload.reason || 'Novo relacionamento comercial' });
        result = { ok: true, clientId, message: 'Cliente comercial criado com sucesso.' };
        break;
      }
      case 'UPDATE_CLIENT': {
        const client = next.clients.find((item) => item.id === action.payload.clientId);
        const permission = authorize(next, PERMISSIONS.CLIENT_MANAGE, client);
        if (!client || !permission.ok) {
          result = client ? permission : { ok: false, message: 'Cliente nao encontrado.' };
          break;
        }
        if (!action.payload.reason?.trim()) {
          result = { ok: false, message: 'Informe o motivo da alteracao para a auditoria.' };
          break;
        }
        const editable = ['name', 'corporateName', 'segment', 'tier', 'lifecycle', 'status', 'owner', 'city', 'state', 'notes', 'image'];
        const changes = [];
        editable.forEach((field) => {
          if (action.payload[field] !== undefined && action.payload[field] !== client[field]) {
            changes.push({ field, before: client[field] ?? '', after: action.payload[field] });
            client[field] = action.payload[field];
          }
        });
        audit(next, { action: 'UPDATE', entityType: 'client', entityId: client.id, summary: `Cadastro de ${client.name} atualizado`, reason: action.payload.reason, changes });
        result = { ok: true, message: 'Cliente atualizado e alteracao auditada.' };
        break;
      }
      case 'CREATE_CONTRACT': {
        const permission = authorize(next, PERMISSIONS.CONTRACT_MANAGE);
        const payload = action.payload;
        const client = next.clients.find((item) => item.id === payload.clientId);
        if (!permission.ok || !client) {
          result = !permission.ok ? permission : { ok: false, message: 'Cliente do contrato nao encontrado.' };
          break;
        }
        if (!payload.name || !payload.startDate || !payload.renewalDate) {
          result = { ok: false, message: 'Nome, inicio e renovacao do contrato sao obrigatorios.' };
          break;
        }
        const contract = {
          id: nextId('ctr', next.contracts),
          code: `CG-CTR-${new Date(next.now).getFullYear()}-${String(next.contracts.length + 1).padStart(3, '0')}`,
          clientId: client.id,
          establishmentId: payload.establishmentId || null,
          name: payload.name,
          model: payload.model || 'Hibrido',
          monthlyFee: Number(payload.monthlyFee || 0),
          perActiveCharger: Number(payload.perActiveCharger || 0),
          perSession: Number(payload.perSession || 0),
          revenueSharePercent: Number(payload.revenueSharePercent || 0),
          marginSharePercent: Number(payload.marginSharePercent || 0),
          startDate: payload.startDate,
          renewalDate: payload.renewalDate,
          billingCycle: payload.billingCycle || 'Mensal',
          paymentTermsDays: Number(payload.paymentTermsDays || 15),
          slaHours: Number(payload.slaHours || 8),
          status: payload.status || 'Em aprovacao',
          notes: payload.notes || ''
        };
        next.contracts.push(contract);
        if (contract.establishmentId) {
          const establishment = next.establishments.find((item) => item.id === contract.establishmentId);
          if (establishment) establishment.contractId = contract.id;
        }
        audit(next, { action: 'CREATE', entityType: 'contract', entityId: contract.id, summary: `Contrato ${contract.code} criado para ${client.name}`, reason: payload.reason || 'Formalizacao comercial' });
        result = { ok: true, contractId: contract.id, message: 'Contrato criado e vinculado ao cliente.' };
        break;
      }
      case 'CREATE_INSTALLATION': {
        const permission = authorize(next, PERMISSIONS.INSTALLATION_MANAGE);
        const payload = action.payload;
        const location = next.locations.find((item) => item.id === payload.locationId && item.establishmentId === payload.establishmentId);
        const establishment = next.establishments.find((item) => item.id === payload.establishmentId);
        if (!permission.ok || !location || !establishment) {
          result = !permission.ok ? permission : { ok: false, message: 'Escopo da implantacao invalido.' };
          break;
        }
        const installation = {
          id: nextId('ins', next.installations),
          code: `CG-IMP-${new Date(next.now).getFullYear()}-${String(next.installations.length + 1).padStart(3, '0')}`,
          clientId: establishment.clientId,
          establishmentId: establishment.id,
          locationId: location.id,
          status: 'Planejada',
          progress: 0,
          owner: payload.owner,
          plannedStart: payload.plannedStart,
          plannedEnd: payload.plannedEnd,
          actualEnd: '',
          checklist: ['Vistoria tecnica', 'Validacao eletrica', 'Infraestrutura civil', 'Instalacao dos equipamentos', 'Comissionamento', 'Aceite do cliente'].map((label, index) => ({ id: `step-${index + 1}`, label, done: false }))
        };
        next.installations.push(installation);
        audit(next, { action: 'CREATE', entityType: 'installation', entityId: installation.id, summary: `Implantacao ${installation.code} criada`, reason: payload.reason || 'Novo ponto contratado' });
        result = { ok: true, installationId: installation.id, message: 'Plano de implantacao criado.' };
        break;
      }
      case 'TOGGLE_INSTALLATION_STEP': {
        const installation = next.installations.find((item) => item.id === action.payload.installationId);
        const permission = authorize(next, PERMISSIONS.INSTALLATION_MANAGE, installation);
        if (!installation || !permission.ok) {
          result = installation ? permission : { ok: false, message: 'Implantacao nao encontrada.' };
          break;
        }
        const step = installation.checklist.find((item) => item.id === action.payload.stepId);
        if (!step) {
          result = { ok: false, message: 'Etapa nao encontrada.' };
          break;
        }
        step.done = !step.done;
        const completed = installation.checklist.filter((item) => item.done).length;
        installation.progress = Math.round((completed / installation.checklist.length) * 100);
        installation.status = installation.progress === 100 ? 'Concluida' : installation.progress ? 'Em andamento' : 'Planejada';
        if (installation.progress === 100) installation.actualEnd = next.now.slice(0, 10);
        audit(next, { action: 'UPDATE', entityType: 'installation', entityId: installation.id, summary: `${step.label}: ${step.done ? 'concluida' : 'reaberta'}`, reason: action.payload.reason || 'Atualizacao de checklist' });
        result = { ok: true, message: 'Checklist e progresso atualizados.' };
        break;
      }
      case 'CREATE_SUPPORT_TICKET': {
        const permission = authorize(next, PERMISSIONS.SUPPORT_CREATE);
        const payload = action.payload;
        const establishment = next.establishments.find((item) => item.id === payload.establishmentId);
        if (!permission.ok || !establishment || !canAccessRecord(next, establishment, permission.account)) {
          result = !permission.ok ? permission : { ok: false, message: 'Estabelecimento fora do escopo autorizado.' };
          break;
        }
        const ticket = {
          id: nextId('ticket', next.supportTickets),
          code: `SUP-${new Date(next.now).getFullYear()}-${String(next.supportTickets.length + 1).padStart(4, '0')}`,
          clientId: establishment.clientId,
          establishmentId: establishment.id,
          locationId: payload.locationId || null,
          chargerId: payload.chargerId || null,
          category: payload.category || 'Operacao',
          severity: payload.severity || 'Media',
          title: payload.title,
          description: payload.description,
          status: 'Aberto',
          slaDueAt: addMinutes(next.now, payload.severity === 'Critica' ? 120 : payload.severity === 'Alta' ? 480 : 1440),
          owner: 'Triagem GoodWe',
          requester: payload.requester || permission.account.email,
          createdAt: next.now,
          updates: []
        };
        next.supportTickets.unshift(ticket);
        audit(next, { action: 'CREATE', entityType: 'supportTicket', entityId: ticket.id, summary: `Chamado ${ticket.code} aberto`, reason: ticket.title, origin: permission.account.profile === AUTH_PROFILES.GOODWE ? 'Backoffice' : 'Portal Business' });
        result = { ok: true, ticketId: ticket.id, message: 'Chamado aberto e enviado para a triagem GoodWe.' };
        break;
      }
      case 'UPDATE_SUPPORT_TICKET': {
        const ticket = next.supportTickets.find((item) => item.id === action.payload.ticketId);
        const permission = authorize(next, PERMISSIONS.SUPPORT_MANAGE, ticket);
        if (!ticket || !permission.ok) {
          result = ticket ? permission : { ok: false, message: 'Chamado nao encontrado.' };
          break;
        }
        const before = { status: ticket.status, owner: ticket.owner };
        ticket.status = action.payload.status || ticket.status;
        ticket.owner = action.payload.owner || ticket.owner;
        if (action.payload.message) ticket.updates.push({ at: next.now, author: permission.account.email, message: action.payload.message });
        audit(next, { action: 'UPDATE', entityType: 'supportTicket', entityId: ticket.id, summary: `Chamado ${ticket.code} atualizado`, reason: action.payload.reason || action.payload.message || 'Tratativa operacional', changes: [{ field: 'status', before: before.status, after: ticket.status }, { field: 'owner', before: before.owner, after: ticket.owner }] });
        result = { ok: true, message: 'Chamado atualizado e historico preservado.' };
        break;
      }
      case 'MARK_NOTIFICATION_READ': {
        const notification = next.notifications.find((item) => item.id === action.payload.notificationId);
        if (notification) notification.read = true;
        break;
      }
      case 'CREATE_ESTABLISHMENT': {
        const permission = ensureGoodweAction(next);
        if (!permission.ok) {
          result = permission;
          break;
        }

        const payload = action.payload;
        if (
          !payload.name ||
          !payload.cnpj ||
          !payload.email ||
          !payload.responsible ||
          !payload.phone ||
          !payload.city ||
          !payload.state ||
          !payload.address ||
          !payload.number ||
          !payload.zipCode
        ) {
          result = { ok: false, message: 'Preencha todos os campos obrigatorios do estabelecimento.' };
          break;
        }

        if (!payload.accountEmail || !payload.accountPassword) {
          result = { ok: false, message: 'Informe email e senha para o acesso do estabelecimento.' };
          break;
        }

        const duplicatedCnpj = next.establishments.some((item) => item.cnpj === payload.cnpj);
        if (duplicatedCnpj) {
          result = { ok: false, message: 'Ja existe estabelecimento com este CNPJ.' };
          break;
        }

        const duplicatedAccountEmail = next.accounts.some((item) => item.email === payload.accountEmail);
        if (duplicatedAccountEmail) {
          result = { ok: false, message: 'Ja existe conta com este email de acesso.' };
          break;
        }

        const id = createEntityId('est', payload.name, next.establishments);
        const contractId = next.contracts[0]?.id ?? null;

        next.establishments.push({
          id,
          clientId: payload.clientId || null,
          name: payload.name,
          corporateName: payload.corporateName,
          cnpj: payload.cnpj,
          responsible: payload.responsible,
          phone: payload.phone,
          email: payload.email,
          notes: payload.notes ?? '',
          status: payload.status ?? 'Ativo',
          city: payload.city,
          state: payload.state,
          address: `${payload.address}, ${payload.number}`,
          contractId,
          pricePerKwh: Number(payload.pricePerKwh ?? 2.95),
          folderImage: payload.folderImage || '/assets/sems/plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg',
          clientType: payload.clientType ?? 'Comercial',
          networkEntryDate: payload.networkEntryDate || next.now.slice(0, 10),
          internalInformation: payload.internalInformation ?? ''
        });

        next.energyByEstablishment[id] = buildDefaultEnergySnapshot();

        const accountResponsible = payload.accountName?.trim() || payload.responsible;
        const userId = createEntityId('user', accountResponsible, next.users);
        next.users.push({
          id: userId,
          name: accountResponsible,
          email: payload.accountEmail,
          phone: payload.phone,
          profile: AUTH_PROFILES.ESTABELECIMENTO,
          establishmentId: id
        });

        const accountId = createEntityId('acc', payload.accountEmail, next.accounts);
        next.accounts.push({
          id: accountId,
          email: payload.accountEmail,
          password: payload.accountPassword,
          profile: AUTH_PROFILES.ESTABELECIMENTO,
          userId,
          establishmentId: id,
          status: payload.accountStatus ?? 'Ativo'
        });

        next.ui.selectedEstablishmentId = id;
        next.ui.selectedLocationId = null;

        audit(next, { action: 'CREATE', entityType: 'establishment', entityId: id, summary: `Estabelecimento ${payload.name} criado`, reason: payload.reason || 'Expansao da estrutura do cliente' });

        result = {
          ok: true,
          establishmentId: id,
          locationId: null,
          accountId,
          message: 'Estabelecimento e acesso criados com sucesso.'
        };
        break;
      }
      case 'CREATE_LOCATION': {
        const permission = ensureGoodweAction(next);
        if (!permission.ok) {
          result = permission;
          break;
        }

        const payload = action.payload;
        const establishment = next.establishments.find((item) => item.id === payload.establishmentId);
        if (!establishment) {
          result = { ok: false, message: 'Estabelecimento nao encontrado para vincular o local.' };
          break;
        }

        if (!payload.name || !payload.address || !payload.city || !payload.state || !payload.zipCode) {
          result = { ok: false, message: 'Preencha os campos obrigatorios do local.' };
          break;
        }

        const location = createLocationRecord(next, payload);
        next.locations.push(location);
        next.energyByLocation ||= {};
        next.energyByLocation[location.id] = buildDefaultEnergySnapshot();
        next.ui.selectedEstablishmentId = establishment.id;
        next.ui.selectedLocationId = location.id;
        next.ui.selectedMapLocationId = location.id;

        const initialChargers = Number(payload.initialChargers ?? 0);
        if (Number.isFinite(initialChargers) && initialChargers > 0) {
          for (let index = 1; index <= initialChargers; index += 1) {
            const charger = createChargerRecord(next, {
              identifier: `${location.name} ${index}`,
              internalId: `${slugify(location.name).toUpperCase()}-${index}`,
              serial: `AUTO-${slugify(location.name).toUpperCase()}-${String(index).padStart(2, '0')}`,
              model: 'GoodWe AC 22',
              powerKw: 22,
              establishmentId: establishment.id,
              locationId: location.id,
              installationDate: next.now.slice(0, 10),
              status: 'available',
              technicalNotes: 'Gerado no cadastro inicial do local'
            });
            next.chargers.push(charger);
          }
        }

        audit(next, { action: 'CREATE', entityType: 'location', entityId: location.id, summary: `Ponto ${location.name} criado`, reason: payload.reason || 'Novo ponto de recarga' });

        result = { ok: true, locationId: location.id, message: 'Local cadastrado com sucesso.' };
        break;
      }
      case 'CREATE_CHARGER': {
        const permission = ensureGoodweAction(next);
        if (!permission.ok) {
          result = permission;
          break;
        }

        const payload = action.payload;
        const location = next.locations.find((item) => item.id === payload.locationId);
        if (!location) {
          result = { ok: false, message: 'Local nao encontrado para o carregador.' };
          break;
        }

        if (!payload.establishmentId || payload.establishmentId !== location.establishmentId) {
          result = {
            ok: false,
            message: 'Carregador deve pertencer ao mesmo estabelecimento do local selecionado.'
          };
          break;
        }

        if (!payload.identifier || !payload.serial || !payload.model || !payload.powerKw) {
          result = { ok: false, message: 'Preencha identificacao, serial, modelo e potencia do carregador.' };
          break;
        }

        const charger = createChargerRecord(next, payload);
        next.chargers.push(charger);
        next.ui.selectedChargerId = charger.id;
        next.ui.selectedLocationId = charger.locationId;
        next.ui.selectedMapLocationId = charger.locationId;

        audit(next, { action: 'CREATE', entityType: 'charger', entityId: charger.id, summary: `Carregador ${charger.id} cadastrado`, reason: payload.reason || 'Instalacao de equipamento' });

        result = { ok: true, chargerId: charger.id, message: 'Carregador cadastrado no local.' };
        break;
      }
      case 'TRANSFER_CHARGER': {
        const permission = ensureGoodweAction(next);
        if (!permission.ok) {
          result = permission;
          break;
        }

        const payload = action.payload;
        const charger = next.chargers.find((item) => item.id === payload.chargerId);
        const targetLocation = next.locations.find((item) => item.id === payload.toLocationId);

        if (!charger || !targetLocation) {
          result = { ok: false, message: 'Carregador ou local de destino nao encontrado.' };
          break;
        }

        if (charger.status === 'charging') {
          result = { ok: false, message: 'Encerrar sessao ativa antes de transferir carregador.' };
          break;
        }

        const fromLocationId = charger.locationId;
        const fromEstablishmentId = charger.establishmentId;
        charger.locationId = targetLocation.id;
        charger.establishmentId = targetLocation.establishmentId;

        next.chargerMovements.unshift({
          id: nextId('MOV', next.chargerMovements),
          chargerId: charger.id,
          fromEstablishmentId,
          fromLocationId,
          toEstablishmentId: targetLocation.establishmentId,
          toLocationId: targetLocation.id,
          changedAt: next.now,
          reason: payload.reason ?? 'Transferencia administrativa GoodWe',
          responsible: payload.responsible ?? permission.account.email
        });

        next.ui.selectedEstablishmentId = targetLocation.establishmentId;
        next.ui.selectedLocationId = targetLocation.id;

        audit(next, { action: 'TRANSFER', entityType: 'charger', entityId: charger.id, summary: `Carregador transferido para ${targetLocation.name}`, reason: payload.reason ?? 'Transferencia administrativa GoodWe', changes: [{ field: 'locationId', before: fromLocationId, after: targetLocation.id }, { field: 'establishmentId', before: fromEstablishmentId, after: targetLocation.establishmentId }] });

        result = {
          ok: true,
          establishmentId: targetLocation.establishmentId,
          locationId: targetLocation.id,
          message: 'Carregador transferido com historico registrado.'
        };
        break;
      }
      case 'CREATE_ESTABLISHMENT_ACCOUNT': {
        const permission = ensureGoodweAction(next);
        if (!permission.ok) {
          result = permission;
          break;
        }

        const payload = action.payload;
        const establishment = next.establishments.find((item) => item.id === payload.establishmentId);

        if (!establishment) {
          result = { ok: false, message: 'Estabelecimento nao encontrado para vincular a conta.' };
          break;
        }

        if (!payload.name || !payload.email || !payload.password) {
          result = { ok: false, message: 'Preencha nome, email e senha temporaria da conta.' };
          break;
        }

        const alreadyExists = next.accounts.some((account) => account.email === payload.email);
        if (alreadyExists) {
          result = { ok: false, message: 'Ja existe conta com este email.' };
          break;
        }

        const userId = createEntityId('user', payload.name, next.users);
        next.users.push({
          id: userId,
          name: payload.name,
          email: payload.email,
          phone: payload.phone ?? establishment.phone,
          role: payload.role ?? 'Gestor',
          profile: AUTH_PROFILES.ESTABELECIMENTO,
          establishmentId: establishment.id
        });

        const accountId = createEntityId('acc', payload.email, next.accounts);
        next.accounts.push({
          id: accountId,
          email: payload.email,
          password: payload.password,
          profile: AUTH_PROFILES.ESTABELECIMENTO,
          userId,
          establishmentId: establishment.id,
          status: payload.status ?? 'Ativo'
        });

        audit(next, { action: 'CREATE', entityType: 'account', entityId: accountId, summary: `Conta ${payload.email} criada`, reason: 'Acesso ao portal Business' });

        result = { ok: true, accountId, message: 'Conta de estabelecimento criada e vinculada.' };
        break;
      }
      case 'UPDATE_ACCOUNT_STATUS': {
        const permission = ensureGoodweAction(next);
        if (!permission.ok) {
          result = permission;
          break;
        }

        const account = next.accounts.find((item) => item.id === action.payload.accountId);
        if (!account) {
          result = { ok: false, message: 'Conta nao encontrada.' };
          break;
        }

        account.status = action.payload.status;
        audit(next, { action: 'UPDATE', entityType: 'account', entityId: account.id, summary: `Conta ${account.email} alterada para ${account.status}`, reason: action.payload.reason || 'Administracao de acesso' });
        result = { ok: true, message: 'Status da conta atualizado.' };
        break;
      }
      case 'RESET_ACCOUNT_PASSWORD': {
        const permission = ensureGoodweAction(next);
        if (!permission.ok) {
          result = permission;
          break;
        }

        const account = next.accounts.find((item) => item.id === action.payload.accountId);
        if (!account || account.profile !== AUTH_PROFILES.ESTABELECIMENTO) {
          result = { ok: false, message: 'Conta de estabelecimento nao encontrada.' };
          break;
        }

        const temporaryPassword = `GoodWe@${String(Date.now()).slice(-4)}`;
        account.password = temporaryPassword;
        account.passwordResetAt = next.now;
        audit(next, { action: 'SECURITY', entityType: 'account', entityId: account.id, summary: `Senha temporaria redefinida para ${account.email}`, reason: 'Solicitacao administrativa' });
        result = { ok: true, temporaryPassword, message: 'Senha temporaria redefinida.' };
        break;
      }
      case 'RESET_DEMO': {
        const fresh = createDemoState();
        state = fresh;
        persistState(state);
        notify();
        return { ok: true };
      }
      default:
        break;
    }

    setState(next);
    return result;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      state = JSON.parse(event.newValue);
      notify();
    } catch {
      // no-op
    }
  });

  window.addEventListener(SYNC_EVENT, () => {
    // Local event intentionally emitted to support immediate same-tab sync.
    notify();
  });

  return {
    getState: () => state,
    dispatch,
    subscribe
  };
}

export function getCurrentUser(state) {
  return state.users.find((item) => item.id === state.auth.currentUserId) ?? null;
}

export function getCurrentAccount(state) {
  const user = getCurrentUser(state);
  if (!user) return null;
  return state.accounts.find((account) => account.userId === user.id) ?? null;
}

export function getSessionById(state, sessionId) {
  return state.sessions.find((item) => item.id === sessionId) ?? null;
}

export function getEstablishmentById(state, establishmentId) {
  return state.establishments.find((item) => item.id === establishmentId) ?? null;
}

export function getLocationById(state, locationId) {
  return state.locations.find((item) => item.id === locationId) ?? null;
}

export function getChargerById(state, chargerId) {
  return state.chargers.find((item) => item.id === chargerId) ?? null;
}

export function getSessionsByEstablishment(state, establishmentId) {
  return state.sessions.filter((session) => session.establishmentId === establishmentId);
}

export function getSessionsByLocation(state, locationId) {
  return state.sessions.filter((session) => session.locationId === locationId);
}

export function getQueuesByEstablishment(state, establishmentId) {
  return state.queues.filter((entry) => entry.establishmentId === establishmentId);
}

export function getChargersByEstablishment(state, establishmentId) {
  return state.chargers.filter((charger) => charger.establishmentId === establishmentId);
}

export function getChargersByLocation(state, locationId) {
  return state.chargers.filter((charger) => charger.locationId === locationId);
}

export function getLocationsByEstablishment(state, establishmentId) {
  return state.locations.filter((location) => location.establishmentId === establishmentId);
}

export function getAccountsByEstablishment(state, establishmentId) {
  return state.accounts.filter(
    (account) =>
      account.profile === AUTH_PROFILES.ESTABELECIMENTO &&
      account.establishmentId === establishmentId
  );
}

export function getClientById(state, clientId) {
  return state.clients.find((item) => item.id === clientId) ?? null;
}

export function getEstablishmentsByClient(state, clientId) {
  return state.establishments.filter((item) => item.clientId === clientId);
}

export function getContractsByClient(state, clientId) {
  return state.contracts.filter((item) => item.clientId === clientId);
}

export function getSupportTicketsByAccount(state, account = getCurrentAccount(state)) {
  if (!account) return [];
  if (account.profile === AUTH_PROFILES.GOODWE) return state.supportTickets;
  if (account.profile === AUTH_PROFILES.ESTABELECIMENTO) {
    return state.supportTickets.filter((item) => item.establishmentId === account.establishmentId);
  }
  return [];
}

export function getDocumentsByAccount(state, account = getCurrentAccount(state)) {
  if (!account) return [];
  if (account.profile === AUTH_PROFILES.GOODWE) return state.documents;
  if (account.profile === AUTH_PROFILES.ESTABELECIMENTO) {
    return state.documents.filter((item) => item.establishmentId === account.establishmentId);
  }
  return [];
}

export function getAccessibleEstablishments(state, account = getCurrentAccount(state)) {
  if (!account) return [];

  if (account.profile === AUTH_PROFILES.GOODWE) {
    return state.establishments;
  }

  if (account.profile === AUTH_PROFILES.ESTABELECIMENTO) {
    return state.establishments.filter((establishment) => establishment.id === account.establishmentId);
  }

  return [];
}

export function getLocationsByAccount(state, account = getCurrentAccount(state)) {
  const establishments = getAccessibleEstablishments(state, account);
  const ids = new Set(establishments.map((item) => item.id));
  return state.locations.filter((location) => ids.has(location.establishmentId));
}

export function getChargersByAccount(state, account = getCurrentAccount(state)) {
  const establishments = getAccessibleEstablishments(state, account);
  const ids = new Set(establishments.map((item) => item.id));
  return state.chargers.filter((charger) => ids.has(charger.establishmentId));
}

export function getNetworkTotals(state) {
  const totalChargers = state.chargers.length;
  const available = state.chargers.filter((charger) => charger.status === 'available').length;
  const charging = state.chargers.filter((charger) => charger.status === 'charging').length;
  const offline = state.chargers.filter((charger) => charger.status === 'offline').length;
  const activeSessions = state.sessions.filter((session) => session.status === 'active');
  const sessionsMonth = state.sessions.filter((session) => session.startedAt.startsWith('2026-08')).length;
  const delivered = round(state.sessions.reduce((sum, session) => sum + session.energyKwh, 0));
  const movedRevenue = round(
    state.sessions.reduce(
      (sum, session) =>
        sum +
        (session.status === 'finished'
          ? session.finalAmount ?? session.consumedAmount
          : session.consumedAmount),
      0
    )
  );
  const goodweRevenue = round(state.financeLedger.reduce((sum, entry) => sum + entry.goodweShare, 0));

  return {
    totalEstablishments: state.establishments.length,
    totalLocations: state.locations.length,
    totalChargers,
    available,
    charging,
    offline,
    activeSessions: activeSessions.length,
    sessionsMonth,
    delivered,
    movedRevenue,
    goodweRevenue
  };
}

export { AUTH_PROFILES };

