# CG-DEC-01 — integrar previsão ao Decision Engine

**Classificação:** BACKEND ONLY · **Status:** CONCLUÍDO · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Transformar forecast disponível em evidência de risco para regras determinísticas e decisões auditáveis, sem permitir que o modelo controle hardware.

## Fora de escopo

Retreino online, corte preditivo de sessão ativa, novo painel, comando direto de IA ou substituição das regras atuais de demanda real.

## Dependências e estado atual

Depende de AI-05. O backend já admite/bloqueia/corta/retoma com telemetria real/simulada atual; falta o estado preditivo.

## Arquivos relevantes

`apps/api/src/commercial/repository.ts`, domínio demand/insights a extrair se necessário, contracts shared, migration apenas se S4-C2 exigir novos campos.

## Regras obrigatórias

- Forecast elegível: `AVAILABLE`, modelo compatível, inputs válidos e idade máxima de dois steps.
- Máximo previsto ≥90% do limite: decisão `PREDICTED_CRITICAL`; bloquear **novas** admissões até nova avaliação.
- Máximo previsto entre 80% e 90%: `PREDICTED_ALERT`; recomendar aguardar/acompanhar, sem bloqueio adicional.
- Abaixo de 80%: estado normal preditivo; não revoga bloqueio da telemetria real.
- Previsão sozinha nunca envia Stop nem suspende sessão ativa. Proteção reativa vigente continua responsável por corte.
- Forecast indisponível não enfraquece regras atuais; decisão explica fallback determinístico.
- Persistir `DemandDecisionEvidence` S4-C2: forecastId, sampleId, policyVersion, modelVersion, correlationKey, limite/limiares, ponto de pico em kW/UTC e outcome. Chave de correlação evita duplicar mesma avaliação.

## Critérios de aceite

- Mesmo forecast/política gera uma decisão.
- Start novo é bloqueado no crítico previsto e recebe motivo rastreável.
- Sessão ativa não sofre Stop preditivo.
- Forecast stale/unavailable não produz risco fictício.

## Implementação validada

- `evaluateDemandForecast` aceita somente forecast disponível do modelo promovido, com horizonte/step compatíveis, input de no máximo dois steps (30 min), amostra atual e ponto futuro válido. O maior ponto previsto é classificado pelos limiares persistidos da política (Aurora: alerta 80%, crítico 90%).
- A evidência `DemandDecisionEvidence` é persistida em `commercial_demand_decisions`, com chave de correlação única por planta, forecast e política/limiares. Releituras retornam o registro persistido, sem criar duplicata.
- `GET` da energia inclui `forecastDecision`. Risco crítico reduz `canAdmit` e impede novos `StartCharge`; alerta é informativo e não bloqueia. A regra de telemetria atual continua prevalecendo quando já bloqueia; forecast indisponível mantém a decisão determinística existente.
- Como o gate ocorre ao tentar `StartCharge`, autorização Stripe já concluída não é cancelada por esta unidade: a sessão permanece aguardando início com `transitionReason=PREDICTED_CRITICAL`. Captura/liquidação não é alterada.
- A previsão não aciona `StopCharge` nem suspende sessão ativa. A proteção reativa existente continua baseada na demanda observada.
- Um ajuste de texto/dados na composição de evidências do Admin mantém o consumidor compatível com os novos códigos de decisão; não houve mudança de layout nem criação de UI.
- O reset de dados de teste também limpa evidências preditivas, sem apagar catálogo nem forecasts independentes da operação resetada.

## Validação e registro

- Unit: `demand-decision.test.ts` cobre normal/alerta/crítico, expiração e modelo incompatível.
- Integração: `repository.test.ts` cobre bloqueio de nova conexão, persistência idempotente e sessão ativa não interrompida por previsão.
- Typecheck dos workspaces compartilhados/Admin/PWA/API passou. A primeira execução da suite focada apontou somente a contagem de migrations do teste legado (10→11); expectativa atualizada. O teste focado de integração passou após a correção.
- Migration: `202610040011_demand_decisions.sql`.
- Commit: `feat(sprint4): integrate predictive demand decisions and energy view`.

## Testes, documentação e commit

Unidade concluída. O teste direto da API PGlite não exigiu provider real nem frontend.

## Condição de parada

Parar se for necessário mudar limiares vigentes ou permitir comando direto do modelo.
