# CG-DASH-02 — conectar cards existentes do Dashboard

**Classificação:** PEQUENO AJUSTE NO FRONT · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

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
- A janela selecionada alimenta `GET /commercial/dashboard-summary`; filtros já existentes ficam acessíveis no card.

## Critérios de aceite

- Alterar laboratório/sessão muda cards após polling sem reload.
- Valor exibido coincide com payload e relatório do mesmo período.
- Nenhum import de fixture alimenta os quatro cards no cenário Aurora.
- Layout existente permanece reconhecível e PWA intocada.
- E2E focal controla o payload S4-C2, verifica valor renderizado e confirma a janela de 24h após selecionar o filtro.

## Implementação e validação

`AdminDashboardPage` consulta o endpoint S4-C2 em polling cancelável de 2s e preserva os valores do último payload em caso de falha, sinalizando stale. Os valores comerciais/energéticos dos cards existentes vêm do payload; como a API ainda não fornece série temporal, a área do gráfico declara essa ausência em vez de desenhar uma curva inventada. A pequena correção CSS apenas reexibe os filtros de período que já existiam no JSX e estavam ocultos.

Typecheck, lint e E2E focal do Dashboard passaram. Vitest e `vite build` do workspace não iniciaram neste ambiente porque o esbuild recebeu `Acesso negado` ao resolver as configurações em caminho acima do workspace; a janela do período foi verificada pelo E2E e o Vite do servidor usado por ele serviu a aplicação.

Commit: `feat(admin): connect dashboard cards to canonical aggregates`.

## Condição de parada

Se o ajuste exigir nova composição visual, marcar HUMAN FRONTEND GATE e pedir referência antes de editar layout.
