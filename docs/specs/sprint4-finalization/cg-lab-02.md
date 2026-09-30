# CG-LAB-02 — controles de cenário no laboratório

**Classificação:** HUMAN FRONTEND GATE · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Permitir ao operador técnico selecionar e observar os perfis de LAB-01 dentro do laboratório existente, sem criar nova navegação ou alterar a experiência comercial.

## Fora de escopo

Definir design sem referência, novo dashboard, pagamento/sessão, simular decisão financeira ou mover controles para Operação.

## Dependências e estado atual

Depende de LAB-01. `AdminSimulatorPage` já opera hardware por carregador e planta; os novos estados lógicos podem ser implementados, mas a composição visual precisa da referência do responsável.

## Arquivos relevantes

`apps/admin-web/src/features/simulator/AdminSimulatorPage.tsx`, `services/commercialSnapshotRepository.ts`, estilos existentes e E2E focal do laboratório.

## Dados e estados necessários

- lista de `scenarioId`, nome, finalidade, versão e proveniência;
- cenário ativo, início, step e status do provider;
- valores atuais PV/base/EV/rede, quality e timestamp;
- ações `aplicar`, `perder telemetria`, `recuperar` e `reiniciar dados de teste`, sujeitas aos endpoints técnicos;
- loading, conflito, erro, indisponível e confirmação de aplicação.

## HUMAN FRONTEND GATE

Antes de editar TSX/CSS, apresentar ao responsável estes dados/ações e solicitar screenshot, wireframe ou descrição final. Reutilizar a página existente conforme a referência; não inventar layout.

## Critérios de aceite

- Ação visual chama API de LAB-01 e estado observado vem do backend.
- Operação/Energia refletem o cenário sem reload e sem controles artificiais nelas.
- Laboratório permanece identificado como simulação técnica.
- Nenhum registro comercial é criado.

## Testes, documentação e commit

Após o gate: teste de mapper/componente apenas se houver lógica, um E2E focal aplicar→polling e validação manual do responsável. Commit: `feat(admin): control reproducible hardware lab scenarios`.

## Condição de parada

Parar obrigatoriamente antes do frontend se não houver referência visual aprovada.
