# CG-AI-03B — treino, seleção e model card

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Treinar candidatos simples, selecionar com validação temporal e produzir artefato/model card somente se houver ganho defensável sobre baseline.

## Fora de escopo

Deep learning, tuning amplo, serviço Python, inferência/API/UI e comando direto de carregador.

## Dependências e estado atual

Depende de AI-03A. Dataset, features, splits, métricas e regra de sucesso já estão congelados.

## Arquivos relevantes

`ml/forecasting/src/evaluate_forecast.py`, `ml/forecasting/data/forecast_evaluation.json`, `forecast_test_predictions.csv` e `docs/ai/model-card.md`.

## Lógica obrigatória

- Comparar no máximo regressão linear/ridge e um candidato de árvore/ensemble pequeno se justificável.
- Selecionar pelo validation set; preferir o modelo mais simples dentro de tolerância equivalente.
- Abrir test set uma vez após seleção e registrar resultado, baseline, seed, versões, features e limitações.
- Modelo só é aprovado se melhorar MAE/RMSE sobre baseline relevante sem degradar materialmente detecção de risco; caso contrário, versionar baseline como solução e declarar resultado.
- Neste benchmark, “material” foi pré-fixado como redução maior que 0,02 em F1 de pico; a promoção também requer MAE e RMSE melhores que o baseline de menor MAE, todos medidos somente na validação.
- Exportar pré-processamento junto do modelo. Não inventar “confiança”; expor erro observado no teste e faixa apenas se calibrada.

## Critérios de aceite

- Treino reproduzível por comando documentado.
- Model card identifica dados reais/simulados, leakage controls e limites de generalização.
- Se o candidato não passar o gate, não há artefato de modelo promovido; o resultado documenta o baseline selecionado e não simula promoção.
- Resultado inclui sinal estruturado de pico (alvo, horizonte, timestamp, valor previsto, limiar, estado de risco, classe do dataset e método).

## Resultado desta unidade

Foi ajustado um candidato AR(1) univariado treinado somente em pares consecutivos do bloco de treino. A seleção escolheu `PERSISTENCE` porque o candidato não melhorou o MAE de validação. O conjunto de teste foi calculado após a escolha e não participa de seleção ou promoção. Não foi promovido nem exportado modelo; a avaliação é exclusivamente do benchmark `SIMULATED_COMPOSITE`.

## Testes, documentação e commit

Teste focal do seletor de validação, guarda de F1 e sinal de risco. Commit incluído no checkpoint CG-AI-03.

## Condição de parada

Parar sem promover modelo se ele não superar baseline ou não puder ser reproduzido; não ajustar test set.
