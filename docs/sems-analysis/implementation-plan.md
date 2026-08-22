# Plano de implementação do Dashboard Admin

**Status:** execução em M5. M0/M1 estão consolidados; M2–M4 cobrem plantas, carregadores/sessões e fila; M5 possui snapshot energético tipado, frescor, política por estabelecimento, bloqueio de início e recomendação determinística. Autorização backend e providers reais permanecem pendentes. Os protótipos visuais de M6–M8 não significam conclusão. A revisão crítica vigente está em `docs/admin-dashboard/CRITICAL_REVIEW.md`.

**Estimativas:** dias úteis de desenvolvimento e validação para uma pessoa experiente, usadas apenas para ordenar e dimensionar. Integrações não homologadas podem ampliar os intervalos.

## M0 — Fundação, contratos e cenários

- **Objetivo:** criar o novo workspace e congelar a fronteira SEMS+/ChargeGrid.
- **Páginas/fluxos:** nenhuma página final; harness de cenários.
- **Componentes:** tokens mínimos, providers de tema, erro e sessão.
- **Dependências:** `CURRENT_STATE`, contratos/enums, decisão de nome/repositório.
- **Mocks:** papéis, escopos, relógio e catálogo de cenários versionados.
- **Funcionalidades:** cliente API, envelopes de erro, IDs interno/externo e feature flags.
- **Aceite:** build/test/lint reproduzíveis; fixtures validam o mesmo contrato da API.
- **Validação visual:** página técnica de tokens nos dois temas, sem virar design system completo.
- **Testes:** contrato, enums desconhecidos, relógio e sanitização de dados.
- **Riscos:** carregar decisões históricas superadas ou modelar payload GoodWe como domínio próprio.
- **Estimativa:** 3–5 dias.

## M1 — Shell, navegação, temas e RBAC

- **Objetivo:** entregar o shell administrativo integrado e a troca segura de contexto.
- **Páginas/fluxos:** login/fallback, dashboard vazio, `/chargegrid`, acesso negado e logout.
- **Componentes:** `AppShell`, sidebar, topbar, conta, escopo, breadcrumb, header e estados globais.
- **Dependências:** M0; matriz inicial de capacidades.
- **Mocks:** GoodWe admin, estabelecimento admin, operador, sessão expirada e organização sem plantas.
- **Funcionalidades:** claro/escuro persistido, rotas protegidas e navegação condicionada.
- **Aceite:** mesma rota projeta conteúdo permitido por papel; backend/mock nega ação indevida.
- **Validação visual:** comparar shell, densidade, topbar, sidebar e temas com SEMS-SHELL-002/003/004.
- **Testes:** unidade de permission map, integração de sessão e E2E de login/escopo/logout.
- **Riscos:** confundir papel observado no sandbox com papel definitivo do ChargeGrid.
- **Estimativa:** 4–6 dias.

## M2 — Planta comercial e onboarding

**Estado atual:** baseline local concluída. O catálogo técnico é somente leitura; o vínculo comercial persiste rascunho, valida duplicidade/autorização/dados/EV e projeta ponto e carregadores sem recadastro. Provider GoodWe real, SSO e autorização na API seguem pendentes.

- **Objetivo:** vincular planta GoodWe existente e publicar perfil comercial mínimo.
- **Páginas/fluxos:** portfólio, detalhe e onboarding comercial.
- **Componentes:** tabela/cards, mapa opcional inicial, context tabs, wizard, validação e resumo.
- **Dependências:** M1; `Plant`, `Establishment`, autorização GoodWe mockada.
- **Mocks:** planta normal/vazia/sem EV/não autorizada e estabelecimento multi-planta.
- **Funcionalidades:** selecionar planta, detectar carregadores, configurar horários/acesso e publicar.
- **Aceite:** nenhum dado técnico é recadastrado; publicação falha com pré-condição explícita.
- **Validação visual:** lista/detalhe/empty state contra SEMS-PLANT-005..007 e shell observado.
- **Testes:** validação assíncrona, escopo, duplicidade de vínculo e retomada do rascunho.
- **Riscos:** SSO/autorização GoodWe e semântica de organização ainda abertos.
- **Estimativa:** 5–8 dias.

## M3 — Carregadores e sessões

- **Objetivo:** entregar o primeiro fluxo operacional de EV e sessão comercial.
- **Páginas/fluxos:** lista/detalhe de EV, sessões ao vivo, detalhe/timeline e histórico de comando.
- **Componentes:** status técnico/comercial, telemetria fresca, session timeline e audit trail.
- **Dependências:** M2; estados de sessão, Payment Adapter e GoodWe Provider simulados.
- **Mocks:** EV disponível, conectado, carregando, inativo, falha, offline; start/stop pendente/sucesso/falha.
- **Funcionalidades:** acompanhar sessão, solicitar start/stop autorizado e confirmar por evento/telemetria.
- **Aceite:** UI nunca declara carga/interrupção apenas pelo aceite HTTP; toda ação tem autor/motivo.
- **Validação visual:** inventário e detalhe coerentes com SEMS-EV-001/002, sem copiar identificadores.
- **Testes:** máquina de estados, idempotência, timeout, telemetria antiga e `START_FAILED`.
- **Riscos:** campos/comandos GoodWe ainda não homologados.
- **Estimativa:** 6–9 dias.

## M4 — Fila e operação cotidiana

- **Objetivo:** dar ao operador contexto de espera e admissão por estabelecimento.
- **Páginas/fluxos:** fila, sessões ao vivo e chamada/no-show.
- **Componentes:** `QueuePanel`, posição/espera, janela de chamada, alertas e ação contextual.
- **Dependências:** M3; compatibilidade, disponibilidade comercial e notificações.
- **Mocks:** vazia, populada, chamada, expirada, uma fila ativa por motorista e carregadores incompatíveis.
- **Funcionalidades:** confirmar entrada originada pela PWA, chamar, atribuir primeiro EV compatível e expirar.
- **Aceite:** fila é por estabelecimento, exclusiva para autenticados e não vira reserva de conector.
- **Validação visual:** densidade/tabela/badges seguem padrões SEMS+; nenhuma identidade desnecessária aparece.
- **Testes:** FIFO, concorrência, no-show, navegação e isolamento entre estabelecimentos.
- **Riscos:** requisitos históricos conflitantes sobre visitante; usar somente regra vigente.
- **Estimativa:** 4–6 dias.

## M5 — Energia, sustentabilidade e demanda

- **Objetivo:** ligar telemetria GoodWe a decisões comerciais auditáveis.
- **Páginas/fluxos:** energia/demanda, detalhe de planta, sessões afetadas e recomendação determinística.
- **Componentes:** flow diagram, gráficos, KPIs, freshness indicator, `DemandBanner` e reason panel.
- **Dependências:** M3; snapshots e limiares configuráveis.
- **Mocks:** `NORMAL`, `ALERT`, `CRITICAL`, sem telemetria e recuperação.
- **Funcionalidades:** bloquear novos inícios, sugerir/solicitar stop conforme prioridade e atribuir energia sustentável apenas quando calculável.
- **Aceite:** proteção elétrica não é atribuída ao ChargeGrid; comando pendente só conclui após confirmação.
- **Validação visual:** semântica de energia contra SEMS-ENERGY-001/002 nos dois temas.
- **Testes:** limiares, frescor, prioridade, falha de comando e transições de estado.
- **Riscos:** granularidade/latência GoodWe e método de atribuição solar.
- **Estimativa:** 5–8 dias.

## M6 — Tarifa, ociosidade e financeiro

- **Objetivo:** fechar preço aceito, garantia, cálculo, liquidação e visão financeira.
- **Páginas/fluxos:** tarifa/políticas, sessão financeira, dashboard financeiro e tarefas de exportação.
- **Componentes:** editor versionado, breakdown, timeline financeira, task center e filtros.
- **Dependências:** M3; Payment Adapter sandbox, precisão monetária e políticas.
- **Mocks:** cartão/Pix, autorizado, falho, reembolso, settlement pendente, disputa e ociosidade.
- **Funcionalidades:** versionar tarifa, calcular segmentos/ociosidade, conciliar e separar receita energética/comercial.
- **Aceite:** nenhuma energia comercial sem garantia; valores exibem fonte e estado; comissão é parametrizada/demonstrativa.
- **Validação visual:** KPIs, tabelas e tarefas contra padrões SEMS-REPORT-002/003.
- **Testes:** arredondamento, limite financeiro, top-up se aprovado, reembolso, retentativa e RBAC.
- **Riscos:** split, fiscalidade, custo energético, chargeback e live não definidos.
- **Estimativa:** 6–10 dias.

## M7 — Incidentes e recomendações

- **Objetivo:** transformar sinais técnicos em acompanhamento operacional e orientação explicável.
- **Páginas/fluxos:** inbox/detalhe de incidente e recomendações.
- **Componentes:** severity badge, correlação, timeline, responsável, recommendation card e confiança.
- **Dependências:** M3/M5/M6; taxonomia, notificações e fallback determinístico.
- **Mocks:** falhas EV, duplicata, sessão afetada, IA indisponível, baixa/alta confiança.
- **Funcionalidades:** criar/deduplicar/atribuir/resolver incidente; aceitar/adiar/rejeitar recomendação sem autoexecutar.
- **Aceite:** alarme GoodWe permanece origem; decisão humana e ação subjacente são auditadas separadamente.
- **Validação visual:** filtros, severidades e assinaturas inspirados em SEMS-ALARM-001/002 e SEMS-EV-003.
- **Testes:** correlação, deduplicação, autorização, fallback e ausência de dados.
- **Riscos:** governança IA, ownership de suporte e SLA.
- **Estimativa:** 5–8 dias.

## M8 — Usuários, relatórios, estados e hardening

- **Objetivo:** completar administração, relatórios e qualidade transversal.
- **Páginas/fluxos:** acesso/usuários, relatórios, downloads, assinaturas e todos os estados de erro/vazio.
- **Componentes:** user table, role editor, report builder, subscriptions e task center.
- **Dependências:** M1–M7; políticas finais e projeções.
- **Mocks:** cada papel, nenhuma planta, exportação falha, assinatura desativada e acesso revogado.
- **Funcionalidades:** conceder/revogar escopo, gerar/assinar/exportar e auditar.
- **Aceite:** isolamento por organização/planta é testado; operador não vê parâmetros sensíveis.
- **Validação visual:** comparar organização, filtros e tarefas com padrões observados, sem dados pessoais.
- **Testes:** RLS/policies, matrix RBAC, exportação assíncrona, acessibilidade e recuperação de erro.
- **Riscos:** usar apenas ocultação visual como autorização ou exportar dados excessivos.
- **Estimativa:** 5–8 dias.

## M9 — Validação visual completa e prontidão

- **Objetivo:** fechar fidelidade, regressão e critérios de entrega do módulo.
- **Páginas/fluxos:** matriz completa MUST e SHOULD que entrou na release.
- **Componentes:** todos os estados nos dois temas.
- **Dependências:** M1–M8 e referências sanitizadas.
- **Mocks:** snapshots determinísticos por papel/viewport/estado.
- **Funcionalidades:** nenhuma nova; correção de divergências e hardening.
- **Aceite:** zero divergência S0/S1, orçamento visual atendido e E2E crítico verde.
- **Validação visual:** Playwright local + comparação com referências SEMS+ sanitizadas.
- **Testes:** regressão completa, acessibilidade, performance básica e segurança de conteúdo.
- **Riscos:** fontes/mapas/gráficos não determinísticos e diferenças de ambiente.
- **Estimativa:** 4–7 dias.

## Ordem e paralelismo seguro

```text
M0 → M1 → M2 → M3
                 ├→ M4
                 ├→ M5
                 └→ M6
M4 + M5 + M6 → M7 → M8 → M9
```

Depois de M3, fila, energia e financeiro podem avançar em paralelo se contratos e fixtures permanecerem compartilhados. Cada milestone deve ser demonstrável e testável isoladamente antes da próxima dependência.
