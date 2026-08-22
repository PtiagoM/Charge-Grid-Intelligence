// @ts-nocheck
import { simulatePayment } from './payments.js';
import { estimateEnergyOrigin } from './sustainability.js';
import { calculateTariff } from './tariff.js';

const round = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateEstimatedRange(energyKwh) {
  return round(energyKwh * 5);
}

export function enrichCommercialSession(session) {
  const tariff = calculateTariff(session);
  const origin = estimateEnergyOrigin({
    solarKwh: session.solarKwh ?? session.energyKwh * 0.45,
    batteryKwh: session.batteryKwh ?? session.energyKwh * 0.15,
    gridKwh: session.gridKwh ?? session.energyKwh * 0.4,
    sessionEnergyKwh: session.energyKwh
  });
  const payment = simulatePayment({
    scenario: session.paymentScenario,
    amount: tariff.totalCost
  });

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

