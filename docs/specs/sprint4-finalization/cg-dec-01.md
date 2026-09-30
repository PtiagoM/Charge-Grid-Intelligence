# CG-DEC-01 — integrar previsão ao Decision Engine

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

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
- Persistir forecastId, policyVersion, limites, ponto de pico, modelVersion e outcome. Chave de correlação evita duplicar mesma avaliação.

## Critérios de aceite

- Mesmo forecast/política gera uma decisão.
- Start novo é bloqueado no crítico previsto e recebe motivo rastreável.
- Sessão ativa não sofre Stop preditivo.
- Forecast stale/unavailable não produz risco fictício.

## Testes, documentação e commit

Unit dos limites e integration de admissão/idempotência/fallback. Atualizar contrato de decisão e política. Commit: `feat(demand): evaluate forecasts in decision engine`.

## Condição de parada

Parar se for necessário mudar limiares vigentes ou permitir comando direto do modelo.

