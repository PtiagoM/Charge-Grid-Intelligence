# Design System ChargeGrid Intelligence

Este diretório define a identidade SEMS+/GoodWe aplicada em densidades diferentes:

- Admin Web: tema grafite escuro e alta densidade.
- Driver PWA: tema claro por padrão, predominância branca, vermelho GoodWe e composição mobile; tema escuro opcional.

O tema claro mobile é uma decisão posterior de produto e prevalece sobre frases antigas que tratavam o grafite como padrão universal.

## Documentos normativos

1. [`ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_v2.0.md`](./ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_v2.0.md) — fundação compartilhada e Admin Web.
2. [`ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_Mobile_v2.0.md`](./ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_Mobile_v2.0.md) — regra vigente da Driver PWA.
3. [`ChargeGrid_Intelligence_Guia_de_Consistencia_Visual_v1.0.md`](./ChargeGrid_Intelligence_Guia_de_Consistencia_Visual_v1.0.md) — invariantes de marca, semântica e acessibilidade.
4. [`ChargeGrid_Intelligence_Catalogo_de_Assets_SEMS_v1.0.md`](./ChargeGrid_Intelligence_Catalogo_de_Assets_SEMS_v1.0.md) — assets aprovados.

## Implementação de referência

- Tokens: `packages/shared/src/styles/tokens.css`.
- Admin: `apps/admin-web/src/styles/app.css`.
- Driver PWA: `apps/driver-pwa/src/styles/app.css`.
- Assets: `apps/admin-web/public/assets/sems/` e `apps/driver-pwa/public/assets/sems/`.

Leia também `docs/CURRENT_STATE.md`. Se documentação e implementação divergirem, registre a decisão e corrija ambas; não crie uma terceira linguagem local.

