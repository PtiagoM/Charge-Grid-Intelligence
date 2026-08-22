// @ts-nocheck
export function getDemandState({ powerMarginPercent, socPercent }) {
  if (powerMarginPercent < 10 || socPercent < 40) {
    return {
      state: 'Crítico',
      tone: 'danger',
      action: 'Bloquear novas sessões temporariamente'
    };
  }

  if (
    (powerMarginPercent >= 10 && powerMarginPercent <= 30) ||
    (socPercent >= 40 && socPercent <= 60)
  ) {
    return {
      state: 'Alerta',
      tone: 'warning',
      action: 'Liberar com atenção e monitorar a fila'
    };
  }

  return {
    state: 'Favorável',
    tone: 'success',
    action: 'Liberar sessões com tarifa normal'
  };
}

