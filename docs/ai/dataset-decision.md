# CG-AI-01 — decisão de dados e gate de treino

**Status:** `APPROVED_SIMULATED_COMPOSITE` para benchmark e validação do pipeline.  
**Target semântico:** `gridImportKw`, importação de rede na planta em kW.  
**Resolução do composto:** 15 minutos. Isto define apenas o dataset do CG-AI-02.  
**Horizonte/modelo/treino:** CG-AI-03 adotou 60 minutos apenas como horizonte de benchmark sobre quatro intervalos de 15 minutos. Essa escolha não congela um horizonte operacional nem altera o target semântico aprovado.

## Decisão aprovada

O benchmark usa amostras reais independentes de edifício, carga EV e FV para montar um cenário explicitamente `SIMULATED_COMPOSITE`. Não é telemetria Aurora, não representa uma instalação física sincronizada e não pode ser usado como entrada operacional do ChargeGrid.

Fontes incorporadas, transformações, schema, hashes, qualidade e limitações estão no [`README do benchmark`](../../ml/forecasting/README.md), [`manifesto`](../../ml/forecasting/data/simulated_composite.manifest.json), [`quality report`](../../ml/forecasting/data/quality-report.json) e [`avaliação de fontes`](dataset-evaluation.md).

ACN-Data foi investigado por ser a fonte preferida de sessões EV, mas o endpoint da API respondeu HTTP 401 sem token; nenhum token estava configurado. Para concluir o recorte aprovado, foi usado o conjunto público NREL Workplace Charging Data, explicitamente identificado como substituto.

## Limites da decisão

- O target é uma derivação física simplificada `max(0, cargaPredial + EV - FV)`, sem bateria, perdas, curtailment, exportação líquida ou sincronização de local.
- A frequência de 15 minutos define o benchmark; o horizonte de uma hora é específico da avaliação CG-AI-03 e não congela o horizonte de produção.
- Métricas CG-AI-03 descrevem somente generalização temporal dentro deste composto; não demonstram acurácia/confiança ou benefício operacional em Aurora.
- O Decision Engine atual continua baseado em telemetria e regras determinísticas existentes.

## Próxima condição

CG-AI-03 está concluído usando série ampliada separada `forecasting_series.csv`; o dataset AI-02 original permanece inalterado. Ridge foi promovida somente para benchmark offline, sem integração/runtime. Consulte [protocolo de avaliação](evaluation-protocol.md) e [model card](model-card.md).
