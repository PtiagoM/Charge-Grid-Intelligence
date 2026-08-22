// @ts-nocheck
export function estimateEnergyOrigin({ solarKwh, batteryKwh, gridKwh, sessionEnergyKwh }) {
  const renewableKwh = solarKwh + batteryKwh;
  let origin = 'Híbrida';

  if (renewableKwh >= sessionEnergyKwh) {
    origin = 'Solar/Bateria';
  } else if (gridKwh > renewableKwh) {
    origin = 'Rede';
  }

  return {
    origin,
    label: `${origin} estimada`,
    renewableSharePercent:
      sessionEnergyKwh > 0 ? Math.min(100, Math.round((renewableKwh / sessionEnergyKwh) * 100)) : 0
  };
}

