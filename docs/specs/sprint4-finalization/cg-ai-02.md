# CG-AI-02 — dataset composto reproduzível

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Construir e validar um benchmark `SIMULATED_COMPOSITE` reprodutível para `gridImportKw`, usando amostras independentes de carga predial, sessões EV e FV. A decisão aprovada permite esse composto apenas como benchmark acadêmico, não operacional. O intervalo do benchmark é 15 minutos; isso não congela horizonte de previsão.

## Fora de escopo

Treino/seleção de modelo, avaliação preditiva, serviço/API, inferência Node, frontend, integração operacional ou alegação de telemetria do Hub Solar Aurora.

## Dependências e fontes

Depende de CG-AI-01 e da aprovação explícita da estratégia `SIMULATED_COMPOSITE`.

- Carga: NREL/LBNL EULP ComStock AMY2018 Release 1, zona climática 5B, SmallOffice. Perfil modelado de 2018, energia agregada por intervalo de 15 min.
- EV: ACN-Data foi inspecionado como candidato, mas a API respondeu HTTP 401 e não havia token; foi substituído pelo NREL Workplace Charging Data, versão Oct 2021.
- FV: PVDAQ, sistema 10 / NREL CIS-1, Golden, CO; metadados indicam 1,12 kW DC.

Origem, URL, versão, licença, hash, número de linhas, qualidade, timezone e limitações estão no README, NOTICE, manifesto e relatório de qualidade em `ml/forecasting/` e na avaliação em `docs/ai/dataset-evaluation.md`.

## Pipeline e invariantes

- Python standard library; inputs locais ignorados em `.local/ai-02/`; sem nova dependência.
- Quatro datas sazonais fixas e reproduzíveis. O EULP de 2018 é sobreposto aos dias locais EV/PV de outras fontes; não existe sincronização física entre instalações.
- `buildingLoadKw = intervalEnergyKwh / models_used / 0.25h`.
- `evChargingKw`: energia medida por sessão é convertida em potência média constante (`energy_charged / duração`) e distribuída pelos intervalos sobrepostos. É estimativa, não perfil de potência medido.
- `pvGenerationKw`: potência AC PVDAQ em W, valores negativos limitados a zero, normalizada pela capacidade DC de referência de 1,12 kW e escalada para hipótese explícita de 75 kWp.
- `gridImportKw = max(0, buildingLoadKw + evChargingKw - pvGenerationKw)`. Sem bateria, perdas, exportação, curtailment ou tarifa.
- Amostras sem leitura PV não são imputadas como zero; seus intervalos não entram no composto. Quatro dias inteiros e cronológicos definem apenas splits de preparação; cobertura escassa torna esse conjunto inadequado para treino/avaliação.
- Cada linha usa `datasetClass=SIMULATED_COMPOSITE`, origem por componente e alvo derivado, sem qualquer rótulo de dado real Aurora.
- A mesma entrada gera CSV, manifesto e quality report determinísticos; hashes detectam alteração da origem.

## Arquivos

`ml/forecasting/src/prepare.py`, `tests/test_prepare.py`, `README.md`, `NOTICE.md`, `data/simulated_composite.csv`, `data/simulated_composite.manifest.json`, `data/quality-report.json`; documentação decisória em `docs/ai/` e status em `docs/specs/sprint4-finalization/`.

## Critérios de aceite e validação executada

- [x] Schema esperado, amostras, resolução, timezone, missingness, valores extremos e cobertura reportados.
- [x] Mesmo conjunto de entradas produz o mesmo CSV/checksum; balanceamento energético, split por data e classificação verificados por testes focais.
- [x] Licenças/atribuição e indisponibilidade de ACN documentadas; arquivos brutos não versionados.
- [x] Nenhum treinamento, serviço/API ou frontend implementado.

## Documentação e commit

Atualizar decisão AI-01, avaliação de fontes, este SDD, índice mestre e `CURRENT_STATE.md`. Commit isolado: `feat(ai): add reproducible simulated composite dataset`.

## Condição de parada

Concluída nesta unidade. O treino/avaliação temporal foi tratado separadamente em CG-AI-03 usando série ampliada. AI-02 continua sem alegação de capacidade preditiva própria; nenhuma previsão operacional, inferência, API ou uso de produção foi autorizada por este benchmark.
