# CG-DASH-02 — conectar cards existentes do Dashboard

**Classificação:** PEQUENO AJUSTE NO FRONT · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Fazer `Monitoramento de energia`, `Receita ChargeGrid`, `Demanda ChargeGrid` e `Utilização ChargeGrid` consumirem exclusivamente o summary canônico, preservando página, cards, hierarquia e navegação existentes.

## Fora de escopo

Nova página, novo gráfico, reorganização de layout, IA ou alteração na PWA.

## Dependências e estado atual

Depende de DASH-01. `AdminDashboardPage.tsx` ainda possui dados de apresentação/fixtures que não representam integralmente a persistência comercial.

## Arquivos relevantes

`apps/admin-web/src/features/dashboard/AdminDashboardPage.tsx`, `services/commercialSnapshotRepository.ts`, `core/reports.ts`, `core/sustainability.ts`, estilos somente se necessários para estado indisponível, testes do Dashboard.

## Comportamento esperado

- Um fetch/poll central usa período explícito e cancela request anterior.
- Cards mostram loading, erro, indisponível e valor medido/derivado sem converter ausência em zero.
- Tendência só aparece se API fornecer série comparável real; caso contrário, esconder/rotular indisponível.
- Receita usa líquido capturado; demanda diferencia atual, pico e limite; utilização informa período/base do cálculo.
- Polling observa, nunca avança energia.

## Critérios de aceite

- Alterar laboratório/sessão muda cards após polling sem reload.
- Valor exibido coincide com payload e relatório do mesmo período.
- Nenhum import de fixture alimenta os quatro cards no cenário Aurora.
- Layout existente permanece reconhecível e PWA intocada.

## Testes, documentação e commit

Unit do mapper e um E2E focal do Dashboard com API controlada; não rodar todos os E2E. Atualizar CURRENT_STATE/SDD. Commit: `feat(admin): connect dashboard cards to canonical aggregates`.

## Condição de parada

Se o ajuste exigir nova composição visual, marcar HUMAN FRONTEND GATE e pedir referência antes de editar layout.

