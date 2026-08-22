# ChargeGrid Intelligence

O ChargeGrid Intelligence é a camada comercial e operacional de recarga incorporada à experiência do SEMS+. Este monorepo reúne a implementação administrativa anterior, a Driver PWA mobile, a ChargeGrid API e contratos compartilhados; a próxima etapa reconstruirá o Dashboard em um novo projeto como módulo do SEMS+.

> Comece por [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md). Ele é a fonte única de verdade do projeto e consolida contexto GoodWe, produto, negócio, operação, histórico, decisões vigentes, implementação, integrações e limitações.

## Superfícies

- **Admin Web atual:** implementação anterior usada como referência de regras e conteúdo; deixou de ser a arquitetura administrativa final após a decisão de incorporar o ChargeGrid ao SEMS+.
- **Driver PWA:** React, TypeScript e Vite; app mobile para visitante e motorista cadastrado, com QR, Google Maps, Supabase Auth, Stripe sandbox, fila, sessão, histórico e notificações.
- **ChargeGrid API:** Node.js, Express e TypeScript; gateway Stripe e fronteira para regras críticas.
- **Shared:** enums, contratos, tokens visuais e fixtures D0.

O plano da reconstrução está em [`docs/sems-reconstruction/`](docs/sems-reconstruction/). A Driver PWA não faz parte desse escopo e não deve ser alterada.

## Estrutura

```text
apps/
  admin-web/
  driver-pwa/
  api/
packages/
  shared/
supabase/
  migrations/
  seed/
docs/
  CURRENT_STATE.md
  product/ architecture/ contracts/ demo/ design-system/ pitch/ specs/
```

## Pré-requisitos

- Node.js 20 ou superior.
- npm 10 ou superior.
- Credenciais externas somente para as integrações que serão exercitadas.

## Instalação e execução

```bash
npm install
npm run dev
```

Processos separados:

```bash
npm run dev:admin  # http://localhost:5173
npm run dev:pwa    # http://localhost:5174
npm run dev:api    # http://localhost:3333
```

A API expõe `GET /health` e o módulo financeiro em `/payments`.

## Qualidade

```bash
npm run lint
npm run test
npm run build
```

## Configuração

Copie `.env.example` para `.env` na raiz e preencha somente localmente. Variáveis `VITE_*` entram no bundle do navegador e nunca podem receber chaves secretas.

O procedimento completo está em [`docs/specs/driver-pwa-mobile/integrations.md`](docs/specs/driver-pwa-mobile/integrations.md).

## Estado das integrações

- **Google Maps:** SDK real no Admin e na Driver PWA. Exige chave de produção com API, faturamento, cota e referrers corretos. A chave demo usada durante a implementação atingiu sua cota.
- **Supabase:** Auth real no PWA quando configurado. Tabelas comerciais, migrations e RLS ainda não estão implementados.
- **Stripe:** PaymentIntents reais em modo teste, Payment Element, captura manual de cartão, Pix, reembolso e assinatura de webhook. Live permanece bloqueado.
- **GoodWe:** contrato e provider de referência; OpenAPI/HCA G2 reais ainda dependem de credenciais e homologação.
- **Notificações:** notificações locais do navegador/service worker; push remoto ainda não existe.

## Hierarquia documental

1. Decisão explícita posterior do produto.
2. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md).
3. Specs implementadas em `docs/specs/`.
4. Produto, Arquitetura, Contratos, Demo e Design System.
5. Código e testes devem refletir essa hierarquia; divergências precisam ser documentadas e corrigidas.

Fixtures e cenários de referência devem continuar identificados na documentação e nos testes. A interface final não deve exibir avisos de “dados simulados” ao usuário.
