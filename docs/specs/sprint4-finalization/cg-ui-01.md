# CG-UI-01 — apresentação da previsão em Energia e demanda

**Classificação:** HUMAN FRONTEND GATE · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Exibir previsão, qualidade e impacto dentro da tela existente `Energia e demanda`, preservando `Agora`, `Fluxo`, `Decisão`, `Impacto` e `Política`.

## Fora de escopo

Nova página de IA, novo dashboard, redesign da tela, controle direto de hardware ou alteração da PWA.

## Dependências e estado atual

Depende de AI-05. A API entregará forecast; a página já apresenta energia/decisão atual, mas não há composição visual aprovada para futuro previsto.

## Arquivos relevantes

`apps/admin-web/src/features/energy/EnergyOperationsPage.tsx`, `services/commercialSnapshotRepository.ts`, estilos existentes e E2E de energia.

## Dados e estados necessários

- geração/horizonte/step, série prevista e unidade;
- modelVersion, origem dos inputs e métricas históricas de teste;
- `AVAILABLE`, `STALE`, `UNAVAILABLE` e motivo;
- ponto de pico, limite e estado preditivo vindos do backend;
- distinção inequívoca entre medido atual e previsto;
- loading, erro e ausência de dados sem curva fake.

## HUMAN FRONTEND GATE

Antes de TSX/CSS, solicitar referência visual para encaixe nos blocos existentes. O responsável define composição/hierarquia; o executor preserva design system e contratos.

## Critérios de aceite

- UI reproduz payload, período e unidades sem recalcular decisão.
- Previsão indisponível não aparece como zero.
- Erro esperado é métrica histórica identificada, não “confiança” inventada.
- Nenhuma nova rota/página e PWA permanece intocada.

## Testes, documentação e commit

Após o gate: unit do mapper, E2E focal dos três estados e validação visual humana. Atualizar docs de Energia. Commit: `feat(admin): present demand forecast evidence`.

## Condição de parada

Parar antes da interface sem referência visual; backend concluído não autoriza composição própria.
