# CG-AI-03A — baselines e protocolo de avaliação

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Estabelecer baselines temporais, split e métricas antes de treinar candidatos, impedindo seleção oportunista.

## Fora de escopo

Modelo final, artefato Node, API e UI.

## Dependências e estado atual

Depende de AI-02 e usa exatamente target/resolução/horizonte do dataset decision.

## Arquivos relevantes

`ml/forecasting/src/evaluate.py`, `train_baselines.py`, configuração versionada, testes e `docs/ai/evaluation-protocol.md`.

## Protocolo congelado

- Partição cronológica 60% treino, 20% validação, 20% teste; sem shuffle. Se sazonalidade mínima não couber, documentar e parar, não mudar silenciosamente.
- Teste permanece fechado até AI-03B escolher pelo validation set.
- Baselines mínimos: último valor e sazonal ingênuo compatível com a frequência.
- Métricas de regressão: MAE e RMSE; sMAPE apenas como auxiliar. Não usar MAPE com zeros.
- Métrica operacional: precision/recall/F1 para risco acima dos limiares de política, calculada a partir da previsão, sem treinar no teste.
- Registrar métricas por horizonte e distribuição dos erros; seed fixa quando aplicável.

## Critérios de aceite

- Script reproduz resultados e grava JSON/CSV pequeno de métricas.
- Teste não influencia features/hiperparâmetros.
- Baselines e regra de sucesso da AI-03B estão documentados antes do treino final.

## Testes, documentação e commit

Teste focal com série curta conhecida para split/métricas. Commit: `test(ai): establish temporal forecasting baselines`.

## Condição de parada

Parar se o conjunto não tiver cobertura suficiente para os três blocos ou se os eventos de pico forem inexistentes no teste.

