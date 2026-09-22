# ChargeGrid Intelligence

Protótipo funcional da Sprint 3 que integra a jornada do motorista à operação comercial de recarga incorporada ao Admin SEMS+.

O motorista descobre o Hub Solar Aurora, escolhe ou identifica um carregador, autoriza um pagamento Stripe em modo de teste e acompanha a recarga. A API mantém uma única sessão comercial persistida; Operação, Sessões, Fila e Resumo financeiro do Admin observam os mesmos registros. Somente a fronteira física GoodWe/HCA G2 é simulada.

> Leia primeiro [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md). O recorte executável, as evidências e o roteiro da Sprint estão em [`docs/SPRINT3.md`](docs/SPRINT3.md).

## Arquitetura executável

```mermaid
flowchart LR
    Maps[Google Maps JS] --> PWA[Driver PWA]
    Auth[Supabase Auth] --> PWA
    PWA --> Stripe[Stripe sandbox]
    PWA --> API[ChargeGrid API]
    Stripe --> API
    Admin[Admin SEMS+ / ChargeGrid] --> API
    Lab[Laboratório de hardware] --> API
    API --> DB[(PostgreSQL local via PGlite)]
    API --> Provider[MockGoodWeProvider]
    DB --> API
    API --> PWA
    API --> Admin
```

- PWA e Admin são interfaces distintas sobre a mesma API e os mesmos registros.
- Polling de aproximadamente dois segundos apenas consulta; energia e custo avançam no relógio da API.
- O laboratório `/admin` emite eventos físicos sobre os carregadores persistidos. Ele não cria pagamento, receita ou sessão fictícia.
- As migrations são PostgreSQL/Supabase compatíveis. Neste ambiente, a autoridade executável é PGlite persistente em `.local/commercial-db` porque a aplicação remota das migrations está bloqueada por falta de autenticação da Supabase CLI.

## O que funciona

- catálogo compartilhado do Hub Solar Aurora e carregadores `AURORA-01` a `AURORA-06`;
- descoberta normal pela PWA, detalhe do local, QR e código operacional manual;
- Payment Element e PaymentIntent reais no Stripe test, com captura manual de cartão ao encerrar;
- uma sessão persistida e compartilhada entre PWA, API e Admin;
- ciclo físico `AVAILABLE → CONNECTED → CHARGING → AVAILABLE`;
- energia coerente (`potência × tempo`), custo pela tarifa congelada e teto financeiro;
- Admin ChargeGrid em Operação, Sessões, Fila e Resumo financeiro;
- fila persistida, uma entrada ativa por motorista, chamada FIFO por estabelecimento e atribuição temporária de dez minutos;
- atualização automática e recuperação após reload/reinício da API;
- estados de falha/offline e recuperação emitidos pelo laboratório GoodWe simulado.

## Integrações e limites

| Camada | Classificação | Estado |
| --- | --- | --- |
| Driver PWA, Admin e API | Real no protótipo | React/Vite + Express, integrados pelo contrato compartilhado |
| Stripe | Real em sandbox | PaymentIntent, Payment Element, autorização e captura de cartão validados |
| Supabase Auth | Real quando configurado | Cadastro/login da PWA; fallback local somente para desenvolvimento |
| Google Maps | Real quando configurado | Fluxo e SDK preservados; exige `VITE_GOOGLE_MAPS_API_KEY` válida |
| Banco comercial | Real local | PostgreSQL compatível via PGlite persistente; não usa JSON |
| Supabase PostgreSQL remoto | Preparado, não aplicado | Migrations prontas; falta login/token da CLI no ambiente atual |
| GoodWe/HCA G2 | Simulado | Laboratório e `MockGoodWeProvider` substituem somente hardware/telemetria |
| Stripe live, GoodWe OpenAPI e HCA G2 físico | Conceitual | Fora do escopo e não apresentados como produtivos |

## Estrutura

```text
apps/
  admin-web/       Admin SEMS+ com superfícies ChargeGrid e laboratório físico
  driver-pwa/      jornada mobile normal do motorista
  api/             pagamentos, sessões, fila, telemetria e persistência
packages/shared/   enums e contratos compartilhados
supabase/migrations/
  202609220001_commercial_core.sql
  202609220002_hardware_lifecycle.sql
  202609220003_commercial_queue.sql
docs/
  CURRENT_STATE.md
  SPRINT3.md
```

## Pré-requisitos

- Node.js 20 ou superior;
- npm 10 ou superior;
- chaves Stripe de teste para pagamento real em sandbox;
- chave Google Maps JavaScript API para exibir o mapa real;
- projeto Supabase para Auth, se o login remoto da PWA for demonstrado.

## Configuração

```bash
npm install
cp .env.example .env
```

Preencha localmente, sem versionar segredos:

- `VITE_CHARGEGRID_API_URL=http://localhost:3333`
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` quando webhooks forem exercitados
- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para Auth remoto
- `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente no servidor, quando necessários

## Execução

```bash
npm run dev
```

- Admin: `http://localhost:5173`
- Driver PWA: `http://localhost:5174`
- API/health: `http://localhost:3333/health`

Processos também podem ser iniciados separadamente com `npm run dev:admin`, `npm run dev:pwa` e `npm run dev:api`.

Contas demonstrativas do Admin:

- estabelecimento Aurora: `aurora@teste.com` / `teste`;
- Central GoodWe: `goodwe@teste.com` / `teste`.

Na PWA, crie uma conta de motorista ou use uma conta Supabase Auth já cadastrada. O cartão Stripe de teste recomendado é `4242 4242 4242 4242`, com validade futura e CVC de três dígitos.

## Jornada principal

1. Abra o Admin com a conta Aurora em ChargeGrid → Operação.
2. Abra a PWA, use o mapa/detalhe do Hub Solar Aurora e escolha `AURORA-01`.
3. Aceite as condições e autorize o limite pelo Payment Element Stripe.
4. Confirme no Admin o mesmo carregador em espera e a mesma sessão.
5. No Admin, abra **Laboratório de hardware**, conecte o veículo e inicie energia.
6. Observe PWA, Operação e Sessões atualizarem automaticamente energia, potência e custo.
7. Encerre na PWA e confirme sessão concluída e pagamento capturado no Resumo financeiro.

A jornada de fila e o roteiro cronometrado de até cinco minutos estão em [`docs/SPRINT3.md`](docs/SPRINT3.md).

## Qualidade

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e:sprint3
```

`npm run test:e2e` mantém a regressão ampla do Admin. O E2E Sprint 3 protege QR/código, falha física, fila PWA ↔ API ↔ Admin, polling e reload. A confirmação Stripe real foi validada manualmente porque depende do sandbox externo.

## Limitações conhecidas

- sem chave Google Maps válida, a PWA usa seu fallback e o mapa real não pode ser gravado;
- as migrations remotas ainda precisam ser aplicadas a um Supabase autenticado; o fallback local persiste entre reload e reinício;
- Pix autoriza no Stripe test, mas o encerramento persistido após reembolso ainda não possui a mesma validação ponta a ponta do cartão;
- não há GoodWe OpenAPI, HCA G2 físico, Stripe live, push remoto, RLS/IAM corporativo completo ou operação multi-instância;
- o build do Admin mantém um aviso não bloqueante de chunk acima de 500 kB.

## Relação com energia e automação

O protótipo relaciona operação comercial e eficiência energética sem inventar integração física: a telemetria simulada define conexão, potência, falha e entrega; a API transforma potência e tempo em energia, deriva o custo pela tarifa aceita e mantém o teto autorizado. Essa fronteira permite substituir o mock por GoodWe real futuramente sem duplicar regras na PWA ou no Admin.
