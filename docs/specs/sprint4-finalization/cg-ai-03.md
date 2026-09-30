# CG-AI-03 — treino e seleção do modelo (unidade-pai)

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** GRANDE · **Risco:** ALTO.

## Objetivo

Produzir um modelo explicável e validado para o target aprovado.

## Dependências e estado atual

Depende de AI-02. É somente um agrupador; não possui arquivos próprios.

## Arquivos relevantes

Nenhum arquivo direto; AI-03A e AI-03B definem seus arquivos.

## Execução

Esta unidade é grande demais para execução direta. Executar, na ordem:

1. [CG-AI-03A — baselines e protocolo](cg-ai-03a.md);
2. [CG-AI-03B — treino, seleção e model card](cg-ai-03b.md).

## Fora de escopo

Não criar código ou commit com o ID-pai. Não antecipar inferência Node, API, UI ou controle operacional.

## Testes, documentação e commit

Não executar treino/teste ou criar commit para o pai; cada subunidade registra sua evidência.

## Resultado

CG-AI-03A e CG-AI-03B concluídos: benchmark temporal `SIMULATED_COMPOSITE`, comparação de baselines e duas rodadas controladas com seleção pela validação. AR(1) foi rejeitado; Ridge com lags/calendário passou o gate de validação e foi avaliado no holdout, com resultado misto. O artefato é offline e ainda não integrado ao runtime. Métricas e limitações em [`model-card.md`](../../ai/model-card.md).

## Critérios de aceite

AI-03 só é concluída quando A e B forem aceitas. Parar se um executor tentar escolher dataset, split ou métrica fora do congelado por AI-01/AI-02.

## Condição de parada

Parar qualquer execução direta e encaminhar para A ou B.
