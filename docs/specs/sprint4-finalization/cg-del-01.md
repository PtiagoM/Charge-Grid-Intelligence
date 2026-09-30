# CG-DEL-01 — entrega final da Sprint 4

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Consolidar documentação, resultados, roteiro e estado Git para que outra pessoa execute e demonstre o ChargeGrid sem contexto oculto.

## Fora de escopo

Feature nova, correção não reproduzida, push/PR/merge sem autorização ou alegação de produção.

## Dependências e estado atual

Depende de STAB-01. Evidência de INT-01B e gate global precisam existir.

## Arquivos relevantes

`README.md`, `docs/CURRENT_STATE.md`, plano/SDDs, arquitetura/diagramas, roteiro de vídeo, matriz de comportamento, metodologia ambiental, model card/dataset decision e evidência de testes.

## Conteúdo obrigatório

- título/equipe/problema/solução e continuidade das Sprints;
- arquitetura executável e fluxo laboratório→telemetria→core→IA/regras→Decision Engine→interfaces;
- setup PGlite/Node, env, start/stop seguro, reset e dados de demonstração;
- resultados quantitativos com período, fórmula e origem;
- dataset, modelo, baseline, métricas e limitações;
- matriz REAL/SANDBOX/SIMULATED/PREPARED/CONCEPTUAL;
- cenários e roteiro ≤5 minutos;
- requisitos GoodWe, sustentabilidade, automação e inovação;
- pendências honestas: hardware/GoodWe real, bateria, microcaptura <R$0,50 e itens fora do escopo.

## Critérios de aceite

- README reproduz runtime em clone limpo conforme ambiente disponível.
- Links/diagramas e comandos estão válidos.
- Relatório não contradiz código nem chama simulação de real.
- Git status contém somente alterações intencionais; sem segredo/artefato bruto.

## Testes, documentação e commit

Usar resultado global de STAB-01; repetir apenas se entrega alterar configuração executável. Validar links e `git diff --check`. Commit: `docs(sprint4): finalize integrated solution delivery`.

## Condição de parada

Parar antes de push, PR ou merge e solicitar autorização explícita com branch/hash/checks.
