# Sprint 3 — Prototipagem Funcional e Integração

Atualizado em 16/09/2026. Registro vigente da entrega; complementa `CURRENT_STATE.md`.

## Auditoria de partida

- Base limpa: `develop/admin-web`, commit `c8cc21c`, PR #16 integrada. Referências remotas atualizadas por fetch.
- Branch de trabalho: `feature/admin-sprint3-integration`, derivada exatamente dessa base. Escopo transversal solicitado: Admin, PWA, API e contratos compartilhados.
- Admin: React/TypeScript nativo, comandos, sessões, fila, permissões demonstrativas, financeiro e relatórios. Persistência e adapters operacionais exclusivamente locais.
- PWA: QR, catálogo, mapa, identidade local/Supabase, Stripe sandbox, sessões/fila/comprovantes locais. Não compartilha sessões com o Admin.
- API: Express/TypeScript, saúde e pagamentos Stripe sandbox; GoodWe é um adapter não conectado. Não há tabelas comerciais ou RLS Supabase implementadas.
- Lacunas verificadas: simulador Admin alterava somente badge; métricas gráficas eram fixtures; PWA perdia recuperação de pagamento e sessão em alguns fluxos; ausência de testes de integração entre os dois produtos.
- Validação de partida: `npm run lint`, `npm test` (88 testes) e `npm run build` aprovados. Aviso de chunk Admin acima de 500 kB, sem erro de build.
- GitHub CLI sem autenticação. Não impede trabalho/commits locais; publicação e merge não fazem parte desta execução.

## Decisão de escopo

A prioridade vigente é demonstrar uma sessão compartilhada por API, desktop e mobile, com simulação explícita e reproduzível quando não existe hardware ou serviço externo disponível. Não reconstruir novamente a interface SEMS+, não afirmar homologação GoodWe e não misturar uma autorização financeira simulada com PaymentIntents Stripe reais em teste.

Os estados implementados e os resultados de validação serão registrados aqui a cada unidade concluída. As listas visuais F0–F7 anteriores continuam referências de evolução do produto, não a definição de pronto da Sprint 3.
