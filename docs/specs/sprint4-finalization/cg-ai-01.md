# CG-AI-01 — due diligence e seleção de datasets

**Classificação:** BACKEND ONLY · **Status:** WAITING_FOR_PRODUCT_DECISION · **Tamanho:** MÉDIO · **Risco:** ALTO.

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

## Resultado e condição de parada

A avaliação comparou fontes de carga, PV, EV e referência brasileira. Nenhuma representa diretamente o target integrado do Aurora; a combinação entre locais produziria somente um composto simulado. A recomendação e opções estão em `docs/ai/dataset-decision.md`.

Não baixar/amostrar dados, congelar resolução/horizonte, gerar sintético ou iniciar AI-02 até o usuário escolher explicitamente uma alternativa. O target semântico continua `gridImportKw`; isso não autoriza previsão operacional.

## Critérios de aceite

- Matriz compara ao menos uma fonte de carga, uma solar e uma EV, ou justifica ausência.
- Proveniência, termos, granularidade, variáveis e incompatibilidades estão registrados para fontes reais.
- A ausência de fonte elegível para o target foi demonstrada e o gate de decisão foi registrado.
- Não foi afirmado que fontes de locais diferentes formam medição integrada Aurora.

## Testes, documentação e commit

Verificar links e termos públicos; nenhuma amostra foi baixada porque isso depende da escolha do target/uso. Nenhum teste de código. Commit: `docs(ai): select evidence-based forecasting dataset`.

## Próximo passo condicionado

Após decisão explícita, atualizar `dataset-decision.md` e só então mudar AI-02 para `READY`, se os termos e dados autorizados satisfizerem sua SDD.
