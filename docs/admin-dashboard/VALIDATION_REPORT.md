# Relatório de validação do Dashboard Admin

**Atualizado em:** 27 de agosto de 2026  
**Cobertura:** histórico M9, fundação F0 e convergência visual/operacional consolidada na PR #16.

As primeiras seções preservam a evidência histórica da rodada M9. A evidência corrente está consolidada na seção “Convergência visual e Operação ChargeGrid — 25 a 27/08/2026”.

## Registro histórico M9

**Data:** 23 de agosto de 2026  
**Branch histórica:** `chore/admin-release-hardening`  
**Escopo:** fechamento local dos marcos M0–M9, sem alterações no Driver PWA e sem integração na `main`.

## Resultado

Este documento registra a rodada M9 anterior. A validação vigente da Fase 0 está no PR #9 e no plano `docs/admin-dashboard/NEXT_EXECUTION_PLAN.md`.

O Admin está coerente com a arquitetura nativa vigente e pronto para servir de base ao próximo redesenho. O hardening removeu páginas paralelas que ainda simulavam carregadores, sessões, energia, financeiro, recomendações e relatórios, preservando apenas as verticais de domínio introduzidas em M3–M8. A participação contratual deixou de usar percentual fixo e agora deriva da política tarifária ativa.

Foram corrigidos dois casos de overflow horizontal em 390 px: ações do topo/navegação contextual e painéis com tabelas de relatório. As tabelas continuam largas por natureza, mas rolam dentro de seu contêiner sem expandir o documento.

## Evidência executada

| Verificação | Resultado |
| --- | --- |
| `npm test --workspace @chargegrid/admin-web -- --maxWorkers=1` | 20 arquivos e 70 testes aprovados |
| `npm run build --workspace @chargegrid/admin-web` | TypeScript e Vite aprovados; bundle principal de 454,21 kB (128,49 kB gzip) |
| `npm run lint -- --no-warn-ignored apps/admin-web/src apps/admin-web/tests/e2e` | aprovado sem apontamentos |
| E2E focal de login, fronteira Admin/PWA, plantas, navegação, recomendações, relatórios, responsividade e prontidão | 14 cenários únicos aprovados em 18 execuções |
| inspeção Playwright | desktop 1280 px e mobile 390 px inspecionados; matriz automatizada também cobre 1440 px |

O E2E focal cobre os quatro papéis (`GOODWE_ADMIN`, `ESTABLISHMENT_ADMIN`, `ESTABLISHMENT_OPERATOR` e `REPORT_VIEWER`), rotas críticas, ocultação de domínios sensíveis, sequência de foco do login, erro de autenticação, landmarks e ausência de overflow do documento.

> Nota de produto de 23/08/2026: esta linha registra a fixture validada naquela entrega. `GOODWE_ADMIN` não é mais a persona canônica futura; será decomposto em responsabilidade, escopo e capacidades conforme `PRODUCT_DECISIONS.md`.

## Rodada SEMS+ + camada ChargeGrid — 23/08/2026

A nova rodada preservou as superfícies técnicas do SEMS+ e incorporou governança comercial por planta. Foram validados o inventário completo de dispositivos, os escopos explícitos da GoodWe, a Gestão da organização, a separação entre função SEMS+ e papel ChargeGrid e o onboarding protegido por contrato.

| Verificação | Resultado |
| --- | --- |
| `npm run lint -- --no-warn-ignored apps/admin-web/src apps/admin-web/tests/e2e` | aprovado sem apontamentos |
| `npm run build --workspace @chargegrid/admin-web` | TypeScript e Vite aprovados; bundle principal de 489,92 kB (136,97 kB gzip) |
| `npm test --workspace @chargegrid/admin-web -- --maxWorkers=1` | 20 arquivos e 70 testes aprovados |
| E2E focal de dispositivos, governança/contratos e plantas | 11 de 11 cenários aprovados |
| inspeção focal em navegador | abas Carregador veicular e Dongle verificadas contra as referências catalogadas |

O teste E2E confirma que o estabelecimento não é digitado no onboarding: ele é derivado e bloqueado pelo contrato autorizado. Também confirma que `Administrador`, `Navegador` e `Técnico` são funções organizacionais SEMS+ independentes dos papéis comerciais ChargeGrid.

### Detalhe do carregador — 23/08/2026

O detalhamento foi limitado ao carregador por decisão de produto. A tela reproduz a composição SEMS+ observada — equipamento, estado, último carregamento, monitoramento e drawers de informações e registros — e acrescenta sessão, motorista, pagamento e comandos ChargeGrid sem criar detalhes artificiais para inversores, dongles ou dispositivos de terceiros.

| Verificação | Resultado |
| --- | --- |
| lint do Admin | aprovado sem apontamentos |
| build do Admin | aprovado; bundle principal de 500,64 kB (139,09 kB gzip) |
| E2E focal de inventário, detalhe, drawers e comandos | 5 de 5 cenários aprovados |
| E2E específico após o drawer de informações | 2 de 2 cenários aprovados |
| inspeção Playwright em 1440 × 900 | visão geral e drawer de carregamentos inspecionados; sem erro funcional no console |

O drawer de informações usa somente metadados já presentes no modelo local do carregador; firmware e observação permanecem como ausentes, sem dados inventados. Os testes unitários não foram repetidos nesta subrodada porque não houve alteração de domínio; a suíte completa de 70 testes já havia sido aprovada imediatamente antes dela. O único erro de console observado foi a requisição preexistente de `favicon.ico` com resposta 404.

## Decisão sobre a regressão integral

A execução integral local foi interrompida por decisão explícita do produto. O dashboard terá alterações amplas de visual, fluxos e telas nos próximos passos; manter agora uma bateria visual extensa e snapshots de uma interface transitória geraria custo sem proteger a versão futura. A suíte de domínio permanece preservada e a regressão visual integral deve ser criada somente após aprovação explícita da direção visual, conforme `TESTING_STRATEGY.md`.

## Pendências deliberadas

- integração com providers GoodWe, Stripe, armazenamento de relatórios e notificações reais;
- autorização backend, RLS e provisionamento de identidade;
- tema claro, que ainda não faz parte da interface executável;
- avaliação de performance com dados de produção e rede real;
- nova matriz visual completa e snapshots após o próximo redesenho;
- validação humana antes de qualquer Pull Request chegar à `main`.

## Consolidação de responsabilidades e fluxos — 23/08/2026

**Branch de entrega:** `feature/admin-responsibility-flows`, baseada no HEAD já integrado pelo PR #4. A entrega `7fe0205` foi integrada em `develop/admin-web` pelo PR #5 (`b7d3fea`).

Esta rodada corrigiu o frontend para representar o modelo vigente sem simular segurança de backend. Conta SEMS+, função organizacional, vínculo ChargeGrid, papel, escopo e capacidade deixaram de ser tratados como uma única classificação. Uma conta SEMS+ comum autentica e preserva todas as superfícies técnicas sem receber qualquer conteúdo ChargeGrid. Revogar uma concessão comercial remove o papel, mas não desativa a identidade SEMS+.

Também foram concluídos:

- shell com as sete superfícies SEMS+ e navegação ChargeGrid contextual;
- escopo explícito aplicado a portfólios, energia, alarmes, financeiro, fila, sessões e suporte;
- Central GoodWe sem passe operacional global e consultor limitado à carteira;
- técnico/suporte sem sessões, motorista, contrato, tarifa ou financeiro por padrão;
- contratos e ativações concentrados na Gestão da organização, com seção persistida na URL;
- remoção dos fluxos manuais de cliente, ponto e carregador GoodWe;
- carregadores descobertos como `ELIGIBLE`, com transições individuais `ELIGIBLE → CONFIGURED → PUBLISHED → SUSPENDED`;
- janela de chamada da fila unificada em dez minutos;
- resumos compactos adotados nas novas áreas de governança, preservando a decisão de não iniciar uma varredura visual integral.

Validação executada nesta rodada: build e lint do Admin aprovados; 20 arquivos e 72 testes unitários aprovados; 20 cenários E2E focais aprovados entre navegação, responsabilidades, dispositivos, plantas, acesso e relatórios. Nenhum snapshot ou baseline visual foi criado. O navegador integrado não ficou disponível para inspeção manual; a validação visual direta deve ser retomada quando a sessão de navegador estiver exposta. O CI do PR #5 também aprovou lint, testes e build; a regressão E2E integral foi ignorada conforme a política de desenvolvimento.

## Convergência visual e Operação ChargeGrid — 25 a 27/08/2026

Esta rodada avançou da fundação de personas para as superfícies principais do proprietário comercial. As entregas foram publicadas como PRs empilhados para permitir revisão isolada e integração na ordem correta:

| PR | Base | Escopo | Estado verificado em 27/08/2026 |
| --- | --- | --- | --- |
| #11 | `develop/admin-web` | Painel geral agregado | integrada, CI aprovado |
| #12 | `feature/admin-dashboard-aggregate` | Lista de usinas | integrada na cadeia, CI aprovado |
| #13 | `feature/admin-plants-reference` | Lista de dispositivos | integrada na cadeia, CI aprovado |
| #14 | `feature/admin-devices-reference` | Operação ChargeGrid e detalhes | integrada na cadeia, CI aprovado |
| #15 | `feature/admin-chargegrid-operations` | Consolidação documental | integrada na cadeia, CI aprovado |
| #16 | `develop/admin-web` | Rollup da ponta atual | aberta para integração final |

### Superfícies verificadas

- Painel agregado com mapa, Economia e modos de monitoramento;
- lista de usinas com pesquisa, filtros e contexto comercial somente onde aplicável;
- lista de dispositivos agrupada por usina, filtro por planta e ações corretas;
- Operação ChargeGrid com carrossel de vagas/veículos, seleção de carregador, alarmes, performance, gráfico e condição energética;
- Fila automática e somente leitura;
- detalhe do carregador com controles compactos de contingência;
- detalhe da sessão com progresso, indicadores, energia, pagamento e linha do tempo operacional;
- detalhe do pagamento com progresso financeiro, composição, referências, conciliação, reembolso e histórico auditável;
- navegação sessão ↔ pagamento ↔ resumo financeiro e retorno de carregador fora do escopo.

### Evidência automatizada

| Verificação | Resultado |
| --- | --- |
| `npm run lint` | aprovado |
| `npm test --workspace @chargegrid/admin-web -- --maxWorkers=1` | 20 arquivos e 76 testes aprovados |
| `npm run build --workspace=apps/admin-web` | TypeScript e Vite aprovados; permanece apenas o aviso conhecido de chunk principal acima de 500 kB |
| E2E focal de fila, carregador, sessões e financeiro | 13 de 13 cenários aprovados |
| E2E focal após redesenho do pagamento | 5 de 5 cenários aprovados |
| `git diff --check` | aprovado |

### Evidência visual

Playwright CLI foi usado em `1440 × 1000` para revisar Operação, Fila, detalhe do carregador, detalhe da sessão e detalhe do pagamento. Foram confirmados:

- escala equivalente ao Painel para carros, fontes, indicadores e gráfico;
- alarmes acima da performance comercial;
- ausência de `Sessões recentes` e `Fila atual` no dashboard operacional;
- ausência de ações manuais na fila;
- alinhamento dos cards e integridade da linha do tempo da sessão;
- fluxo funcional e hierarquia do detalhe do pagamento;
- nenhum erro funcional no console; as mensagens observadas eram somente duas requisições 404 do `favicon.ico` no ambiente local.

### Limites desta validação

- a suíte E2E integral do Admin não foi executada localmente nesta rodada;
- o job de regressão E2E integral permanece `skipped` no workflow automático, conforme a estratégia vigente;
- não foram criados snapshots ou baselines visuais;
- Driver PWA, API e contratos compartilhados não foram alterados nem revalidados, porque a rodada foi exclusiva do Admin;
- integração em `develop/admin-web` e `main` continua dependente de revisão e decisão humana.
