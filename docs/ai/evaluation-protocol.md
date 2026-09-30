# CG-AI-03 — protocolo temporal

## Escopo e classificação

Este protocolo avalia um benchmark **`SIMULATED_COMPOSITE`**; não é previsão operacional nem telemetria Aurora. O AI-02 original, com quatro datas esparsas, permanece intacto e não é usado para métricas. AI-03 constrói `ml/forecasting/data/forecasting_series.csv` de fontes públicas independentes: EULP/ComStock AMY2018 Release 1 (carga modelada), NREL Workplace Charging (energia real de sessões; potência horária estimada uniformemente) e PVDAQ system 10 (FV medida, escalada para uma instalação hipotética de 75 kWp). O manifesto e o quality report acompanham os dados e seus hashes.

## Pergunta e target

Na origem `t`, estimar o pico de importação da rede durante os quatro intervalos seguintes, isto é, o máximo de `gridImportKw` em `(t, t+60 min]`. A série tem frequência de 15 minutos; horizonte deste benchmark: **60 minutos**. O target `gridImportKw` foi derivado previamente por balanço físico simplificado; o avaliador não usa as componentes disponíveis no timestamp-alvo. Assim, o problema é temporal e não uma reaplicação da fórmula de balanço no instante futuro.

## Dados, ordem temporal e purga

- Intervalo de origem: 2019-04-01 a 2019-12-16; 253 datas de fonte e 24.090 linhas observadas.
- Separar datas inteiras em ordem cronológica, sem shuffle: 151 treino (até 2019-08-29), 51 validação (2019-08-30 a 2019-10-19), 51 teste (2019-10-20 a 2019-12-16).
- Somente janelas com quatro intervalos futuros contíguos, lags necessários e histórico sazonal do dia anterior são elegíveis. Descartar gaps PV e qualquer janela futura que atravesse fronteira de split.
- Quantidades resultantes: treino 14.397 origens; validação 4.892; teste 4.595.
- Ajustar o candidato apenas em pares consecutivos do treino. Selecionar no bloco de validação. Calcular teste somente após congelar a seleção; não reajustar ou trocar método por resultado de teste.
- Avaliação é rolling-origin: cada linha do holdout usa a observação de `gridImportKw` disponível naquele instante como entrada (e valores prévios observados para o baseline sazonal), simulando atualização a cada 15 min; não usa componentes ou target futuro como feature.

## Métodos comparados

1. `PERSISTENCE`: repetir `gridImportKw(t)` como estimativa do pico da próxima hora. Baseline determinístico principal.
2. `SEASONAL_NAIVE_24H`: usar o pico observado no mesmo bloco de quatro intervalos do dia anterior.
3. `AR1`: regressão linear de um passo, `gridImportKw(t+15m) ~ gridImportKw(t)`, ajustada em treino e aplicada recursivamente quatro vezes. Uma única feature observada na origem; previsões recursivas alimentam os próximos passos.

O AR(1) é candidato simples e explicável adequado para testar se a relação temporal acrescenta valor. Não se treina rede neural nem se faz tuning amplo com este tamanho/proveniência.

## Seleção, limiar e métricas

- Seleção somente na validação. Comparar AR(1) com baseline de menor MAE (persistência em empate). Promover AR(1) apenas se melhorar **MAE e RMSE** e seu F1 de pico não cair mais de 0,02; caso contrário, reter o baseline.
- Definir risco do benchmark como pico futuro maior ou igual ao percentil 90 dos picos de horizonte no treino. O limiar resultante de 117,524661 kW é exclusivo deste composto; não é limite contratual, alarme ou política operacional Aurora.
- Regressão: MAE e RMSE em kW contra o pico máximo observado na hora seguinte.
- Evento de pico: target e previsão maiores ou iguais ao limiar; reportar precision, recall, F1 e contagens TP/FP/FN.
- O timestamp previsto é o intervalo do máximo previsto; em empate usar o primeiro intervalo futuro.
- Resultado estruturado de benchmark: `target`, `statistic`, `horizonMinutes`, `predictedPeakAtLocal`, `predictedPeakGridImportKw`, `riskThresholdKw`, `riskState` (`NORMAL`/`PREDICTED_PEAK`), `datasetClass` e `forecastMethod`.

## Reprodução e limitações

Comandos, fontes e geração estão em [`ml/forecasting/README.md`](../../ml/forecasting/README.md); resultados fixados em [`model-card.md`](model-card.md) e `ml/forecasting/data/forecast_evaluation.json`. A ausência de co-localização, timezone harmonizado, forma real da potência das sessões e planta Aurora impede extrapolar erro, limiar ou benefício. Um futuro Decision Engine deve consumir sua política e telemetria atuais, nunca este limiar de benchmark como configuração de produção.
