# CG-AI-03B — treino, seleção e model card

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Treinar candidatos simples, selecionar com validação temporal e produzir artefato/model card somente se houver ganho defensável sobre baseline.

## Fora de escopo

Deep learning, tuning amplo, serviço Python, inferência/API/UI e comando direto de carregador.

## Dependências e estado atual

Depende de AI-03A. Dataset, features, splits, métricas e regra de sucesso já estão congelados.

## Arquivos relevantes

`ml/forecasting/src/train.py`, `export.py`, configuração, `artifacts/` pequenos versionáveis e `docs/ai/model-card.md`.

## Lógica obrigatória

- Comparar no máximo regressão linear/ridge e um candidato de árvore/ensemble pequeno se justificável.
- Selecionar pelo validation set; preferir o modelo mais simples dentro de tolerância equivalente.
- Abrir test set uma vez após seleção e registrar resultado, baseline, seed, versões, features e limitações.
- Modelo só é aprovado se melhorar MAE/RMSE sobre baseline relevante sem degradar materialmente detecção de risco; caso contrário, versionar baseline como solução e declarar resultado.
- Exportar pré-processamento junto do modelo. Não inventar “confiança”; expor erro observado no teste e faixa apenas se calibrada.

## Critérios de aceite

- Treino reproduzível por comando documentado.
- Model card identifica dados reais/simulados, leakage controls e limites de generalização.
- Artefato é pequeno, sem pickle não portável como único formato.

## Testes, documentação e commit

Smoke test determinístico de treino/export e validação de schema do artefato. Commit: `feat(ai): train and document demand forecast model`.

## Condição de parada

Parar sem promover modelo se ele não superar baseline ou não puder ser reproduzido; não ajustar test set.

