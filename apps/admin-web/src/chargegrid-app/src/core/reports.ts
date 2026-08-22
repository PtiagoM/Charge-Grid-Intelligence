// @ts-nocheck
const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function generateCommercialReport(sessions, queue) {
  const originCounts = sessions.reduce((counts, session) => {
    counts[session.origin.origin] = (counts[session.origin.origin] ?? 0) + 1;
    return counts;
  }, {});
  const dominantOrigin =
    Object.entries(originCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Não disponível';

  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter((session) => session.status === 'active').length,
    finishedSessions: sessions.filter((session) => session.status === 'finished').length,
    totalEnergyKwh: round(sessions.reduce((total, session) => total + session.energyKwh, 0)),
    estimatedRevenue: round(sessions.reduce((total, session) => total + session.commercialValue, 0)),
    averageTariff: round(
      sessions.reduce((total, session) => total + session.tariff.ratePerKwh * session.energyKwh, 0) /
        Math.max(1, sessions.reduce((total, session) => total + session.energyKwh, 0))
    ),
    totalIdleMinutes: sessions.reduce((total, session) => total + session.idleBillableMinutes, 0),
    queueSize: queue.length,
    dominantOrigin,
    approvedPayments: sessions.filter((session) => session.payment.status === 'Aprovado').length,
    pendingPayments: sessions.filter((session) => session.payment.status === 'Pendente').length,
    declinedPayments: sessions.filter((session) => session.payment.status === 'Recusado').length
  };
}

