# CG-AI-05 — persistência e API de previsão

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Gerar forecasts fora de requisições GET, persistir sua proveniência e expor o último resultado da planta Aurora.

## Fora de escopo

Decision Engine, alarme, UI, cloud scheduler ou histórico infinito.

## Dependências e estado atual

Depende de AI-04 e F0-02. API Node já possui clock contínuo e energia persistida; não há tabela/rota de forecast.

## Arquivos relevantes

Migration nova, `apps/api/src/ai/`, commercial repository/clock/routes, shared contracts e testes API.

## Banco e API

Migration `202610020010_demand_forecasts.sql` cria `commercial_forecasts` persistindo o `ForecastRecord` S4-C2 como JSONB e mantém `plant_id`, `model_version`, `input_to`, `generated_at` e `expires_at` indexáveis. Chave única `(plant_id, model_version, input_to)` evita duplicar a mesma janela após retry/restart. Índice por `(plant_id, generated_at desc)`; sem retenção automática nesta unidade.

O clock persiste telemetria a cada ~1 s e `plantEnergySeries` continua limitada a 3.600 linhas. Para AI-04, uma consulta dedicada agrega `grid_import_kw` em médias por minuto nas últimas 26 h (aprox. 1.560 linhas); os minutos sem leitura deixam lacunas que o adapter AI-04 rejeita. O adapter resampleia essas médias em intervalos de 15 min e exige 96 intervalos completos contíguos. Plantas offline não geram forecast.

`CommercialRepository.advancePlantForecasts` é chamado pelo clock existente, mas faz no máximo uma tentativa por janela de 15 min. Persistência ocorre somente para `AVAILABLE`; insuficiência não gera zeros nem linhas sintéticas. `GET /commercial/plants/:plantId/forecast` é somente leitura e retorna o último `ForecastRecord`. Antes do primeiro resultado, responde `PlantForecastResponse` com `forecast:null`, `availability:'UNAVAILABLE'` e `unavailableReason:'FORECAST_NOT_GENERATED'`. Um registro vencido é projetado na resposta como `UNAVAILABLE` com fallback de persistência, sem atualizar o banco.

## Critérios de aceite

- Forecast sobrevive restart e referencia planta/modelo/inputs.
- Falta de dados produz registro/response `UNAVAILABLE`, não zeros.
- Polling repetido não dispara treino/inferência duplicada.
- Isolamento por plantId e janela é respeitado.

## Testes, documentação e commit

Integration focal: happy path com 26 h de dados minuto a minuto, resposta sem dados, idempotência por input, rota somente-leitura e restart em PGlite isolado. Documentação atualizada em README AI/API, contratos e estado atual. Commit: `feat(api): persist and expose plant demand forecasts`.

## Condição de parada

Sem FastAPI/browser/Supabase remoto obrigatório. A primeira previsão pode levar cerca de 24 h de telemetria persistida para ficar disponível; modelos ou dados do benchmark não são apresentados como telemetria operacional Aurora. Esta unidade não cria UI, alarmes nem integração ao Decision Engine.
