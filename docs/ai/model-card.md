# CG-AI-03 — model card do benchmark de demanda

## Resumo

- **Uso:** benchmark acadêmico de previsão temporal; não operacional.
- **Classe dos dados:** `SIMULATED_COMPOSITE`.
- **Resultado selecionado:** `LINEAR_LAGS_CALENDAR`, regressão Ridge múltipla padronizada; promovida pelo gate de validação, ainda não integrada ao runtime.
- **Target:** máximo de `gridImportKw` nos próximos 60 min (quatro passos de 15 min).
- **Features do Ridge selecionado:** `gridImportKw` atual, lags de 15 e 60 min, pico do bloco correspondente do dia anterior e pares seno/cosseno de hora, dia da semana e dia do ano. O AR(1) da rodada inicial usou apenas `gridImportKw` na origem.
- **Limiar:** 117,524661 kW, percentil 90 dos picos futuros do bloco de treino. É limiar de cauda do composto, não política ou limite de Aurora.
- **Artefato de inferência:** `ml/forecasting/data/lag_calendar_ridge_model.json`, reproduzível offline. Ainda não é API nem integração Node.

## Proveniência e composição

A série de 253 datas (2019-04-01–2019-12-16; 24.090 observações de 15 min) combina fontes independentes:

- [EULP/ComStock AMY2018 R1](https://data.openei.org/submissions/4520), 5B SmallOffice: schema usa timestamp, `models_used` e energia de intervalo; carga modelada em resolução de 15 min, licença CC BY 4.0. Timestamps originais sem timezone explícito.
- [NREL Workplace Charging Data](https://data.nlr.gov/submissions/182), DOI 10.7799/1838140: schema de início/fim/energia de sessão; 6.968 sessões foram sobrepostas ao período. A energia de sessões medidas foi distribuída uniformemente sobre duração como estimativa, não telemetria EV de 15 min. Timestamps sem offset são mantidos como wall-clock local; reutilização segue o aviso do catálogo incluído em `ml/forecasting/NOTICE.md`.
- [NREL PVDAQ](https://data.openei.org/submissions/4568), sistema 10/NREL CIS-1, DOI 10.25984/1846021: canal AC `ac_power__423` em W e `measured_on`; amostragem observada de aproximadamente 1 min, agregada a 15 min. Dados sob CC BY 4.0. Potência FV medida é normalizada pela placa DC de 1,12 kW e escalada linearmente a cenário hipotético de 75 kWp.

`gridImportKw = max(0, buildingLoadKw + evChargingKw - pvGenerationKw)`. Fontes não são co-localizadas nem temporalmente contemporâneas; os dados mantêm timestamps locais ingênuos e classe simulada. Manifesto, hashes, licenças e qualidade estão em `ml/forecasting/data/forecasting_series.manifest.json` e `forecasting_series.quality.json`.

Foram incorporados 253 arquivos-dia PVDAQ; 250 têm 96 intervalos observados e três são parciais (`2019-12-02`, `2019-12-10`, `2019-12-16`). Missingness não é preenchida com zero: janelas temporais incompletas são omitidas. Metadata PVDAQ confirma sistema 10 e nameplate de 1,12 kW. A licença/aviso e schema são verificados/documentados antes da composição; as transformações e os hashes permitem auditar a amostra específica.

## Protocolo

Datas inteiras em ordem: treino 60% (151 dias; 14.397 origens válidas), validação 20% (51 dias; 4.892 origens) e teste final 20% (51 dias; 4.595 origens). Gaps e janelas futuras que cruzam partições são descartados. Candidato ajustado somente em treino; método escolhido por MAE de validação. A promoção requer que MAE e RMSE sejam ambos menores que o baseline de menor MAE e que F1 não caia mais de 0,02. Teste não participa da seleção. Detalhes no [`protocolo`](evaluation-protocol.md).

Primeira rodada registrada com Python 3.14.7 e somente biblioteca padrão; OLS/Ridge fechado, sem aleatoriedade ou seed.

## Resultados — primeira rodada (CG-AI-03)

| Método | Val MAE kW | Val RMSE kW | Val F1 pico | Test MAE kW | Test RMSE kW | Test F1 pico |
|---|---:|---:|---:|---:|---:|---:|
| Persistência (selecionado) | 5,7964 | 10,4715 | 0,8344 | 5,3225 | 9,7665 | 0,8144 |
| AR(1), não promovido | 5,9255 | 10,4123 | 0,8286 | 5,2640 | 9,6474 | 0,8076 |
| Sazonal ingênuo 24 h | 18,7167 | 31,9229 | 0,5559 | 16,5949 | 28,1970 | 0,5603 |

Na primeira rodada, AR(1) piorou MAE de validação e teve F1 inferior; por isso persistência foi retida. O teste dessa rodada foi registrado antes da segunda experiência controlada.

O JSON completo contém precision/recall, confusões, coeficientes e limites; o CSV de previsões contém um registro estruturado por origem do holdout. Ambos têm `datasetClass=SIMULATED_COMPOSITE`.

## Segunda rodada controlada — CG-AI-03B

Único candidato novo: regressão linear múltipla Ridge, com features padronizadas usando estatísticas do treino e penalização fixa `alpha=1.0` (sem tuning). Target direto: máximo de `gridImportKw` na próxima hora. Features disponíveis na origem: `gridImportKw` atual, lags de 15 e 60 minutos, máximo do bloco da próxima hora do dia anterior, seno/cosseno da hora, dia da semana e dia do ano. Não usa qualquer componente/target do horizonte futuro. Python 3.14.7, biblioteca padrão, cálculo determinístico.

| Método | Val MAE kW | Val RMSE kW | Val F1 pico | Test MAE kW | Test RMSE kW | Test F1 pico |
|---|---:|---:|---:|---:|---:|---:|
| Ridge lags+calendário (promovida) | 5,6370 | 8,5421 | 0,8883 | 5,6262 | 8,4319 | 0,8349 |
| Persistência | 5,7964 | 10,4715 | 0,8344 | 5,3225 | 9,7665 | 0,8144 |

Na validação, Ridge passou os gates: MAE e RMSE menores que persistência; F1 aumentou. Após congelar a seleção, o teste foi avaliado uma vez. No holdout, Ridge melhora RMSE e F1, mas seu MAE é 0,3037 kW pior; isso não altera a seleção por validação e indica generalização mista. Para pico, recall sobe e precision cai (FP: 62 versus 30); a detecção captura mais positivos, com mais falsos alarmes.

O artefato e resultados dessa rodada estão em `ml/forecasting/data/lag_calendar_ridge_model.json`, `forecast_second_candidate_evaluation.json` e `forecast_second_candidate_test.csv`. A avaliação não estima o quarto de hora exato do pico — somente o máximo horário — e não é telemetria Aurora.

## Limitações e uso proibido

- Não representa desempenho em Hub Solar Aurora nem em uma micro-rede real.
- A regra de balanço não inclui bateria, perdas, curtailment, exportação líquida, limite de conexão ou tarifa.
- EV tem energia real por sessão, mas potência uniforme estimada; EULP é modelado; FV medido é escalado para 75 kWp hipotéticos.
- Cobertura PV parcial causa exclusão de janelas; o holdout é temporal, mas as fontes são compostas e podem ter padrões sazonais específicos.
- O limiar de risco não deve ser configurado no backend/Decision Engine. Uma integração futura precisa de previsão calibrada/validada com dados representativos e aplicar política energética vigente separadamente.
- Sem confidence score: nenhum intervalo probabilístico foi calibrado.
