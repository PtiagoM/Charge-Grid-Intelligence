# CG-AI-04 — artefato versionado e paridade Node

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Executar no processo Node a mesma transformação e inferência aprovadas em Python, sem FastAPI.

## Fora de escopo

Persistir forecast, scheduler, Decision Engine, UI ou nova infraestrutura de serving.

## Dependências e estado atual

Depende do benchmark offline promovido mais recentemente em AI-03C: `ml/forecasting/data/forecast_cg_ai_03c_model.json` (Ridge Delta). O incumbent `lag_calendar_ridge_model.json` permanece preservado como comparador/histórico. A promoção ocorreu somente em benchmark `SIMULATED_COMPOSITE`; AI-04 deve validar o campo `targetTransform=DELTA_FROM_ORIGIN`, reconstruir `max(0, atual + delta)` e preservar métricas/limites antes de qualquer uso no runtime. O modelo não está aprovado para Aurora real.

## Arquivos relevantes

`apps/api/src/ai/forecast.ts`, `forecast.test.ts`, `forecast.golden.json`, `packages/shared/src/contracts/index.ts` e `ml/forecasting/data/forecast_cg_ai_03c_model.json`.

## Comportamento esperado

- Loader lê exclusivamente `forecast_cg_ai_03c_model.json`, verifica SHA-256 fixado, versão, classe do dataset, transform `DELTA_FROM_ORIGIN`, 17 nomes/ordem das features, dimensões, escala, limiar e métricas; incompatibilidade resulta em fallback, sem derrubar a API.
- Entrada é `PlantEnergySnapshot[]` persistida; o relógio atual grava aproximadamente a cada segundo. O adapter calcula a média dos registros em cada intervalo completo `(fim−15m, fim]`, exigindo pelo menos 15 leituras, cobertura junto aos dois limites e nenhum gap acima de 60 s; descarta a janela ainda aberta e exige 96 intervalos contíguos para features. [INFERÊNCIA] Essa agregação preserva a potência média do balanço simulado na resolução de 15 min do treinamento; lacunas não são interpoladas.
- Node replica exatamente ordem, lags, janela móvel, calendário cíclico, padronização e reconstrução delta. Para alinhamento numérico, campos UTC são tratados como relógio de parede sem conversão; a timezone dos dados usados no treino é desconhecida, portanto a paridade temporal-semântica não é validada para Aurora.
- Forecast disponível é um `ForecastRecord` S4-C2 com geração UTC, expiração no máximo 30 min após `inputTo` (dois steps), proveniência, métricas congeladas do holdout e um ponto cujo `at` marca o fim do horizonte de 60 min, não o instante exato do pico. O ponto inclui valor, limiar de benchmark e `NORMAL | PREDICTED_PEAK`.
- Modelo ausente/inválido, histórico insuficiente/gap, telemetria stale ou registro expirado retornam `UNAVAILABLE`, `points:null`, `metrics:null` e, se houver leitura atual, `fallback:{method:'PERSISTENCE', ...}`. Esse valor deriva da última importação observada; não é previsão do modelo. Sem artefato, limiar/risco ficam indisponíveis; o limiar do benchmark nunca é política operacional.
- Sem “confidence” arbitrária; nenhum comando GoodWe é emitido. Esta unidade não cria rota, scheduler nem persistência (CG-AI-05).
- Não instalar runtime Python/FastAPI no servidor. Dependência Node nova só se necessária e justificada; preferir artefato JSON simples.

## Critérios de aceite

- Vetores dourados Python/Node coincidem na tolerância numérica documentada.
- Artefato incompatível não derruba API nem gera previsão falsa.
- Nenhum comando GoodWe é emitido.

## Testes, documentação e commit

Contract/parity test com vetor Python versionado, janela real agregada, fallback insuficiente/ausente/expirado. Atualizar README AI/API, model card, CURRENT_STATE e contratos S4-C2. Commit: `feat(api): run versioned demand forecast inference`.

## Condição de parada

Parar após paridade dos vetores e fallback determinístico. `plantEnergySeries` hoje limita a resposta às últimas 3.600 amostras (aprox. 1 h); CG-AI-05 precisa fornecer/consultar pelo menos 24 h de histórico, idealmente agregando no banco para não transferir dezenas de milhares de linhas. O forecast não está persistido nem exposto por rota; isso é CG-AI-05. O benchmark continua não operacional por usar `SIMULATED_COMPOSITE` e timezone de origem desconhecida.
