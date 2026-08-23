# Estratégia de testes do Dashboard Admin

## Estado atual: convergência de produto e interface

O Dashboard Admin está em reconstrução ativa: toma o SEMS+ como referência de linguagem e densidade, adiciona capacidades próprias do ChargeGrid e ainda ajusta decisões de modelo de negócio. Nesta fase, uma mudança de hierarquia, tela, texto ou fluxo pode ser deliberada; portanto, o teste não deve congelar uma aparência provisória.

## O que deve permanecer protegido

Testes unitários são a principal rede de segurança para regras que não podem mudar por acidente:

- autorização por papel e escopo;
- fila, admissão, no-show e idempotência;
- comandos de carregador e seus estados;
- demanda energética e bloqueios seguros;
- tarifas, cálculos em centavos, reembolso e conciliação;
- incidentes, recomendações explicáveis e relatórios sanitizados.

E2E deve cobrir somente jornadas críticas e a vertical alterada, como autenticação, bloqueio de acesso, carregador → sessão, fila, financeiro ou exportação. Evite asserts que dependam de cópia, card, ordem de abas ou geometria ainda em discussão.

## O que não automatizar agora

- snapshots de screenshot;
- matrizes de papéis × viewports × estados para cada tela;
- asserts detalhados de textos, espaçamentos, classes ou estrutura de componentes transitórios;
- execução da suíte E2E integral em toda alteração visual de branch de desenvolvimento.

Screenshots podem ser usados em revisão humana de PR, mas não são baseline nem critério automático nesta fase.

## Quando criar uma matriz visual

Somente após o responsável pelo produto declarar explicitamente que a tela ou fluxo está visualmente aprovado para manutenção. O registro deve identificar rota, papel, escopo, viewport, tema e estado cobertos. A partir daí, a matriz pode usar fixtures determinísticas, mascarar apenas dados realmente voláteis e comparar screenshots de modo rastreável.

## Gates de validação

| Momento | Exigência |
| --- | --- |
| Ajuste local de interface | lint, build, unitários relevantes e E2E apenas da jornada afetada quando houver comportamento novo ou regressão de navegação |
| PR para `develop/admin-web` | quality CI (lint, unitários e build); evidência visual humana quando ajudar a revisão |
| PR para `main` ou execução manual | suíte E2E integral e, quando houver baseline aprovado, matriz visual correspondente |

O workflow de CI mantém o E2E integral fora dos PRs comuns de desenvolvimento e o executa para `main` ou por `workflow_dispatch`.
