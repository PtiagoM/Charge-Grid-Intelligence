# M7 — Evidências e entrega final

**Estado:** U1 e validação automatizada de U2 concluídas em 30/09/2026; G7 aguarda ensaio manual M7-U2. Objetivo: consolidar a baseline S4-C1 com o que funciona. MÉDIO. Não construir feature nova para preencher relatório. G7 concluído desbloqueia `CG-F0-01`; ele não elimina a validação posterior dos deltas S4-C2.

## S4-M7-U1 — Documentação e resultados verdadeiros

- **Arquivos:** README.md, docs/CURRENT_STATE.md, documentos arquitetura/contratos afetados, plano/matriz Sprint 4 e este pacote; histórico Sprint 3 preservado. Atualizar docs existentes em vez de diários redundantes.
- **Implementar documentação:** objetivo/equipe a partir do repo sem inventar nomes; continuidade Sprint 3; arquitetura executável, diagrama API/DB/provider; setup PGlite + Node; versões/comandos/variáveis efetivos; origem de cada dado; jornadas finais; limites e comparação antes/depois. Dados de teste/catálogo mantêm IDs e tarifas documentadas.
- **Matriz integração:** real = frontends/API/SQL local/Maps/Auth implementado; sandbox real = Stripe; simulado = hardware/telemetria planta; SQL remoto preparado ou validado com evidência; conceitual = capacidades explicitamente excluídas. Não classificar PGlite como banco fake.
- **Quantitativo:** tabelar entradas/intervalo/EVWh/importWh/exportWh/solarToEvWh, comandos e estados antes/depois; timestamp/build e fórmula. Resultado medido pelo simulador não é validação de equipamento físico. Contrafactual22→15kW é cálculo sob entradas especificadas, não redução de fatura real.
- **Qualitativo:** motorista recupera sessão/recibo, operador vê mesma sessão, automação explica bloqueio/corte/retomada; reduzir divergências UI demonstradas por testes, não métricas de satisfação inventadas.
- **Aceite:** toda afirmação “implementado” tem unidade/gate/commit e evidência; ausência de bateria sem falsa sustentabilidade; desconto não prova redução de custo energético.
- **Verificação:** links/diagramas, nomesenv versus código, screenshots sem PII/segredos; marcar documentação anterior superada sem apagar decisões históricas.
- **DoD:** relatório corresponde ao build validado. Commit `docs(sprint4): consolidate implemented architecture and measured results`.

## S4-M7-U2 — Reprodução, roteiro e fechamento

- **Depende:** U1.
- **Executar:** checkout limpo autorizado/diretório separado, `npm ci`, V-GLOBAL, V-E2E, migrations/seed oficial, API contínua; mesma operação depois de restart. Nunca copiar DB pessoal nem .env para Git. Configurar apenas variáveis documentadas usando ambiente seguro.
- **Env existente a documentar:** VITE_CHARGEGRID_API_URL, VITE_GOOGLE_MAPS_API_KEY, VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY, CHARGEGRID_ALLOWED_ORIGINS, PORT; CHARGEGRID_DATABASE_PATH oficial, CHARGEGRID_DATABASE_URL opcional; flags lab conforme código. SUPABASE_SERVICE_ROLE_KEY não é requisito para banco local nem deve ir ao browser. Não listar variável nova sem implementação.
- **Roteiro enxuto proposto:** 0:00–0:30 problema/arquitetura; 0:30–1:30 PWA Maps→Aurora→quote→Stripe; 1:30–2:20 conectar/start e Admin com a mesma sessão; 2:20–3:30 lab muda PV/base, demanda/decisão/efeito; 3:30–4:20 parar/desconectar/financeiro/recibo; 4:20–5:00 resultados/matriz real-simulado/limitações. Fila/idle de 15 min terão evidência complementar pré-gravada ou cortes identificados, sem fingir passagem instantânea de tempo no fluxo normal. Ajustar duração se regulamento final exigir outra; não alegar tempo de 15 min em vídeo de 5 min sem corte.
- **Gate:** ensaio ≥50 centavos; todos os G-M correspondentes evidenciados; setup reproduzível sem SQL remoto/cloud. Dependências externas devem estar configuradas antes da gravação, sem mapa/Stripe fake como substituto.
- **Git:** rever status/diff/segredos, Conventional Commits por unidade, preservar trabalho do usuário; push/PR/merge somente após autorização explícita válida. Relatar branch/hash/alterações restantes. Estar atrás do remoto não autoriza reescrever histórico.
- **DoD/G7:** checklist final do plano concluída **no escopo aprovado**, acceptance.md preenchido com execução real, nenhum teste falhando oculto, limitações conhecidas publicadas. Não marcar documentação como implementação.

## Entrega do executor

Listar unidades concluídas, arquitetura realmente executável, arquivos/migrations, comandos/resultados de testes, gates reais, limitações, passos de demonstração e estado Git. Não propor novo roadmap como condição de entrega. O núcleo pode estar finalizado com IV/bateria/helpdesk/cloud explicitamente indisponíveis.

## Transição obrigatória

Após U2/G7, atualizar [a ordem canônica](../SPRINT4_EXECUTION_ORDER.md) e somente então marcar `CG-F0-01` como `READY`. Evidências válidas de M5–M7 devem ser referenciadas pelo pacote novo, não repetidas sem alteração relacionada.
