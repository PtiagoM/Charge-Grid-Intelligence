// @ts-nocheck
import {
  getChargersByEstablishment,
  getChargersByLocation,
  getEstablishmentById,
  getLocationById,
  getLocationsByEstablishment,
  getNetworkTotals,
  getQueuesByEstablishment,
  getSessionsByEstablishment,
  getSessionsByLocation
} from './store.js';

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function summarizeChargers(chargers) {
  const available = chargers.filter((charger) => charger.status === 'available').length;
  const inUse = chargers.filter((charger) => charger.status === 'charging').length;
  const offline = chargers.filter((charger) => charger.status === 'offline').length;

  return {
    total: chargers.length,
    available,
    inUse,
    offline
  };
}

function summarizeSessions(sessions) {
  const activeSessions = sessions.filter((session) => session.status === 'active');
  const finishedSessions = sessions.filter((session) => session.status === 'finished');
  const monthRevenue = sessions
    .filter((session) => session.startedAt.startsWith('2026-08'))
    .reduce(
      (sum, session) =>
        sum +
        (session.status === 'finished'
          ? session.finalAmount ?? session.consumedAmount
          : session.consumedAmount),
      0
    );

  return {
    activeSessions,
    finishedSessions,
    monthRevenue: round(monthRevenue),
    deliveredMonth: round(sessions.reduce((sum, session) => sum + session.energyKwh, 0)),
    deliveredToday: round(activeSessions.reduce((sum, session) => sum + session.energyKwh, 0)),
    todayRevenue: round(activeSessions.reduce((sum, session) => sum + session.consumedAmount, 0)),
    approved: sessions.filter((session) => session.payment.status === 'Aprovado').length,
    pending: sessions.filter((session) => session.payment.status !== 'Aprovado').length
  };
}

function buildLocationSummary(state, location) {
  const chargers = getChargersByLocation(state, location.id);
  const sessions = getSessionsByLocation(state, location.id);
  const chargerStats = summarizeChargers(chargers);
  const sessionStats = summarizeSessions(sessions);
  const waiting = state.queues.filter(
    (item) => item.locationId === location.id && item.status === 'waiting'
  ).length;
  const energy = state.energyByLocation?.[location.id] ?? state.energyByEstablishment[location.establishmentId];
  const healthScore = chargers.length
    ? Math.round(chargers.reduce((sum, charger) => sum + Number(charger.healthScore ?? 92), 0) / chargers.length)
    : 100;

  return {
    location,
    chargers,
    sessions,
    waiting,
    energy,
    healthScore,
    ...chargerStats,
    sessionsNow: sessionStats.activeSessions.length,
    deliveredMonth: sessionStats.deliveredMonth,
    monthRevenue: sessionStats.monthRevenue
  };
}

export function stateDistribution(state) {
  const focusedStates = ['SP', 'RJ', 'MG', 'PR', 'SC'];
  const rows = focusedStates.map((name) => ({
    state: name,
    chargers: state.chargers.filter((charger) => {
      const establishment = state.establishments.find((item) => item.id === charger.establishmentId);
      return establishment?.state === name;
    }).length
  }));

  const others = state.chargers.filter((charger) => {
    const establishment = state.establishments.find((item) => item.id === charger.establishmentId);
    return establishment && !focusedStates.includes(establishment.state);
  }).length;

  rows.push({ state: 'Outros', chargers: others });
  return rows;
}

export function locationMetrics(state, locationId) {
  const location = getLocationById(state, locationId);
  if (!location) return null;

  const establishment = getEstablishmentById(state, location.establishmentId);
  const chargers = getChargersByLocation(state, location.id);
  const sessions = getSessionsByLocation(state, location.id);
  const chargerStats = summarizeChargers(chargers);
  const sessionStats = summarizeSessions(sessions);
  const energy = state.energyByLocation?.[location.id] ?? state.energyByEstablishment[location.establishmentId];
  const healthScore = chargers.length
    ? Math.round(chargers.reduce((sum, charger) => sum + Number(charger.healthScore ?? 92), 0) / chargers.length)
    : 100;

  return {
    location,
    establishment,
    chargers,
    sessions,
    queue: state.queues.filter((item) => item.locationId === location.id),
    energy,
    healthScore,
    ...chargerStats,
    sessionsNow: sessionStats.activeSessions.length,
    deliveredToday: sessionStats.deliveredToday,
    deliveredMonth: sessionStats.deliveredMonth,
    monthRevenue: sessionStats.monthRevenue
  };
}

export function establishmentMetrics(state, establishmentId) {
  const establishment = getEstablishmentById(state, establishmentId);
  const sessions = getSessionsByEstablishment(state, establishmentId);
  const chargers = getChargersByEstablishment(state, establishmentId);
  const queue = getQueuesByEstablishment(state, establishmentId);
  const locations = getLocationsByEstablishment(state, establishmentId);
  const energy = state.energyByEstablishment[establishmentId];

  const chargerStats = summarizeChargers(chargers);
  const sessionStats = summarizeSessions(sessions);
  const ticket = sessions.length > 0 ? sessionStats.monthRevenue / sessions.length : 0;

  return {
    establishment,
    locations,
    locationSummaries: locations.map((location) => buildLocationSummary(state, location)),
    sessions,
    activeSessions: sessionStats.activeSessions,
    finishedSessions: sessionStats.finishedSessions,
    chargers,
    queue,
    energy,
    available: chargerStats.available,
    inUse: chargerStats.inUse,
    offline: chargerStats.offline,
    todayRevenue: sessionStats.todayRevenue,
    monthRevenue: sessionStats.monthRevenue,
    ticket: round(ticket),
    deliveredToday: sessionStats.deliveredToday,
    deliveredMonth: sessionStats.deliveredMonth,
    approved: sessionStats.approved,
    pending: sessionStats.pending,
    occupancyRate: chargers.length ? round((chargerStats.inUse / chargers.length) * 100) : 0
  };
}

export function goodweMetrics(state) {
  const totals = getNetworkTotals(state);
  const growth = [8, 10, 12, 14, 17, 19];
  const utilization = [61, 64, 67, 69, 72, 75];

  const contractsActive = state.contracts.filter((contract) => contract.status === 'Ativo').length;
  const recurringRevenue = state.contracts.reduce((sum, contract) => sum + contract.monthlyFee, 0);

  const opportunities = state.establishments
    .map((establishment) => {
      const metrics = establishmentMetrics(state, establishment.id);
      const queueRisk = metrics.queue.filter((entry) => entry.status === 'waiting').length;
      const saturationRisk =
        metrics.occupancyRate > 75 ? 'Alto' : metrics.occupancyRate > 55 ? 'Medio' : 'Baixo';
      const expansionPotential = round((metrics.occupancyRate + queueRisk * 8) / 10);
      return {
        id: establishment.id,
        name: establishment.name,
        saturationRisk,
        queueRisk,
        expansionPotential,
        occupancyRate: metrics.occupancyRate,
        projectedRevenue: round(metrics.monthRevenue * 1.12)
      };
    })
    .sort((a, b) => b.expansionPotential - a.expansionPotential);

  return {
    totals,
    growth,
    utilization,
    contractsActive,
    recurringRevenue,
    opportunities
  };
}

export function intelligenceByRole(state, role, establishmentId = 'est-fiap', driverId = 'user-driver-01') {
  const metrics = establishmentMetrics(state, establishmentId);
  const waitRisk = metrics.queue.filter((entry) => entry.status === 'waiting').length;

  if (role === 'driver') {
    const best = state.driverDiscovery
      .map((spot) => {
        const est = getEstablishmentById(state, spot.establishmentId);
        const chargers = getChargersByEstablishment(state, spot.establishmentId);
        const available = chargers.filter((charger) => charger.status === 'available').length;
        return {
          name: est.name,
          score: round(available * 10 + (10 - spot.distanceKm) * 5 - spot.queueEstimateMinutes / 2),
          wait: spot.queueEstimateMinutes,
          price: est.pricePerKwh
        };
      })
      .sort((a, b) => b.score - a.score)[0];

    return [
      {
        title: 'Melhor carregador agora',
        text: `${best.name} apresenta a melhor combinacao de disponibilidade e distancia.`
      },
      {
        title: 'Menor espera prevista',
        text: `Tempo estimado de espera: ${best.wait} minutos.`
      },
      {
        title: 'Recomendacao distancia x disponibilidade',
        text: `Com tarifa de R$ ${best.price.toFixed(2).replace('.', ',')}/kWh, o ponto recomendado maximiza liberacao rapida.`
      }
    ];
  }

  if (role === 'business') {
    const peakForecast = round(metrics.inUse * 1.22 + waitRisk * 3);
    return [
      {
        title: 'Previsao de pico',
        text: `A ocupacao pode atingir ${Math.min(100, peakForecast)}% nas proximas 2 horas.`
      },
      {
        title: 'Risco de saturacao',
        text: waitRisk > 0 ? 'Fila crescente detectada; manter politica de prioridade por potencia.' : 'Sem risco imediato de saturacao.'
      },
      {
        title: 'Receita projetada',
        text: `Projecao mensal ajustada: R$ ${(metrics.monthRevenue * 1.15).toFixed(2).replace('.', ',')}.`
      },
      {
        title: 'Carregadores subutilizados',
        text:
          metrics.chargers
            .filter((charger) => charger.utilizationPercent < 45)
            .map((charger) => charger.id)
            .join(', ') || 'Nenhum carregador subutilizado no momento.'
      }
    ];
  }

  const opportunities = goodweMetrics(state).opportunities.slice(0, 3);
  return [
    {
      title: 'Clientes proximos da saturacao',
      text: opportunities.map((item) => `${item.name} (${item.occupancyRate}% ocupacao)`).join(' | ')
    },
    {
      title: 'Oportunidades de expansao',
      text: opportunities.map((item) => `${item.name}: potencial ${item.expansionPotential}/10`).join(' | ')
    },
    {
      title: 'Receita prevista',
      text: `Receita total projetada da rede: R$ ${opportunities
        .reduce((sum, item) => sum + item.projectedRevenue, 0)
        .toFixed(2)
        .replace('.', ',')}.`
    }
  ];
}

export function getMvpMetrics(state, establishmentId = 'est-fiap') {
  const base = establishmentMetrics(state, establishmentId);
  const sessionsNow = base.activeSessions.length;
  const waiting = base.queue.filter((item) => item.status === 'waiting').length;
  const averageSessionMinutes = base.sessions.length
    ? round(base.sessions.reduce((sum, item) => sum + item.durationMinutes, 0) / base.sessions.length)
    : 0;

  const primaryRecommendation =
    base.energy.state === 'Critico'
      ? 'Priorizar seguranca: manter novas sessoes em espera ate recuperar margem energetica.'
      : base.energy.state === 'Alerta'
        ? 'Aplicar limitacao de potencia em novas sessoes e monitorar fila em tempo real.'
        : 'Janela favoravel: liberar sessoes com monitoramento continuo da margem.';

  return {
    ...base,
    waiting,
    sessionsNow,
    averageSessionMinutes,
    primaryRecommendation,
    utilizationByHour: [42, 55, 62, 71, 79, 86],
    utilizationLabels: ['09h', '11h', '13h', '15h', '17h', '19h']
  };
}

export function buildDemandForecast(state, establishmentId = 'est-fiap') {
  const metrics = getMvpMetrics(state, establishmentId);
  const energy = metrics.energy;
  const demandTrend = energy.generationTrend;
  const occupancyTrend = energy.occupancyTrend;

  const demandSlope =
    demandTrend.length >= 4
      ? round((demandTrend[demandTrend.length - 1] - demandTrend[demandTrend.length - 4]) / 3)
      : 0;
  const occupancySlope =
    occupancyTrend.length >= 4
      ? round((occupancyTrend[occupancyTrend.length - 1] - occupancyTrend[occupancyTrend.length - 4]) / 3)
      : 0;

  const waitingPressure = metrics.waiting * 4;
  const forecast30 = round(energy.demandKw + demandSlope * 1.8 + waitingPressure);
  const forecast60 = round(forecast30 + demandSlope * 1.6 + waitingPressure / 2);

  const occupancyCurrent = metrics.occupancyRate;
  const occupancy30 = clamp(round(occupancyCurrent + occupancySlope * 1.5 + metrics.waiting * 6), 0, 100);
  const occupancy60 = clamp(round(occupancy30 + occupancySlope * 1.2), 0, 100);

  const risk =
    forecast60 >= energy.contractLimitKw * 0.95 || occupancy60 >= 90
      ? 'Alto'
      : forecast60 >= energy.contractLimitKw * 0.85 || occupancy60 >= 78
        ? 'Medio'
        : 'Baixo';

  const recommendations = [
    risk === 'Alto'
      ? 'Alta probabilidade de pico em ate 60 minutos. Reduzir novas liberacoes e manter fila.'
      : 'Sem risco alto de saturacao no curto prazo. Operacao pode seguir com cautela.',
    energy.solarKw > energy.chargerLoadKw * 0.6
      ? 'Janela solar favoravel: priorizar sessoes antes da queda de irradiacao.'
      : 'Baixa disponibilidade solar: preservar margem da planta nas proximas liberacoes.'
  ];

  return {
    demandNow: energy.demandKw,
    demand30: forecast30,
    demand60: forecast60,
    limit: energy.contractLimitKw,
    occupancyNow: occupancyCurrent,
    occupancy30,
    occupancy60,
    risk,
    recommendations,
    relationship: 'A IA preve demanda e ocupacao. O motor de regras valida seguranca energetica antes da liberacao.'
  };
}

