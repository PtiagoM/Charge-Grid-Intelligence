# CG-AI-01 — due diligence e seleção de datasets

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Selecionar dados reais adequados para prever demanda/importação da planta e risco de pico, antes de criar pipeline ou sintético.

## Fora de escopo

Download definitivo, treino, geração de dados, API, UI ou escolha de modelo por prestígio.

## Dependências e estado atual

Depende de F0-02. O repositório possui telemetria simulada curta, insuficiente para treino; ainda não há dataset ou licença congelados.

## Arquivos relevantes

Criar apenas `docs/ai/dataset-evaluation.md` e `docs/ai/dataset-decision.md`. Referenciar contratos S4-C2 e política de demanda vigente.

## Procedimento obrigatório

Avaliar fontes primárias/oficiais para carga de edifício, solar e EV (por exemplo Building Data Genome, ACN-Data e NREL, sem assumir aprovação). Para cada candidato registrar URL oficial, mantenedor, licença/termos, período, timezone, granularidade, variáveis, ausências, escala, método de acesso e uso acadêmico.

Uma combinação só é elegível se unidades, frequência e relógio puderem ser normalizados sem alegar causalidade inexistente. Dados de locais diferentes podem compor perfis de treino/simulação, mas não ser apresentados como uma única medição real do Aurora.

`dataset-decision.md` deve congelar target (`gridImportKw` ou proxy explicitado), resolução, horizonte, features disponíveis, regra de combinação, parte simulada complementar e limitações.

## Critérios de aceite

- Matriz compara ao menos uma fonte de carga, uma solar e uma EV, ou justifica ausência.
- Dataset escolhido tem licença/proveniência e acesso reproduzível.
- Target/horizonte são úteis ao Decision Engine e possíveis com os dados.
- Complementação simulada é identificada por coluna/origem.

## Testes, documentação e commit

Verificar links, licença e amostra/schema; nenhum teste de código. Commit: `docs(ai): select evidence-based forecasting dataset`.

## Condição de parada

Se nenhuma fonte atender uso/licença/granularidade, registrar bloqueio e pedir decisão antes de autorizar dataset totalmente sintético.
