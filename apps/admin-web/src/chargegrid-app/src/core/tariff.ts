// @ts-nocheck
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateTariff({
  energyKwh,
  baseRate = 2,
  isPeak = false,
  isCritical = false,
  hasHighSolar = false,
  idleMinutesAfterEnd = 0,
  idleToleranceMinutes = 15,
  idleRatePerMinute = 0.5
}) {
  const appliedRules = [];
  let multiplier = 1;

  if (isPeak) {
    multiplier *= 1.3;
    appliedRules.push('peak');
  }
  if (isCritical) {
    multiplier *= 1.2;
    appliedRules.push('critical_state');
  }
  if (hasHighSolar) {
    multiplier *= 0.85;
    appliedRules.push('high_solar_discount');
  }

  const ratePerKwh = roundMoney(baseRate * multiplier);
  const energyCost = roundMoney(energyKwh * ratePerKwh);
  const idleBillableMinutes = Math.max(0, idleMinutesAfterEnd - idleToleranceMinutes);
  const idleCost = roundMoney(idleBillableMinutes * idleRatePerMinute);

  return {
    ratePerKwh,
    energyCost,
    idleBillableMinutes,
    idleCost,
    totalCost: roundMoney(energyCost + idleCost),
    appliedRules
  };
}

