// @ts-nocheck
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function buildOperationalMetrics({ sessions, chargers, queue, energy }) {
  const paidSessions = sessions.filter((session) => session.payment.status === 'Aprovado').length;
  const pendingSessions = sessions.filter((session) => session.payment.status === 'Pendente').length;
  const declinedSessions = sessions.filter((session) => session.payment.status === 'Recusado').length;
  const revenue = sessions.reduce((total, session) => total + session.commercialValue, 0);
  const blockedLoss = sessions.filter((session) => session.status === 'blocked').length * 24;
  const idleLoss = sessions.reduce((total, session) => total + session.tariff.idleCost, 0);
  const mostProfitable = [...chargers].sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)[0];
  const averageOccupancy = chargers.reduce((total, charger) => total + charger.occupancyPercent, 0) / chargers.length;
  const averageWait = queue.reduce((total, item) => total + item.estimatedWaitMinutes, 0) / Math.max(queue.length, 1);
  const highOccupancy = chargers.filter((charger) => charger.occupancyPercent >= 65).length;
  const possibleQueueLoss = round(queue.length * 18.5);

  return {
    revenueToday: round(revenue),
    projectedMonthRevenue: round(revenue * 26),
    averageTicket: round(revenue / Math.max(sessions.length, 1)),
    paidSessions,
    pendingSessions,
    declinedSessions,
    blockedLoss,
    idleLoss,
    mostProfitableCharger: mostProfitable.id,
    averageOccupancy: round(averageOccupancy),
    averageWaitMinutes: round(averageWait),
    maxQueue: queue.length,
    blockedSessions: sessions.filter((session) => session.status === 'blocked').length,
    highOccupancyChargers: highOccupancy,
    possibleQueueLoss,
    managerReading: `${highOccupancy} carregadores concentram a maior ocupação hoje. A operação apresenta fila ativa e tarifa de pico, indicando necessidade de redistribuição de demanda ou expansão futura.`,
    energyDecision: energy.snapshot.powerMarginPercent <= 30
      ? 'Liberar sessões ativas, limitar novas sessões rápidas e manter fila'
      : 'Liberar novas sessões mantendo monitoramento da margem'
  };
}

