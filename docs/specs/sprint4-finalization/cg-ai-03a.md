# CG-AI-03A — baselines e protocolo de avaliação

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Estabelecer baselines temporais, split e métricas antes de treinar candidatos, impedindo seleção oportunista.

## Fora de escopo

Modelo final, artefato Node, API e UI.

## Dependências e estado atual

Depende de AI-02. O dataset AI-02 de quatro datas foi medido como insuficiente para forecasting; esta unidade preserva-o e cria uma série composta mais longa. O horizonte de benchmark adotado nesta execução é de 60 min sobre a resolução de 15 min, sem congelar horizonte operacional.

## Arquivos relevantes

`ml/forecasting/src/fetch_pvdaq.py`, `prepare_forecasting.py`, `evaluate_forecast.py`, `ml/forecasting/data/forecasting_series.*`, `docs/ai/evaluation-protocol.md` e testes focais.

## Protocolo congelado

- Partição cronológica 60% treino, 20% validação, 20% teste; sem shuffle. Se sazonalidade mínima não couber, documentar e parar, não mudar silenciosamente.
- Teste permanece fechado até AI-03B escolher pelo validation set.
- Baselines mínimos: último valor e sazonal ingênuo compatível com a frequência.
- O target é o máximo de `gridImportKw` nos quatro próximos intervalos; features não incluem componentes do mesmo instante-alvo.
- Exemplos são separados por datas em blocos cronológicos 60/20/20; janelas que atravessam gaps ou fronteiras de split são descartadas.
- Métricas de regressão: MAE e RMSE; sMAPE apenas como auxiliar. Não usar MAPE com zeros.
- Métrica de pico do benchmark: precision/recall/F1 contra limiar calculado no treino e mantido fixo em validação/teste; não representa limiar/política operacional.
- Registrar métricas por horizonte e distribuição dos erros; seed fixa quando aplicável.

## Critérios de aceite

- Script reproduz resultados e grava JSON/CSV pequeno de métricas.
- Teste não influencia features/hiperparâmetros.
- Baselines e regra de sucesso da AI-03B estão documentados antes do treino final.
- Série, manifesto e quality report são reproduzíveis e classificam cada linha como `SIMULATED_COMPOSITE`.

## Resultado desta unidade

O AI-02 original tinha 339 linhas em quatro datas; não sustentava uma avaliação temporal. A amostra ampliada cobre 253 datas entre 2019-04-01 e 2019-12-16 (24.090 intervalos observados), particionadas por data em 151/51/51 dias. A preparação e o protocolo estão em `ml/forecasting/README.md` e `docs/ai/evaluation-protocol.md`. Isso viabiliza apenas um benchmark temporal do composto, não uma alegação sobre Aurora.

## Testes, documentação e commit

Teste focal de target futuro, purga de janelas e métricas. Commit incluído no checkpoint CG-AI-03.

## Condição de parada

Parar se o conjunto não tiver cobertura suficiente para os três blocos ou se os eventos de pico forem inexistentes no teste.
