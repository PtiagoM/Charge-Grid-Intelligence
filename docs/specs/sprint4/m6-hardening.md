# M6 — Estabilidade proporcional ao protótipo

**Atualização 30/09/2026:** S4-M6-U1 concluída. Polls de sessão/fila/catálogo/histórico e projeção Admin agora aguardam cada resposta, podem ser abortados e não sobrescrevem leituras com respostas concorrentes. Falha da API preserva a última leitura e a identifica como desatualizada; ações continuam dependentes da API. O SW v6 remove caches antigos, não intercepta `/api/commercial`, `/api/payments` ou suas rotas sem `/api`, e solicita reload das abas na ativação quando substitui uma versão anterior. Typecheck, builds dos frontends, 79 testes Admin, E02, smoke E2E com SW ativo e teste E2E de API indisponível→stale→recuperada passaram. Sem alteração de API e sem reexecução de E05.

**Estado:** S4-M6-U1 concluída; S4-M6-U2 implementada aguardando G6 manual. Após G6, próxima unidade elegível: S4-M7-U1. Objetivo do marco: corrigir somente falhas demonstradas de coerência/persistência/UX da baseline S4-C1. MÉDIO. Não inventar suite enterprise. Ler C4–C7/C9, achados concretos de M5 e a [ordem canônica](../SPRINT4_EXECUTION_ORDER.md).

**Atualização 30/09/2026:** implementação de U2 concluída; G6 aguarda validação manual do responsável. O próximo passo permanece no [registro canônico](../SPRINT4_EXECUTION_ORDER.md).

## S4-M6-U1 — Retomada, polling e SW

- **Arquivos:** PWA public/sw.js, DriverAppContext, services HTTP; Admin commercialSnapshotRepository/AdminState; API clock/server apenas se bug comum identificado.
- **Implementar:** SW update/reload sem servir contrato antigo contra API nova; dados comerciais network-only; logout/conta nova invalida requests/caches; polling abortável a cada 2 s sem intervalos acumulados; erro/stale indicado, nenhuma fixture de disponibilidade. Uma requisição lenta anterior não substitui snapshot recente.
- **Restart:** um processo por PGlite, erro claro se storage indisponível; shutdown fecha repository/timer; startup retoma pendências conforme C6. Runtime oficial com bind local; configuração LAN/cloud não obrigatória nem insegura por padrão.
- **Aceite:** GIVEN duas abas WHEN stop simultâneo THENuma operação e ambas convergem; GIVEN versão SW antiga WHEN atualiza THENmesmo contrato; GIVEN API cai THENúltima leitura identificada, nenhum Start local; WHEN volta THENestado recupera.
- **Testes:** E02/E05 focais + teste real service worker habilitado (configE2E anterior bloqueava SW); reload com pagamento pendente/idle/fila. Não testar offline avançado/sync queue.
- **DoD:** corrigidos somente bugs observados, documentação de retomada atualizada; V-GLOBAL no checkpoint de integração. Commit `fix(integration): stabilize polling persistence and cache recovery`.

## S4-M6-U2 — Falhas essenciais e usabilidade final

- **Arquivos:** apenas handlers/componentes atingidos pelos achados; CSS funcional. Sem redesign.
- **Implementar:** próximo passo para falha de início/equipamento/liquidação pendente, botões idempotentes/loading, datas com timezone, arredondamento C6, foco/labels/teclado, overflow em 320/390/1440 px. Estados sem suporte desabilitados/conceituais. Não corrigir microcaptura excluída.
- **Aceite:** GIVEN teclado/touch WHEN completa jornada THENCTA essencial alcançável; GIVEN falha recuperável THENnão precisa apagar storage/reiniciar demo; GIVEN pendência THENnão declara pago/available indevidamente.
- **Testes:** errosHTTP400/401/404/409/502/503 relevantes, Auth expirado, network retry, falhaProvider, E01–E06 regressão; inspeção visual desktop/mobile claro/escuro onde já disponível. Leitor de tela básico labels/foco, sem auditoria de conformidade extensa.
- **DoD/G6:** nenhuma falha crítica no escopo aprovado; limitações externas ou <R$0,50 explícitas; V-GLOBAL/V-E2E verdes, manual gates reexecutados após correções que os afetem. Commit `fix(ui): close demonstration-blocking recovery and accessibility gaps`.

### Evidência de execução U2

- `CheckoutPage.tsx`: confirmação Stripe tratada com `try/finally`, consulta de status sequencial (sem requests sobrepostas) e retry de vinculação quando Stripe já confirmou mas a API falha; não oferece trocar o pagamento depois que a autorização foi observada.
- `SessionPage.tsx`: “Encerrar recarga” fica desabilitado e indica progresso enquanto Stop aguarda a API; falha libera nova tentativa sem alterar localmente a sessão.
- `rtk npm run typecheck`: passou; `rtk npx eslint apps/driver-pwa/src/pages/CheckoutPage.tsx apps/driver-pwa/src/pages/SessionPage.tsx`: passou; `rtk npm run build --workspace @chargegrid/driver-pwa`: passou; `rtk npm run test:e2e:sprint4 -- --grep "E01/E02"`: 1 passou.
- E2E não executado sem autorização de loopback foi interrompido após inicialização sem saída; repetição autorizada subiu os servidores isolados e passou. Não foi feita captura real Stripe nem validação manual após estas mudanças. Datas/fuso e arredondamento C6 não foram alterados: não foi encontrada divergência neste recorte; limite de captura <R$0,50 permanece fora de escopo.
- **Gate manual restante:** em uma sessão de teste, provocar falha de rede durante confirmação/vínculo e confirmar que a tela permite tentar o vínculo novamente sem criar outra sessão; durante uma sessão CHARGING, clicar em “Encerrar recarga” e confirmar progresso/bloqueio de cliques repetidos e atualização pelo backend. Em seguida confirmar que falha do Stop permite nova tentativa. Não repetir o percurso completo Maps/Stripe/hardware.

Não incluir IAM, grants, observabilidade cloud, HA, microserviços, offline avançado ou otimização de bundle sem problema real. Warning isolado de chunk não bloqueia entrega.
