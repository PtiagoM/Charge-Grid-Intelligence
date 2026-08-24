const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export interface TariffInput {
  energyKwh: number;
  baseRate?: number;
  isPeak?: boolean;
  isCritical?: boolean;
  hasHighSolar?: boolean;
  idleMinutesAfterEnd?: number;
  idleToleranceMinutes?: number;
  idleRatePerMinute?: number;
}

export function calculateTariff({
  energyKwh,
  baseRate = 2,
  isPeak = false,
  isCritical = false,
  hasHighSolar = false,
  idleMinutesAfterEnd = 0,
  idleToleranceMinutes = 15,
  idleRatePerMinute = 0.5
}: TariffInput) {
  const appliedRules: string[] = [];
  let multiplier = 1;

  if (isPeak) {
    multiplier *= 1.3;
    appliedRules.push("peak");
  }
  if (isCritical) {
    multiplier *= 1.2;
    appliedRules.push("critical_state");
  }
  if (hasHighSolar) {
    multiplier *= 0.85;
    appliedRules.push("high_solar_discount");
  }

  const ratePerKwh = round(baseRate * multiplier);
  const energyCost = round(energyKwh * ratePerKwh);
  const idleBillableMinutes = Math.max(0, idleMinutesAfterEnd - idleToleranceMinutes);
  const idleCost = round(idleBillableMinutes * idleRatePerMinute);

  return {
    ratePerKwh,
    energyCost,
    idleBillableMinutes,
    idleCost,
    totalCost: round(energyCost + idleCost),
    appliedRules
  };
}

export function getDemandState({ powerMarginPercent, socPercent }: { powerMarginPercent: number; socPercent: number }) {
  if (powerMarginPercent < 10 || socPercent < 40) {
    return { state: "Crítico", tone: "danger", action: "Bloquear novas sessões temporariamente" } as const;
  }
  if ((powerMarginPercent >= 10 && powerMarginPercent <= 30) || (socPercent >= 40 && socPercent <= 60)) {
    return { state: "Alerta", tone: "warning", action: "Liberar com atenção e monitorar a fila" } as const;
  }
  return { state: "Favorável", tone: "success", action: "Liberar sessões com tarifa normal" } as const;
}

export function estimateEnergyOrigin({
  solarKwh,
  batteryKwh,
  gridKwh,
  sessionEnergyKwh
}: {
  solarKwh: number;
  batteryKwh: number;
  gridKwh: number;
  sessionEnergyKwh: number;
}) {
  const renewableKwh = solarKwh + batteryKwh;
  let origin = "Híbrida";
  if (renewableKwh >= sessionEnergyKwh) origin = "Solar/Bateria";
  else if (gridKwh > renewableKwh) origin = "Rede";

  return {
    origin,
    label: `${origin} estimada`,
    renewableSharePercent: sessionEnergyKwh > 0 ? Math.min(100, Math.round((renewableKwh / sessionEnergyKwh) * 100)) : 0
  };
}

export interface QueueItem {
  status: string;
  [key: string]: unknown;
}

export function calculateQueuePositions<T extends QueueItem>(queue: T[], averageSessionMinutes = 35) {
  return queue
    .filter((item) => item.status === "waiting")
    .map((item, index) => ({ ...item, position: index + 1, estimatedWaitMinutes: (index + 1) * averageSessionMinutes }));
}

const paymentStatuses = {
  approved: { status: "Aprovado", authorized: true },
  pending: { status: "Pendente", authorized: false },
  declined: { status: "Recusado", authorized: false }
} as const;

export function simulatePayment({ scenario, amount }: { scenario: string; amount: number }) {
  const result = paymentStatuses[scenario as keyof typeof paymentStatuses] ?? paymentStatuses.pending;
  return { ...result, scenario, amount };
}

export interface CommercialSessionInput extends TariffInput {
  paymentScenario: string;
  solarKwh?: number;
  batteryKwh?: number;
  gridKwh?: number;
  [key: string]: unknown;
}

export function calculateEstimatedRange(energyKwh: number) {
  return round(energyKwh * 5);
}

export function enrichCommercialSession<T extends CommercialSessionInput>(session: T) {
  const tariff = calculateTariff(session);
  const origin = estimateEnergyOrigin({
    solarKwh: session.solarKwh ?? session.energyKwh * 0.45,
    batteryKwh: session.batteryKwh ?? session.energyKwh * 0.15,
    gridKwh: session.gridKwh ?? session.energyKwh * 0.4,
    sessionEnergyKwh: session.energyKwh
  });
  const payment = simulatePayment({ scenario: session.paymentScenario, amount: tariff.totalCost });
  return {
    ...session,
    tariff,
    origin,
    payment,
    idleBillableMinutes: tariff.idleBillableMinutes,
    estimatedRangeKm: calculateEstimatedRange(session.energyKwh),
    commercialValue: tariff.totalCost,
    authorized: payment.authorized
  };
}

interface ReportSession {
  status: string;
  energyKwh: number;
  commercialValue: number;
  idleBillableMinutes: number;
  tariff: { ratePerKwh: number };
  origin: { origin: string };
  payment: { status: string };
}

export function generateCommercialReport(sessions: ReportSession[], queue: unknown[]) {
  const originCounts = sessions.reduce<Record<string, number>>((counts, session) => {
    counts[session.origin.origin] = (counts[session.origin.origin] ?? 0) + 1;
    return counts;
  }, {});
  const dominantOrigin = Object.entries(originCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Não disponível";
  const totalEnergy = sessions.reduce((total, session) => total + session.energyKwh, 0);
  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter((session) => session.status === "active").length,
    finishedSessions: sessions.filter((session) => session.status === "finished").length,
    totalEnergyKwh: round(totalEnergy),
    estimatedRevenue: round(sessions.reduce((total, session) => total + session.commercialValue, 0)),
    averageTariff: round(sessions.reduce((total, session) => total + session.tariff.ratePerKwh * session.energyKwh, 0) / Math.max(1, totalEnergy)),
    totalIdleMinutes: sessions.reduce((total, session) => total + session.idleBillableMinutes, 0),
    queueSize: queue.length,
    dominantOrigin,
    approvedPayments: sessions.filter((session) => session.payment.status === "Aprovado").length,
    pendingPayments: sessions.filter((session) => session.payment.status === "Pendente").length,
    declinedPayments: sessions.filter((session) => session.payment.status === "Recusado").length
  };
}

export interface RecommendationInput {
  demandState: string;
  queueLength: number;
  peakHour: boolean;
  highSolar: boolean;
  idleSessionsCount: number;
  pendingPayments: number;
  concentratedChargers?: boolean;
}

export function generateRecommendations(input: RecommendationInput) {
  const recommendations: Array<Record<string, string>> = [];
  const labels: Record<string, string> = {
    demand_control: "Controle de demanda da planta", queue: "Gestão de fila comercial",
    sustainability: "Gestão sustentável de energia", tariff: "Tarifa dinâmica por pico",
    idle: "Rotatividade da vaga", payment: "Revisão de pagamento simulado",
    capacity: "Uso concentrado da infraestrutura"
  };
  const add = (type: string, severity: string, title: string, description: string, action = "Monitorar operação", module = "Visão geral", evidence = description, impact = "Requer acompanhamento do gestor") => recommendations.push({
    id: `REC-${String(recommendations.length + 1).padStart(3, "0")}`,
    type, severity, title, description, source: "deterministic_rules", rule: labels[type] ?? type, action, module, evidence, impact
  });

  if (input.demandState === "Crítico") add("demand_control", "critical", "Demanda energética crítica", "A margem disponível ou o SOC atingiu nível crítico.", "Limitar novas sessões temporariamente", "Energia e sustentabilidade", "Margem ou SOC abaixo do limite operacional seguro.", "Novas sessões podem comprometer a margem da planta.");
  else if (input.demandState === "Alerta") add("demand_control", "warning", "Estado energético em alerta", "A margem de potência está entre 10% e 30%.", "Manter tarifa de pico, priorizar carregadores de 11 kW e segurar novas sessões rápidas até a margem superar 30%.", "Energia e sustentabilidade", "Margem disponível em 24%, com 2 carregadores em operação e fila comercial ativa.", "Novas sessões rápidas podem reduzir a margem de segurança.");
  if (input.queueLength >= 3) add("queue", "warning", "Fila comercial crescente", "A fila atingiu três solicitações aguardando.", "Priorizar rotatividade e avaliar expansão", "Fila comercial", "Três solicitações aguardam atendimento, com espera média elevada.", "A espera pode reduzir conversão e receita.");
  if (input.highSolar) add("sustainability", "info", "Janela sustentável disponível", "A geração solar estimada permite incentivar novas sessões.", "Aplicar desconto sustentável", "Energia e sustentabilidade");
  if (input.peakHour) add("tariff", "warning", "Horário de pico ativo", "O multiplicador de pico está ativo para equilibrar demanda.", "Manter tarifa de pico", "Operação comercial", "Demanda elevada e fila ativa durante a janela de pico.", "A tarifa protege margem comercial e energética.");
  if (input.idleSessionsCount > 0) add("idle", "warning", "Carregador com ociosidade", "Há vaga ocupada além da tolerância comercial.", "Acionar regra de liberação da vaga", "Carregadores", "Uma sessão ultrapassou a tolerância de 15 minutos.", "A vaga indisponível aumenta a fila e reduz receita.");
  if (input.pendingPayments > 0) add("payment", "info", "Pagamentos pendentes", "Existem sessões com status financeiro aguardando revisão.", "Revisar sessões pendentes", "Operação comercial", "Há pagamento pendente e sessão recusada no período.", "Valores não confirmados reduzem previsibilidade de receita.");
  if (input.concentratedChargers) add("capacity", "info", "Uso concentrado em poucos carregadores", "Mais de 60% da energia foi entregue por dois carregadores.", "Redistribuir sessões e avaliar expansão futura", "Carregadores", "Dois carregadores concentram a maior parcela de energia entregue.", "A concentração aumenta risco operacional e indica expansão futura.");
  return recommendations;
}

interface OperationsInput {
  sessions: Array<{ status: string; commercialValue: number; tariff: { idleCost: number }; payment: { status: string } }>;
  chargers: Array<{ id: string; estimatedRevenue: number; occupancyPercent: number }>;
  queue: Array<{ estimatedWaitMinutes: number }>;
  energy: { snapshot: { powerMarginPercent: number } };
}

export function buildOperationalMetrics({ sessions, chargers, queue, energy }: OperationsInput) {
  const revenue = sessions.reduce((total, session) => total + session.commercialValue, 0);
  const mostProfitable = [...chargers].sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)[0];
  const averageOccupancy = chargers.reduce((total, charger) => total + charger.occupancyPercent, 0) / Math.max(chargers.length, 1);
  const highOccupancy = chargers.filter((charger) => charger.occupancyPercent >= 65).length;
  return {
    revenueToday: round(revenue), projectedMonthRevenue: round(revenue * 26), averageTicket: round(revenue / Math.max(sessions.length, 1)),
    paidSessions: sessions.filter((session) => session.payment.status === "Aprovado").length,
    pendingSessions: sessions.filter((session) => session.payment.status === "Pendente").length,
    declinedSessions: sessions.filter((session) => session.payment.status === "Recusado").length,
    blockedLoss: sessions.filter((session) => session.status === "blocked").length * 24,
    idleLoss: sessions.reduce((total, session) => total + session.tariff.idleCost, 0),
    mostProfitableCharger: mostProfitable?.id ?? "",
    averageOccupancy: round(averageOccupancy),
    averageWaitMinutes: round(queue.reduce((total, item) => total + item.estimatedWaitMinutes, 0) / Math.max(queue.length, 1)),
    maxQueue: queue.length,
    blockedSessions: sessions.filter((session) => session.status === "blocked").length,
    highOccupancyChargers: highOccupancy,
    possibleQueueLoss: round(queue.length * 18.5),
    managerReading: `${highOccupancy} carregadores concentram a maior ocupação hoje. A operação apresenta fila ativa e tarifa de pico, indicando necessidade de redistribuição de demanda ou expansão futura.`,
    energyDecision: energy.snapshot.powerMarginPercent <= 30 ? "Liberar sessões ativas, limitar novas sessões rápidas e manter fila" : "Liberar novas sessões mantendo monitoramento da margem"
  };
}
