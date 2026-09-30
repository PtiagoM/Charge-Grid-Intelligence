# CG-AI-04 — artefato versionado e paridade Node

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Executar no processo Node a mesma transformação e inferência aprovadas em Python, sem FastAPI.

## Fora de escopo

Persistir forecast, scheduler, Decision Engine, UI ou nova infraestrutura de serving.

## Dependências e estado atual

Depende do benchmark offline promovido mais recentemente em AI-03C: `ml/forecasting/data/forecast_cg_ai_03c_model.json` (Ridge Delta). O incumbent `lag_calendar_ridge_model.json` permanece preservado como comparador/histórico. A promoção ocorreu somente em benchmark `SIMULATED_COMPOSITE`; AI-04 deve validar o campo `targetTransform=DELTA_FROM_ORIGIN`, reconstruir `max(0, atual + delta)` e preservar métricas/limites antes de qualquer uso no runtime. O modelo não está aprovado para Aurora real.

## Arquivos relevantes

`apps/api/src/ai/`, artefato versionado em `ml/forecasting/artifacts/`, contratos shared e vetor dourado exportado pelo Python.

## Comportamento esperado

- Loader valida `modelVersion`, schema, features, unidades e checksum; falha fechada em incompatibilidade.
- Inferência recebe série/features já ordenadas e devolve `ForecastRecord` S4-C2: ponto `predictedGridImportKw` em kW, sem confiança artificial; `ForecastTestMetrics` é o resultado histórico congelado no model card.
- Pré-processamento Node replica valores ausentes, escala e ordem das features do artefato.
- Sem “confidence” arbitrária: publicar métricas históricas do model card e estado `UNAVAILABLE` quando inputs não atendem cobertura/freshness.
- Não instalar runtime Python/FastAPI no servidor. Dependência Node nova só se necessária e justificada; preferir artefato JSON simples.

## Critérios de aceite

- Vetores dourados Python/Node coincidem na tolerância numérica documentada.
- Artefato incompatível não derruba API nem gera previsão falsa.
- Nenhum comando GoodWe é emitido.

## Testes, documentação e commit

Contract/parity test com vetores versionados e teste de artefato inválido. Atualizar README de AI/API. Commit: `feat(api): run versioned demand forecast inference`.

## Condição de parada

Parar se a paridade exigir serviço Python permanente ou custom runtime complexo; retornar a AI-03B e escolher artefato mais simples.
