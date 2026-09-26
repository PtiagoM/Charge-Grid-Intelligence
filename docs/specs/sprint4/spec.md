# Sprint 4 — Especificação executável do protótipo final

Estado: **especificação; nenhuma unidade implementada por este pacote**. Base: `a767f79`, branch `feature/admin-sprint3-integration`, 24/09/2026. Plano superior: [Sprint 4](../../SPRINT4_FINAL_EXECUTION_PLAN.md); inventário: [matriz](../../SPRINT4_BEHAVIOR_MATRIX.md). A branch estava dois commits atrás da referência remota local; não sincronizar nem publicar sem respeitar o workflow.

**M0 concluído em 26/09/2026:** 12 documentos, 27 unidades M0–M7; links, estrutura, tabelas e aritmética dos vetores de energia/ociosidade conferidos. O responsável ratificou I-S01–I-S11 como `S4-C1`; leitura independente encontrou ambiguidades de ownership guest, DTOs, recuperação e dependências de gates, corrigidas neste pacote. A correção final de restart com Stop pendente foi confirmada pelo revisor. Isso valida a especificação, não o software: G1–G7 continuam pendentes de implementação.

## Objetivo e atores

Finalizar uma única operação Aurora, observada pelo motorista/visitante na PWA e pelo estabelecimento no Admin, com energia da planta, demanda e automação explicável. Laboratório substitui hardware; API decide; PGlite persiste. Não construir outro produto, tela de demonstração ou plataforma de produção.

## Como executar com contexto pequeno

1. Ler `AGENTS.md`, o workflow aplicável e `git status -sb`; preservar alterações locais. Não executar na `main`.
2. Ler este arquivo, [decisões](decisions.md), apenas as seções de [contratos](contracts.md) citadas pela unidade e o arquivo do marco selecionado.
3. Conferir a evidência de conclusão das dependências. Arquivo de spec existente não significa tarefa implementada. Se a base mudou, conferir somente os símbolos/arquivos listados; não refazer auditoria geral.
4. Executar **uma unidade identificada**, seus testes e documentação afetada. Não preencher lacunas com fixtures comerciais nem modificar contratos unilateralmente.
5. Revisar diff, registrar evidência e checkpoint lógico conforme autorização/workflow. Não fazer push/PR/merge por conta própria.
6. Relatar ID da unidade, arquivos, testes/comandos/resultados, limitações e próxima unidade elegível. Não declarar marco verde com gate não executado.

Modelo de instrução para um executor futuro:

> Execute somente S4-Mx-Uy seguindo docs/specs/sprint4/spec.md e o arquivo do marco. Confira dependências, implemente nos arquivos permitidos, rode a validação indicada e atualize a evidência. Não altere regras congeladas nem inicie a próxima unidade. Se houver incompatibilidade real de contrato, registre o conflito e pare apenas a unidade afetada.

Este pacote não é autorização para iniciar essa instrução agora. Campos/rotas novos são requisitos futuros, não descrição enganosa do código atual.

## Escopo fixo

- D1: só Aurora exige vertical completa. Outros locais visíveis: sem checkout/fila/operação fictícios.
- D2: ociosidade backend com 15 minutos e política aceita; captura abaixo de R$ 0,50 permanece limitação excluída.
- D3: tarifa aceita imutável; ofertas novas podem variar por política energética; sem top-up/segmentos.
- D4: PGlite em disco + Node contínuo oficial; PostgreSQL/Supabase remoto opcional.
- Sem novos pré-requisitos de autenticação administrativa, grants multi-organização, helpdesk, IV, bateria, expansão, offline avançado ou cloud. Desabilitar/identificar capacidades insuficientes.
- Preservar Maps e Stripe test reais, Auth motorista, telas/navegação. Não migrar arquitetura/SDK por preferência.

## Arquivos e dependências

| Marco / documento | Unidades | Dependência de entrada | Gate |
|---|---|---|---|
| [M0 — contrato](m0-contract.md) | U1 congelamento, U2 vetores | Plano e decisões aprovados | G0: contrato executável sem escolha de produto oculta |
| [M1 — fundação](m1-foundation.md) | U1 SQL/catálogo, U2 ownership, U3 checkout, U4 lifecycle, U5 liquidação, U6 fila, U7 leituras/configuração | G0 | G1: serviços e contratos estáveis |
| [M2 — PWA](m2-pwa.md) | U1 descoberta, U2 conta/checkout, U3 sessão/recibo, U4 fila/preferências | G1 | G2: motorista correto contra API |
| [M3 — Admin](m3-admin.md) | U1 projeções, U2 comandos/financeiro, U3 métricas/tarifas, U4 limites SEMS | G1; independente de M2 | G3: operação correta contra API |
| [M4 — energia](m4-energy.md) | U1 amostras, U2 demanda, U3 ofertas/inteligência | G1; G2/G3 para aceite visual | G4: energia/automação mensuráveis |
| [M5 — integração](m5-integration.md) | U1 ambiente isolado, U2 E2E, U3 gates reais | G2/G3/G4 | G5: mesma operação nas interfaces |
| [M6 — estabilidade](m6-hardening.md) | U1 retomada/cache, U2 falhas/visual | G5 | G6: demonstração repetível |
| [M7 — entrega](m7-delivery.md) | U1 documentação/resultados, U2 reprodução/entrega | G6 | G7: evidências e DoD final |

Dentro de M1 seguir U1 → U2 → U3 → U4 → U5 → U6 → U7; U3/U4 precisam ser revisadas juntas antes de aceitar pagamento + conexão. M2 e M3 podem ser executados separadamente, com branches e arquivos próprios; shared/API pertencem a M1/M4. Não congelar consumidores sobre JSONs divergentes. Mudança aditiva de contrato exige atualizar contracts.md, vetores e ambos consumidores no mesmo checkpoint de integração.

## Responsabilidade e impacto por camada

| Camada | Responsabilidade | Proibido |
|---|---|---|
| PWA/Admin | Interagir, apresentar, observar a cada ~2 s, converter unidades para exibição | Avançar energia/custo/fila, autorizar pagamento, inventar disponibilidade |
| API | Identidade motorista/visitante, preço, estados, energia, fila, política e projeções | Depender de tela aberta ou de GET para mover domínio |
| SQL | Registros, vínculos, idempotência simples, configuração e evidências | JSON/localStorage como autoridade concorrente |
| Provider GoodWe | Start/Stop, leitura e eventos normalizados, origem simulada explícita | Criar sessão comercial ou pagamento |
| Stripe | Confirmar autorização/captura/devolução em teste | Dropdown de resultado, valor final decidido pelo browser |
| Maps/Auth | Integrações existentes de mapa e identidade motorista | Trocar por fake para declarar gate real |
| Inteligência | Regras determinísticas da mesma API, motivo/entradas/efeito | ML/LLM fictício, score fixo tratado como resultado |

## Regras de trabalho e validação

Usar bibliotecas existentes. Datas UTC; exibição `America/Sao_Paulo`. API em `3333`, Admin `5173`, PWA `5174` no dev normal. Não iniciar dois processos sobre o mesmo diretório PGlite. Segredos somente no ambiente, não copiar `.env` para evidências.

Comandos existentes (prefixar `rtk` no ambiente Codex deste repositório):

| ID | Comando / uso |
|---|---|
| V-SHARED | `npm run build:shared` |
| V-API | `npm run test --workspace @chargegrid/api` (focal: acrescentar `-- src/commercial/repository.test.ts`) |
| V-ADMIN | `npm run test --workspace @chargegrid/admin-web` e `npm run build --workspace @chargegrid/admin-web` |
| V-PWA | `npm run build --workspace @chargegrid/driver-pwa`; não há script unit PWA hoje, usar integração/Playwright existente |
| V-GLOBAL | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` |
| V-E2E | Futuro `npx playwright test --config playwright.sprint4.config.ts`, criado por M5-U1; não existe ainda |

`npm run test:e2e:sprint3` hoje reutiliza servidor e reseta Aurora. **Não rodar contra banco pessoal.** M5-U1 isola os testes antes de usar reset. Testes focais por unidade; V-GLOBAL em checkpoints compartilhados conforme AGENTS e ao final. Não executar testes de produto para validar esta edição documental.

## Aceite, evidência e parada

[acceptance.md](acceptance.md) contém vetores comuns, cobertura e o registro de gates. Cada unidade acrescenta critérios GIVEN/WHEN/THEN próprios, dono, limites de arquivo, teste e condição de saída. [decisions.md](decisions.md) distingue aprovação do usuário de inferência técnica que precisa ser ratificada em G0.

Um bloqueio externo não autoriza substituir Stripe/Maps por simulação normal. Registrar causa, impacto e gate não validado; continuar unidades independentes. Capacidade secundária sem implementação suficiente fica indisponível/conceitual. Não elevar a limitação aceita <R$0,50 a bloqueio nem declarar que desapareceu.

## Definition of Done de uma unidade

- Comportamento e erros especificados cobertos; nenhum estado paralelo criado.
- Critérios da unidade e vetores citados aprovados; contratos compartilhados compilam nos consumidores.
- Documentação afetada acompanha código; diff revisado e sem segredos/artefatos acidentais.
- Registro de evidência identifica commit (se criado), comando, resultado e o que não foi validado.
- Próxima tarefa não exige redescobrir escolhas resolvidas. Pendência não disfarçada de sucesso.
