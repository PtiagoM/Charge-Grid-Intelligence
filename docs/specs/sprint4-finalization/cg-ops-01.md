# CG-OPS-01 — alarmes e recomendações preditivas

**Classificação:** PEQUENO AJUSTE NO FRONT · **Status:** CONCLUÍDO · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Projetar decisões preditivas nas superfícies existentes de Alarmes e Recomendações, com causa, evidência, impacto, ação sugerida e resultado rastreáveis.

## Fora de escopo

Cards fictícios, nova central, chatbot/IA paralela, ação escondida ao aceitar recomendação ou comando preditivo direto.

## Dependências e estado atual

Depende de DEC-01. Insights determinísticos, decisões humanas e páginas existentes já persistem; falta origem preditiva e correlação com forecast.

## Arquivos relevantes

API commercial insights/decisions, shared contracts, `apps/admin-web/src/features/incidents/IncidentPages.tsx`, `core/recommendations.ts`, serviços e testes focais existentes.

## Comportamento esperado

- `PREDICTED_ALERT` gera recomendação; `PREDICTED_CRITICAL` gera condição operacional e recomendação associada, sem duplicar por polling.
- Evidências incluem forecastId/modelVersion/peak/limit/horizon/quality e regra aplicada.
- Reconhecer/aceitar/rejeitar registra decisão humana, mas não envia Start/Stop.
- Quando previsão seguinte deixa a faixa e não há risco real, condição muda para resolvida/superada com timestamp; histórico permanece.
- Alarme de falha física continua distinto de recomendação preditiva.
- UI existente recebe pequenos campos/rótulos; sem reorganização relevante.

## Critérios de aceite

- Uma condição gera uma ocorrência correlacionada.
- Reload preserva estado/decisão.
- Origem e simulação/realidade são visíveis; sem calibração estatística de confiança, a UI mostra confiança indisponível.
- Ação automática efetiva, quando houver, aponta para decisão backend separada.

## Testes, documentação e commit

Testes focais cobrem PREDICTED_ALERT→PREDICTED_CRITICAL→PREDICTED_NORMAL, deduplicação por polling, correlação forecast/alerta/recomendação e supersessão persistida; a projeção Admin confirma origem simulada, ligação ao incidente e confiança indisponível. Typecheck, build API/Admin e lint focal passaram. Não foi necessário E2E nesta unidade: rotas e navegação não mudaram, e o mapeamento utiliza os cards existentes. Atualizar matriz de origem fica registrado junto à documentação de estado. Commit: `feat(sprint4): integrate predictive demand decisions and energy view`.

## Condição de parada

Se campos novos exigirem refatoração visual significativa, converter essa parte em HUMAN FRONTEND GATE antes de editar layout.
