# Matriz SEMS+ × ChargeGrid

**Classificação da síntese:** equivalentes SEMS+ são `OBSERVED`; adaptações e novas funções são `INFERRED`, confiança indicada por linha. Nenhum equivalente parcial foi promovido a verdade comercial.

## Fontes de verdade

| Domínio | Fonte | Regra de integração |
| --- | --- | --- |
| técnico e energético | GoodWe | consumir por adapter e conservar origem/frescor |
| comercial | ChargeGrid | não derivar tarifa, sessão ou disponibilidade comercial apenas da telemetria |
| financeiro | gateway + ChargeGrid | gateway confirma movimentos; ChargeGrid concilia e projeta |
| predição | IA ou cálculo derivado | identificar previsão, confiança e fallback; nunca tratar como fato |

## Encaixe por capacidade

| Capacidade | Equivalente observado no SEMS+ | Reuso conceitual | Adaptação necessária | Nova função do módulo | Impacto em UI/UX | Entidades/permissões | Decisão pendente |
| --- | --- | --- | --- | --- | --- | --- | --- |
| plantas comerciais | lista, detalhe, mapa, estado e KPIs (`OBSERVED`, alta) | preservar shell, filtros, contexto, rotas e tabs | vincular contrato/estabelecimento à planta sem alterar a planta técnica | ativação por código, horários, acesso, publicação e disponibilidade | badge/filtros na lista e tab ChargeGrid dentro da planta; sem refazer wizard técnico | `Plant`, `Establishment`, `CommercialContract`, `PlantCommercialLink`; acesso comercial explícito | checklist final de prontidão |
| carregadores | tipo EV, detalhe, conectividade, porta, carga e histórico (`OBSERVED`, alta) | inventário, badges, telemetria e log | separar estado técnico de comercial e exibir frescor | política comercial, vaga, manutenção e sessão ativa | lista densa e detalhe com blocos técnico/comercial | `Charger`; escrita comercial por estabelecimento admin | campos GoodWe realmente homologados |
| sessões e recargas | última carga e monitoramento, sem ciclo comercial (`OBSERVED`, média) | gráfico e vínculo com carregador | correlacionar medição, comando, pessoa e pagamento | máquina de estados completa da sessão | lista ao vivo, detalhe, timeline e próximos passos | `CommercialSession`, `ActiveSession`; acesso por planta/papel | retenção e precisão de telemetria |
| fila | nenhum equivalente (`OBSERVED`, alta) | apenas padrões de tabela, badge e notificação | inserir contexto sem reproduzir jornada do motorista | fila por estabelecimento, chamada e no-show | painel operacional agregado; identidades minimizadas | `QueueEntry`, `QueueSummary`; operador gerencia, GoodWe vê agregado | capacidade/limites por estabelecimento |
| tarifa | receita energética, não preço de recarga (`OBSERVED`, alta) | seletores de período e relatórios | separar tarifa energética de política comercial aceita | tarifa versionada e segmentos previsíveis | editor com vigência, prévia e histórico | `TariffPolicy`, `TariffSegment`; somente admin altera | impostos, limites e arredondamento |
| receita, lucro e comissão | receita energética da planta (`OBSERVED`, alta) | KPIs, gráficos e exportação | rotular claramente bruto, custos conhecidos, líquido e hipótese | receita por sessão, taxa do gateway e comissão parametrizada | visão financeira distinta da energia | `Payment`, KPIs financeiros; operador sem parâmetros sensíveis | custo energético e modelo comercial definitivo |
| pagamento e liquidação | nenhum equivalente (`OBSERVED`, alta) | padrão de tarefa/status assíncrono | integrar gateway sem expor segredo ou dado de cartão | autorização, captura, devolução, settlement e disputa | timeline financeira e estados pendentes/acionáveis | `Payment`, `PaymentSummary`; escopo mínimo por papel | split, fiscalidade, chargeback e live readiness |
| ociosidade | inatividade/conectividade, sem regra tarifária (`OBSERVED`, média) | status e contadores | começar somente após fim energético confirmado | tolerância, taxa, teto e auditoria | contador e cobrança separada da energia | `IdlePolicy`, sessão; admin configura, operador acompanha | parâmetros comerciais finais |
| controle de demanda | potência, rede, carga, bateria e fluxo (`OBSERVED`, alta) | gráficos, energia flow e estados | converter sinais em política comercial, não proteção elétrica | admissão em `NORMAL/ALERT/CRITICAL` e stop auditável | banner de estado, impacto e recomendação | `PlantEnergySnapshot`, `PlantEnergyStatus`, comando; RBAC de controle | limiares, frescor e prioridade homologada |
| energia e sustentabilidade | geração, consumo, importação/exportação e ambiente (`OBSERVED`, alta) | semântica técnica e seleção de período | atribuir apenas o que puder ser correlacionado à sessão | energia por recarga e indicadores sustentáveis derivados | KPIs com origem e janela temporal | snapshot GoodWe + agregados ChargeGrid; leitura por escopo | método de atribuição solar/custo |
| incidentes | alarmes, severidade, histórico e assinatura (`OBSERVED`, alta) | filtros, taxonomia, confirmação e canais | correlacionar alarme a impacto operacional/comercial | incidente, responsável, SLA, resolução e sessão afetada | inbox operacional e detalhe com origem técnica | `Incident`; operador trata, GoodWe acompanha conforme escopo | matriz de promoção e deduplicação |
| IA preditiva/recomendações | agente e ferramentas analíticas, sem regra ChargeGrid (`OBSERVED`, média) | affordance de análise e explicação | evitar sobreposição com IA GoodWe | previsão de espera/demanda/saturação e expansão | card de recomendação com confiança, motivo e ação humana | `PredictionSummary`; leitura por papel, execução separada | governança, métricas de qualidade e nomenclatura |
| visão GoodWe | portfólio e escopo Distribuidor/Instalador (`OBSERVED`, alta) | dashboard, drill-down e linguagem visual | separar função técnica SEMS+ de responsabilidade comercial GoodWe | carteira, ativações, qualidade, agregados e expansão | carteira/região/parceiro → exceção → planta autorizada | gestor/consultor + Central GoodWe; papel × escopo × capacidade | identidade/SSO e capacidades backend |
| visão estabelecimento/operador | Proprietário e permissões de compartilhamento (`OBSERVED`, média) | identidade, contexto e plantas autorizadas | acesso comercial não herda compartilhamento técnico | admin configura plantas contratadas; operador atua na rotina | mesmas telas SEMS+ enriquecidas apenas nas plantas comerciais | `ESTABLISHMENT_ADMIN`/`OPERATOR` + membership por planta | matriz backend/RLS final |

## Reuso e limites

- `OBSERVED`, alta: shell, tabs, filtros, tabelas, badges, árvores, modais, tarefas assíncronas, temas e histórico de controle são antecedentes visuais fortes.
- `INFERRED`, alta: a experiência deve manter essa linguagem, mas os componentes serão reconstruídos no novo projeto, sem copiar código proprietário.
- `OBSERVED`, alta: o histórico do EV registra modo, parâmetros, origem Web/App e resultado.
- `INFERRED`, média: recomendações e comandos ChargeGrid precisam de trilha equivalente, mas qualquer efeito técnico passa pelo gateway/GoodWe e só muda para concluído após confirmação.

## Invariantes vigentes da camada

- o ChargeGrid não remove função, rota ou permissão técnica SEMS+;
- habilitar a camada não troca o shell nem transforma toda a conta;
- contrato, membership e publicação são por planta;
- uma conta pode misturar plantas somente SEMS+ e ChargeGrid;
- compartilhamento técnico não concede acesso comercial;
- páginas novas são usadas somente quando a jornada não cabe coerentemente em uma superfície SEMS+;
- `GOODWE_ADMIN` único é substituído conceitualmente por responsabilidade, escopo e capacidade.

## Contradições históricas normalizadas

1. Documentos antigos descrevem um Dashboard ChargeGrid independente; `CURRENT_STATE.md` o substitui por um módulo incorporado à experiência SEMS+.
2. Um contrato histórico permitia visitante na fila com prioridade inferior; a regra vigente limita a fila a motoristas autenticados. O Dashboard mostra apenas o contexto operacional dessa regra.
3. Receita energética observada no SEMS+ não é receita de recarga, lucro ou comissão ChargeGrid.
4. A Driver PWA continua separada. Esta matriz referencia apenas os contratos/estados que o administrativo consome ou projeta.
5. A formulação anterior de clonar apenas páginas SEMS+ selecionadas não autoriza remover superfícies já reconstruídas: a camada ChargeGrid é aditiva e preserva a experiência técnica.
