# CG-AI-05 — persistência e API de previsão

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Gerar forecasts fora de requisições GET, persistir sua proveniência e expor o último resultado da planta Aurora.

## Fora de escopo

Decision Engine, alarme, UI, cloud scheduler ou histórico infinito.

## Dependências e estado atual

Depende de AI-04 e F0-02. API Node já possui clock contínuo e energia persistida; não há tabela/rota de forecast.

## Arquivos relevantes

Migration nova, `apps/api/src/ai/`, commercial repository/clock/routes, shared contracts e testes API.

## Banco e API

Criar `commercial_forecasts` com ID, plantId, modelVersion, generatedAt, inputFrom/inputTo, horizon/step, quality, unavailableReason, metrics snapshot e points JSON validado. Índice por `(plant_id, generated_at desc)`; retenção simples documentada, sem job distribuído.

Criar `GET /commercial/plants/:plantId/forecast` para último registro. O clock Node tenta inferência no intervalo definido pelo contrato apenas quando existem amostras suficientes; GET apenas lê. Mesmo input/modelVersion usa chave idempotente e não duplica linha.

## Critérios de aceite

- Forecast sobrevive restart e referencia planta/modelo/inputs.
- Falta de dados produz registro/response `UNAVAILABLE`, não zeros.
- Polling repetido não dispara treino/inferência duplicada.
- Isolamento por plantId e janela é respeitado.

## Testes, documentação e commit

Integration focal: happy path, insuficiência, idempotência e restart em DB isolado. Atualizar migration README/API. Commit: `feat(api): persist and expose plant demand forecasts`.

## Condição de parada

Parar se a implementação tentar depender de browser aberto, FastAPI ou Supabase remoto obrigatório.

