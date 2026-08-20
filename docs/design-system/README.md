# Design System ChargeGrid Intelligence

Este diretório é a fonte de verdade visual do ChargeGrid. A identidade adotada é a interface SEMS+/GoodWe em tema escuro validada no protótipo administrativo e portada para o monorepo.

Os documentos extraídos v1 foram aposentados. Somente o conjunto normativo abaixo deve ser usado em novas specs, componentes ou telas.

## Documentos normativos

1. [`ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_v2.0.md`](./ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_v2.0.md) — fundação visual compartilhada e padrões do Admin Web.
2. [`ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_Mobile_v2.0.md`](./ChargeGrid_Intelligence_Design_System_SEMS_ChargeGrid_Mobile_v2.0.md) — tradução mobile-first para a Driver PWA.
3. [`ChargeGrid_Intelligence_Guia_de_Consistencia_Visual_v1.0.md`](./ChargeGrid_Intelligence_Guia_de_Consistencia_Visual_v1.0.md) — invariantes entre Admin, PWA, specs e futuras interfaces.
4. [`ChargeGrid_Intelligence_Catalogo_de_Assets_SEMS_v1.0.md`](./ChargeGrid_Intelligence_Catalogo_de_Assets_SEMS_v1.0.md) — inventário e regras de reutilização dos assets aprovados.

## Ordem de aplicação

Produto → Arquitetura → Contratos → Demo → Design System v2 → Spec da feature → Código.

O Design System define aparência, composição, comportamento visual e acessibilidade. Ele não cria ator, permissão, estado de negócio, integração ou fluxo.

## Implementação de referência

- Tokens compartilhados: `packages/shared/src/styles/tokens.css`.
- Implementação visual homologada: `apps/admin-web/src/styles/app.css`.
- Assets SEMS+ aprovados no repositório: `apps/admin-web/public/assets/sems/`.
- Mapeamento tipado de assets: `apps/admin-web/src/constants/assets.ts`.

Se documento e implementação divergirem, a divergência deve ser corrigida explicitamente. Não se deve criar uma terceira linguagem visual local.
