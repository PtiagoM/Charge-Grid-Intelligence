# CG-AI-01 — due diligence e seleção de datasets

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Selecionar dados reais adequados para prever demanda/importação da planta e risco de pico, antes de criar pipeline ou sintético.

## Fora de escopo

Download definitivo, treino, geração de dados, API, UI ou escolha de modelo por prestígio.

## Dependências e estado atual

Depende de F0-02. O repositório possui telemetria simulada curta, insuficiente para treino; ainda não há dataset ou licença congelados.

## Arquivos relevantes

Criados `docs/ai/dataset-evaluation.md` e `docs/ai/dataset-decision.md`. Referenciar contratos S4-C2 e política de demanda vigente.

## Procedimento obrigatório

Avaliar fontes primárias/oficiais para carga de edifício, solar e EV (por exemplo Building Data Genome, ACN-Data e NREL, sem assumir aprovação). Para cada candidato registrar URL oficial, mantenedor, licença/termos, período, timezone, granularidade, variáveis, ausências, escala, método de acesso e uso acadêmico.

Uma combinação só é elegível se unidades, frequência e relógio puderem ser normalizados sem alegar causalidade inexistente. Dados de locais diferentes podem compor perfis de treino/simulação, mas não ser apresentados como uma única medição real do Aurora.

`dataset-decision.md` deve congelar target `gridImportKw` (kW), resolução, horizonte, features disponíveis, regra de combinação, parte simulada complementar e limitações. Um proxy que não represente diretamente a importação da planta não é intercambiável para a regra operacional; se nenhum dataset sustentar o target, parar e registrar a evidência para decisão explícita antes de treinar ou gerar substituto.

## Resultado

A avaliação comparou fontes de carga, PV, EV e referência brasileira. Nenhuma representa diretamente o target integrado do Aurora. O responsável aprovou explicitamente `SIMULATED_COMPOSITE` apenas para o benchmark não operacional CG-AI-02; a decisão está registrada em `docs/ai/dataset-decision.md`. Amostras, qualidade e limites foram validados nessa unidade. Essa aprovação não autoriza previsão operacional nem treino.

## Critérios de aceite

- Matriz compara ao menos uma fonte de carga, uma solar e uma EV, ou justifica ausência.
- Proveniência, termos, granularidade, variáveis e incompatibilidades estão registrados para fontes reais.
- A ausência de fonte elegível para o target foi demonstrada; a decisão explícita limita o composto à validação acadêmica do pipeline.
- Não foi afirmado que fontes de locais diferentes formam medição integrada Aurora.

## Testes, documentação e commit

Verificar links e termos públicos; nenhuma amostra foi baixada porque isso depende da escolha do target/uso. Nenhum teste de código. Commit: `docs(ai): select evidence-based forecasting dataset`.

## Próximo passo condicionado

AI-01 e AI-02 concluídos. CG-AI-03 posteriormente definiu um horizonte de 60 minutos apenas para benchmark, comparou baselines e candidato em split temporal e não promoveu o AR(1). Isso não altera o escopo operacional aprovado por AI-01.
