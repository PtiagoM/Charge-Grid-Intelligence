# Decisões vigentes da Driver PWA

## DPR-001 — Tema claro como padrão

- **Data:** 2026-08-20
- **Decisão:** superfícies predominantemente brancas, vermelho GoodWe e tokens compartilhados com Admin/SEMS+.
- **Impacto:** escuro é opcional e persistido; nunca volta a ser o padrão sem nova decisão de produto.

## DPR-002 — Google Maps real e obrigatório

- **Data:** 2026-08-20
- **Decisão:** Maps JavaScript API com Data Layer; nenhum mapa fictício ou Map ID demonstrativo.
- **Impacto:** falha externa mantém a lista, mas não desenha geografia falsa.

## DPR-003 — Stripe como gateway real em modo teste

- **Data:** 2026-08-20
- **Decisão:** PaymentIntents e Payment Element substituem qualquer premissa anterior de gateway mock.
- **Impacto:** cartão reserva/captura e Pix paga/reembolsa; a API bloqueia `sk_live_`.

## DPR-004 — Operações financeiras no servidor

- **Data:** 2026-08-20
- **Decisão:** criar, consultar, capturar, reembolsar e verificar webhook em `apps/api`.
- **Impacto:** o PWA conhece somente chave publicável, client secret e estados normalizados.

## DPR-005 — Supabase Auth com fallback local de desenvolvimento

- **Data:** 2026-08-20
- **Decisão:** Supabase é a identidade remota quando configurado; fallback local serve apenas a desenvolvimento isolado.
- **Impacto:** produção não pode tratar `localStorage` como identidade, banco ou autorização.

## DPR-006 — QR por câmera, imagem e código

- **Data:** 2026-08-20
- **Decisão:** ZXing é carregado sob demanda e sempre há alternativa sem câmera.
- **Impacto:** permissão negada não bloqueia a jornada.

## DPR-007 — Notificações pelo service worker

- **Data:** 2026-08-20
- **Decisão:** notificações locais usam o registro do service worker e rotas associadas.
- **Impacto:** permissão é opcional; push remoto é uma feature separada.

## DPR-008 — Catálogo comercial inicial com seis plantas

- **Data:** 2026-08-20
- **Decisão:** catálogo versionado exercita mapa, busca, detalhe, fila e checkout.
- **Impacto:** futura API deve preservar o contrato, não necessariamente a origem local dos dados.

## DPR-009 — Não expor rótulos de fixture na experiência

- **Data:** 2026-08-20
- **Decisão:** textos como “dados simulados” não aparecem nas telas finais.
- **Impacto:** maturidade e origem continuam rigorosamente documentadas e testadas.

## DPR-010 — Mapa pronto somente após tiles reais

- **Data:** 2026-08-21
- **Decisão:** o canvas só recebe estado pronto após `tilesloaded`; falhas de provider têm estado separado e retry limpo.
- **Motivo:** a Demo Key desenhava o mapa por um instante antes de informar cota esgotada.
- **Impacto:** sem flicker, sem scripts duplicados e sem reconstrução por mera seleção de marcador.

## DPR-011 — Documento de estado prevalece sobre premissas históricas

- **Data:** 2026-08-21
- **Decisão:** `docs/CURRENT_STATE.md` é a entrada canônica para continuidade.
- **Impacto:** trechos antigos servem ao domínio, mas não podem reverter mapa real, Stripe sandbox, Supabase Auth, tema claro ou fluxos visitante/cadastrado.

