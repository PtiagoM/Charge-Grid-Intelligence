# ChargeGrid Intelligence

## O produto em uma frase

O ChargeGrid Intelligence é a camada comercial e operacional de recarga do ecossistema GoodWe: transforma infraestrutura instalada em uma experiência gerenciável, sustentável e monetizável.

O monorepo contém a fundação do MVP e as jornadas mobile da Driver PWA, desenvolvidas em branches orientadas por especificações.

## Arquitetura resumida

- **Admin Web:** React, TypeScript, Vite e React Router; aplicação desktop-first para GoodWe e estabelecimentos.
- **Driver PWA:** React, TypeScript, Vite e React Router; aplicação mobile-first preparada para instalação e acesso por QR.
- **ChargeGrid API:** Node.js, TypeScript, Express e REST/JSON; concentra regras críticas.
- **Supabase:** integração condicional de Auth no Driver PWA; PostgreSQL e RLS continuam dependentes de um projeto externo configurado.
- **GoodWe Adapter:** contrato `GoodWeProvider` e implementação `MockGoodWeProvider` baseada no cenário D0.
- **Payments:** Stripe PaymentIntents em sandbox, com Payment Element no PWA, captura manual de cartão, Pix, reembolso e webhook assinado na API.
- **AI API:** futuro serviço externo Python/FastAPI; apenas fronteira documental nesta baseline.

## Estrutura do monorepo

```text
apps/
  admin-web/        # shell administrativo e prova de leitura de D0
  driver-pwa/       # PWA mobile para visitante e motorista cadastrado
  api/              # Express, /health, providers e gateway Stripe sandbox
packages/
  shared/           # enums, contratos, tokens e cenário oficial D0
supabase/
  migrations/       # reservado para schema/RLS definidos por specs
  seed/             # reservado para seeds persistentes
docs/
  product/ architecture/ contracts/ demo/ design-system/ pitch/
  specs/            # processo e templates de especificação
```

## Pré-requisitos

- Node.js 20 ou superior (LTS recomendado para desenvolvimento do projeto).
- npm 10 ou superior.

## Instalação

```bash
npm install
```

Copie `.env.example` para o arquivo local adequado somente quando uma feature exigir configuração. Nunca versione segredos.

## Desenvolvimento

Inicie os três processos juntos:

```bash
npm run dev
```

Ou inicie cada superfície separadamente:

```bash
npm run dev:admin  # http://localhost:5173
npm run dev:pwa    # http://localhost:5174
npm run dev:api    # http://localhost:3333
```

A API expõe `GET /health` com `{ "status": "ok", "service": "chargegrid-api" }`.

## Build

```bash
npm run build
```

O pacote `@chargegrid/shared` é compilado primeiro; os três apps consomem a mesma saída tipada.

## Testes

```bash
npm run test
```

A suíte valida os enums essenciais, os carregadores, o balanço energético, a saúde da API e as fronteiras do gateway de pagamento, incluindo entrada inválida e assinatura do webhook.

## Lint

```bash
npm run lint
```

## Variáveis de ambiente

Consulte `.env.example` e o [guia de integrações](docs/specs/driver-pwa-mobile/integrations.md). As chaves `VITE_*` são públicas no bundle do navegador; segredos Stripe e `SUPABASE_SERVICE_ROLE_KEY` são exclusivamente de servidor. Google Maps, Supabase Auth e pagamentos externos exigem credenciais dos respectivos provedores.

## Hierarquia documental

```text
Produto
  ↓
Arquitetura
  ↓
Contratos
  ↓
Demo
  ↓
Design System
  ↓
Spec
  ↓
Código
```

Uma camada inferior não pode alterar silenciosamente uma decisão superior. Os documentos oficiais preservados em `docs/` são as fontes de verdade.

O diretório `docs/design-system/` contém o Design System SEMS+/GoodWe v2, sua aplicação mobile, o guia de consistência visual e o catálogo de assets. A Driver PWA aplica a identidade SEMS+/GoodWe em tema claro por padrão e mantém o tema escuro opcional.

## Processo de desenvolvimento

1. Escolher uma feature candidata em `docs/specs/README.md`.
2. Criar uma branch pequena e focada.
3. Copiar e preencher o template de spec.
4. Validar a spec contra os documentos superiores.
5. Implementar sem mover regras críticas para o frontend.
6. Criar testes proporcionais ao risco.
7. Abrir PR pequeno e explicável.
8. Revisar contratos, estados, demo e impactos cruzados.
9. Fazer merge após os checks.

## Regra real x simulado

- O acesso real à OpenAPI GoodWe ainda depende de credenciais, permissões, homologação e validação no HCA G2.
- O MVP usa `MockGoodWeProvider` coerente com a documentação; seus valores são sintéticos.
- A Driver PWA integra Stripe em modo de teste; cobrança live permanece bloqueada até revisão operacional e credenciais próprias.
- A IA será integrada posteriormente e nunca deve bloquear a operação determinística.
- D0–D15 são dados/cenários de demonstração, não telemetria, cobranças ou pessoas reais.

O Driver PWA usa Supabase Auth quando configurado e oferece entrada pública por QR, Google Maps real, checkout Stripe sandbox, fila, sessão, histórico e notificações do navegador. A integração física GoodWe, cobrança live, banco de perfis com RLS e IA externa continuam condicionados às credenciais, contratos e homologações correspondentes.
