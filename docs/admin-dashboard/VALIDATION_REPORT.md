# Relatório de validação do Dashboard Admin — M9

**Data:** 23 de agosto de 2026  
**Branch:** `chore/admin-release-hardening`  
**Escopo:** fechamento local dos marcos M0–M9, sem alterações no Driver PWA e sem integração na `main`.

## Resultado

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

## Decisão sobre a regressão integral

A execução integral local foi interrompida por decisão explícita do produto. O dashboard terá alterações amplas de visual, fluxos e telas nos próximos passos; manter agora uma bateria visual extensa e snapshots de uma interface transitória geraria custo sem proteger a versão futura. A suíte de domínio permanece preservada e a regressão visual integral deve ser criada somente após aprovação explícita da direção visual, conforme `TESTING_STRATEGY.md`.

## Pendências deliberadas

- integração com providers GoodWe, Stripe, armazenamento de relatórios e notificações reais;
- autorização backend, RLS e provisionamento de identidade;
- tema claro, que ainda não faz parte da interface executável;
- avaliação de performance com dados de produção e rede real;
- nova matriz visual completa e snapshots após o próximo redesenho;
- validação humana antes de qualquer Pull Request chegar à `main`.
