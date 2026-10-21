# CG-AI-03C — comparação controlada do Ridge

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Executar uma única rodada, pequena e reproduzível, para verificar ganho sobre o Ridge offline CG-AI-03B. Reutilizar `forecasting_series.csv`, split rolling-origin 60/20/20, target (máximo de `gridImportKw` nos próximos 60 min), limiar de treino e métricas congeladas. Não alterar dataset, integração Node/API, Decision Engine ou frontend.

## Fora de escopo

Busca ampla de hiperparâmetros/modelos, reabertura seletiva do teste, mudança de horizonte/target, integração operacional, tuning do limiar, E2E e suítes globais.

## Dependências e estado atual

CG-AI-03B fornece incumbent `ml/forecasting/data/lag_calendar_ridge_model.json`; CG-AI-03A fornece protocolo e avaliador. O candidato vencedor é um artefato offline; `SIMULATED_COMPOSITE` nunca deve ser descrito como telemetria Aurora.

## Arquivos relevantes

- `ml/forecasting/src/evaluate_ridge_variants.py`
- `ml/forecasting/tests/test_evaluate_ridge_variants.py`
- `ml/forecasting/data/forecast_third_candidate_evaluation.json`
- Artefatos gerados somente após promoção: `forecast_cg_ai_03c_model.json`, `forecast_cg_ai_03c_test.csv`
- `docs/ai/model-card.md`, `docs/ai/evaluation-protocol.md`, `ml/forecasting/README.md`

## Comportamento e seleção

Comparar Ridge incumbent congelado, Ridge com lags/estatísticas temporais, Ridge com componentes na origem e lags, Ridge com target delta, um Gradient Boosting determinístico de stumps rasos e baselines Persistência/Sazonal 24h. Features devem existir na origem ou antes; padronização Ridge ajustada só no treino; todos os métodos usam exatamente as mesmas origens. Delta prevê `pico futuro - gridImportKw atual` e reconstrói `max(0, atual + delta)`.

Selecionar por validação. Um novo candidato só é elegível se MAE e RMSE forem estritamente menores que o incumbent e F1 não cair mais de 0,02; entre elegíveis, ordenar MAE, RMSE e F1. Abrir teste uma vez, após congelar a seleção. Se nenhum passar, reter o incumbent e não abrir novas labels de teste.

## Critérios de aceite

- Avaliação reproduz a mesma contagem e limites temporais do benchmark.
- Nenhuma feature do horizonte futuro, ajuste com validação/teste ou alteração do limiar.
- Relatório apresenta MAE, RMSE, F1, FP/FN e deltas contra incumbent.
- Holdout incluído somente após promoção congelada; artefato versionado somente se candidato novo for promovido.
- Model card explicita proveniência, trade-offs e limites de generalização.

## Resultado desta unidade

`RIDGE_DELTA` foi promovido por validação: MAE 5,3062 kW (−5,87%), RMSE 8,4259 kW (−1,36%) e F1 0,8821 (diferença −0,0063) contra incumbent. Ridge + componentes reduziu mais o erro, mas não passou a guarda F1. Holdout do modelo congelado: MAE 4,6151 kW, RMSE 8,1457 kW, F1 0,8461. Artefato CG-AI-03B permanece intacto; o novo modelo é offline, `SIMULATED_COMPOSITE` e não operacional.

## Testes, documentação e commit

Checks focais cobrem uso exclusivo de valores até a origem e determinismo do Gradient Boosting; executar a avaliação local. Atualizar model card, protocolo, README e índice mestre. Commit isolado `feat(ai): compare controlled forecast variants`.

## Condição de parada

Após publicar métricas e artefatos desta única rodada, parar. Não integrar o modelo ao backend nem avançar a CG-AI-04.
