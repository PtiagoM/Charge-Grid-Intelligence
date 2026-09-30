# CG-AI-03 — treino e seleção do modelo (unidade-pai)

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** GRANDE · **Risco:** ALTO.

## Objetivo

Produzir um modelo explicável e validado para o target aprovado.

## Dependências e estado atual

Depende de AI-02. É somente um agrupador; não possui arquivos próprios.

## Arquivos relevantes

Nenhum arquivo direto; AI-03A, AI-03B e AI-03C definem seus arquivos.

## Execução

Esta unidade é grande demais para execução direta. Executar, na ordem:

1. [CG-AI-03A — baselines e protocolo](cg-ai-03a.md);
2. [CG-AI-03B — Ridge incumbent](cg-ai-03b.md);
3. [CG-AI-03C — comparação controlada de variantes](cg-ai-03c.md).

## Fora de escopo

Não criar código ou commit com o ID-pai. Não antecipar inferência Node, API, UI ou controle operacional.

## Testes, documentação e commit

Não executar treino/teste ou criar commit para o pai; cada subunidade registra sua evidência.

## Resultado

CG-AI-03A, CG-AI-03B e CG-AI-03C concluídos: benchmark temporal `SIMULATED_COMPOSITE`, comparação de baselines e três rodadas controladas com seleção pela validação. AR(1) foi rejeitado; Ridge lags/calendário tornou-se incumbent em 03B; Ridge Delta passou o gate em 03C e foi avaliado no holdout. Ambos os artefatos continuam offline e não operacionais. Métricas e limites em [`model-card.md`](../../ai/model-card.md).

## Critérios de aceite

AI-03 só é concluída quando A, B e C forem aceitas. Parar se um executor tentar escolher dataset, split ou métrica fora do congelado por AI-01/AI-02.

## Condição de parada

Parar qualquer execução direta e encaminhar para A, B ou C.
