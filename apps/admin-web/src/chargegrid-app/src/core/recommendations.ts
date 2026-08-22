// @ts-nocheck
export function generateRecommendations({
  demandState,
  queueLength,
  peakHour,
  highSolar,
  idleSessionsCount,
  pendingPayments,
  concentratedChargers = false
}) {
  const recommendations = [];
  const labels = {
    demand_control: 'Controle de demanda da planta',
    queue: 'Gestão de fila comercial',
    sustainability: 'Gestão sustentável de energia',
    tariff: 'Tarifa dinâmica por pico',
    idle: 'Rotatividade da vaga',
    payment: 'Revisão de pagamento simulado',
    capacity: 'Uso concentrado da infraestrutura'
  };
  const add = (type, severity, title, description, action = 'Monitorar operação', module = 'Visão geral', evidence = description, impact = 'Requer acompanhamento do gestor') =>
    recommendations.push({
      id: `REC-${String(recommendations.length + 1).padStart(3, '0')}`,
      type,
      severity,
      title,
      description,
      source: 'deterministic_rules',
      rule: labels[type],
      action,
      module,
      evidence,
      impact
    });

  if (demandState === 'Crítico') {
    add('demand_control', 'critical', 'Demanda energética crítica', 'A margem disponível ou o SOC atingiu nível crítico.', 'Limitar novas sessões temporariamente', 'Energia e sustentabilidade', 'Margem ou SOC abaixo do limite operacional seguro.', 'Novas sessões podem comprometer a margem da planta.');
  } else if (demandState === 'Alerta') {
    add('demand_control', 'warning', 'Estado energético em alerta', 'A margem de potência está entre 10% e 30%.', 'Manter tarifa de pico, priorizar carregadores de 11 kW e segurar novas sessões rápidas até a margem superar 30%.', 'Energia e sustentabilidade', 'Margem disponível em 24%, com 2 carregadores em operação e fila comercial ativa.', 'Novas sessões rápidas podem reduzir a margem de segurança.');
  }
  if (queueLength >= 3) {
    add('queue', 'warning', 'Fila comercial crescente', 'A fila atingiu três solicitações aguardando.', 'Priorizar rotatividade e avaliar expansão', 'Fila comercial', 'Três solicitações aguardam atendimento, com espera média elevada.', 'A espera pode reduzir conversão e receita.');
  }
  if (highSolar) {
    add('sustainability', 'info', 'Janela sustentável disponível', 'A geração solar estimada permite incentivar novas sessões.', 'Aplicar desconto sustentável', 'Energia e sustentabilidade');
  }
  if (peakHour) {
    add('tariff', 'warning', 'Horário de pico ativo', 'O multiplicador de pico está ativo para equilibrar demanda.', 'Manter tarifa de pico', 'Operação comercial', 'Demanda elevada e fila ativa durante a janela de pico.', 'A tarifa protege margem comercial e energética.');
  }
  if (idleSessionsCount > 0) {
    add('idle', 'warning', 'Carregador com ociosidade', 'Há vaga ocupada além da tolerância comercial.', 'Acionar regra de liberação da vaga', 'Carregadores', 'Uma sessão ultrapassou a tolerância de 15 minutos.', 'A vaga indisponível aumenta a fila e reduz receita.');
  }
  if (pendingPayments > 0) {
    add('payment', 'info', 'Pagamentos pendentes', 'Existem sessões com status financeiro aguardando revisão.', 'Revisar sessões pendentes', 'Operação comercial', 'Há pagamento pendente e sessão recusada no período.', 'Valores não confirmados reduzem previsibilidade de receita.');
  }
  if (concentratedChargers) {
    add('capacity', 'info', 'Uso concentrado em poucos carregadores', 'Mais de 60% da energia foi entregue por dois carregadores.', 'Redistribuir sessões e avaliar expansão futura', 'Carregadores', 'Dois carregadores concentram a maior parcela de energia entregue.', 'A concentração aumenta risco operacional e indica expansão futura.');
  }

  return recommendations;
}

