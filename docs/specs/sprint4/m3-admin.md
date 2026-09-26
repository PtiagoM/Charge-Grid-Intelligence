# M3 — Admin final, sem migrar todo SEMS

Objetivo: finalizar operação comercial/energética nas superfícies existentes. GRANDE, quatro unidades. Entrada G1, independente de M2. Ler `apps/admin-web/AGENTS.md`, C1–C7/C9; C8 formato e indisponibilidade até M4. Não editar PWA. A1/A11 do plano são delimitação honesta, não novos sistemas de identidade/backoffice.

## S4-M3-U1 — Projeções, operação e sessões

- **Depende:** G1; **tamanho:** MÉDIO; **áreas:** A2/A3/A4.
- **Arquivos:** `src/services/commercialSnapshotRepository.ts`, `src/app/AdminState.tsx` (confirmar nome vigente pelo diretório), `src/domain/admin.ts`, `features/operations/{ChargerPages,ChargeGridOperationStage,ChargeGridOperationsDashboard}.tsx`, componentes de sessão encontrados nesses consumidores.
- **Implementar:** ID UUID preservado/publicCode label; state mapping sem perda; currentSessionId único; vaga B02 sem índice artificial; CONNECTED é ocupado, não disponível. Catálogo Aurora aparece em estabelecimento/local/equipamentos sem vincular a cliente FIAP por conveniência. Dados técnicos fixtures podem ficar explicitamente simulados, sem alimentar disponibilidade comercial.
- **Polling:** um snapshot periódico Admin2s; abortar/ignorar resposta antiga; comandos aguardam confirmação API; erro não ressuscita fixture. Visão geral e listas usam mesmos contadores disponíveis/ocupados.
- **Sessões:** lista, detalhe, filtros e timeline API; incluir energy ended versus settled; fonte GoodWe simulada rotulada. Histórico concluído não aparece como veículo atual do conector recém-conectado.
- **Aceite:** GIVEN seis CONNECTED WHEN abre overview/location/operations THEN0disponíveis em todos; GIVEN sessão COMPLETED antiga e novo CONNECT THEN currentSessionId null, não antiga “aguardando retirada”.
- **Testes:** V01/V02/V03, atualizar `tests/unit/commercial-snapshot.test.js` e testes de adapter/state relacionados; V-ADMIN. Revisão visual desktop1440 sem mudar identidade SEMS.
- **Saída:** Admin observa contrato fiel, sem fabricar dados para encaixar modelo local. Commit `fix(admin): preserve canonical operational state across projections`.

## S4-M3-U2 — Comandos, fila e financeiro

- **Depende:** U1; **tamanho:** MÉDIO; **áreas:** A3/A5/A6/A12.
- **Arquivos:** QueuePages, FinancialPages, `services/adminChargerCommandRepository.ts`, AdminState, domínio financialOperations, AdminSimulatorPage somente consumo de contrato, hardwareLabAccess.
- **Implementar:** comandos Start/Stop contingenciais com motivo pela API/provider; não bypass pagamento/demanda. Operação normal sem controles de simulação. Fila position/assignment/expiry servidor; mesma estimativa nullable PWA. Financeiro PI+autorizado+consumido+capturado+devolvido+pendente; valores desconhecidos de fee/payout não zero confirmado.
- **Refund:** ação existente usa endpoint servidor real test; limite e PI verificados; loading/error/resultados consistentes; refresh não perde devolução. Conciliação interna se retida grava evento de conferência, sem alegar repasse Stripe. Mensagens do detalhe seguem payment e session separadamente.
- **Lab:** manter hardware existente; reset exige confirmação/nenhum PI pendente conforme C4; UI não aprova pagamento nem cria sessão. Extensão energia fica M4.
- **Aceite:** GIVEN captured500/refunded100 THEN recebido líquido400 identificado, não payout; GIVEN Stop API falha THEN sem toast “parado”; GIVEN CALLED expiry THEN UI só observa relógio servidor.
- **Testes:** V04/V06/V07; V-ADMIN; financial adapters não convertem AUTHORIZED em receita; command double-click idempotente. Não executar refund real sem gate sandbox controlado.
- **Saída:** nenhuma ação comercial essencial local. Commit `feat(admin): connect commands queue and settlement to shared API`.

## S4-M3-U3 — Tarifas, publicação, métricas e relatórios

- **Depende:** U2; **tamanho:** MÉDIO; **áreas:** A2/A7/A10.
- **Arquivos:** AdminState, PlantPages, ChargerPages, FinancialPages, AdminDashboardPage, GovernancePages nas áreas pricing/reports, `services/adminReportRepository.ts`; localizar action handlers pelos rótulos atuais, não criar novas páginas.
- **Implementar:** versão tarifa servidor e horário/publicação Aurora; sessão/quote válida aceita não muda. Suspender publicação impede novos checkout sem interromper ativo. Séries comerciais/totais por período da API, não chartProfiles/tendências fixas. Energia inexistente antesM4 indisponível. CSV exporta os mesmos registros/intervalo/unidades; filtros reais de data/busca/paginação.
- **Sem capacidade:** deixar métrica não calculável indisponível, sem preencher percentual fictício. Relatório recorrente continua preferência sem envio, explicitamente identificado; nenhum scheduler.
- **Aceite:** GIVEN mudar tarifa190→200 WHEN nova quote THEN200, sessão antiga190; GIVEN período sem dados THENvazio/0 contagem real, sem curva padrão; GIVEN CSV THENtotal reconcilia com mesmo filtro visual.
- **Testes:** V06/V09; V-ADMIN; test API contrato agregado/projeções; visual overview/finance/pricing/report. Não calcular agregação financeira de forma divergente no React.
- **Saída:** alterações têm efeito backend e persistem reload/restart. Commit `feat(admin): use persisted pricing and truthful operational metrics`.

## S4-M3-U4 — Fronteira de capacidades e prontidão energética

- **Depende:** U3; **tamanho:** PEQUENO; **áreas:** A1/A8/A9/A11.
- **Arquivos:** SemsAnalysisPages, OrganizationGovernancePage, GovernancePages, ManagerShell, EnergyOperationsPage, IncidentPages, páginas de recomendações já existentes; alterações só em comportamentos enganosos/contrato de leitura.
- **Implementar:** desabilitar ou identificar indisponível/conceitual IV, diagnóstico bateria, expansão, helpdesk, grants/contratos/onboarding sem backend suficiente. Não declarar seis EV como baterias diagnosticadas. Login demo identificado, não promessa de autorização real. Não remover capacidade já funcional por capricho.
- **Energia/inteligência:** consumir contrato C8; até M4 sem amostra → indisponível, não zeros/benefício solar/admissão inventados. Orb não responde texto fixo como análise atual. Não introduzir IA externa. Corrigir filtros decorativos retidos e overflow que impeça uso.
- **Aceite:** GIVEN bateria sem provider WHEN usuário visita THEN não consegue obter resultado falso; GIVEN energia null THEN explicação indisponível em vez de “0/normal”; GIVEN grants locais THEN não afirmar revogação API efetuada.
- **Testes:** V-ADMIN; navegação visual áreas atingidas/teclado, estados vazios; grep de ações locais remanescentes limitado às features do núcleo.
- **Saída/G3:** A2–A7/A10/A12 prontos; A8/A9 aguardam G4, A1/A11 honestamente delimitados. Commit `fix(admin): make unsupported SEMS capabilities explicit`.

## Gate e riscos

G3 exige todos valores/comandos comerciais compartilhados e nenhum falso sucesso. Não exige implementar carteira multi-organização, contrato jurídico, IV ou bateria. Regressão de permissão visual existente deve ser corrigida, mas não virar IAM. Atualizar documentação Admin afetada por checkpoint, sem reescrever todo histórico.
