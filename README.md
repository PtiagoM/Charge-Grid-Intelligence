# ChargeGrid Intelligence

## O produto em uma frase

O ChargeGrid Intelligence é a camada comercial e operacional de recarga do ecossistema GoodWe: transforma infraestrutura instalada em uma experiência gerenciável, sustentável e monetizável.

Esta main contém somente a fundação técnica do MVP. As jornadas de produto serão implementadas em branches próprias, orientadas por specs.

## Arquitetura resumida

- **Admin Web:** React, TypeScript, Vite e React Router; aplicação desktop-first para GoodWe e estabelecimentos.
- **Driver PWA:** React, TypeScript, Vite e React Router; aplicação mobile-first preparada para instalação e acesso por QR.
- **ChargeGrid API:** Node.js, TypeScript, Express e REST/JSON; concentra regras críticas.
- **Supabase:** futuro PostgreSQL, Auth e RLS; ainda sem projeto ou schema real nesta baseline.
- **GoodWe Adapter:** contrato `GoodWeProvider` e implementação `MockGoodWeProvider` baseada no cenário D0.
- **Payment Adapter:** contrato `PaymentProvider` e implementação simulada, sem gateway real.
- **AI API:** futuro serviço externo Python/FastAPI; apenas fronteira documental nesta baseline.

## Estrutura do monorepo

```text
apps/
  admin-web/        # shell administrativo e prova de leitura de D0
  driver-pwa/       # shell mobile/PWA e prova de leitura de D0
  api/              # Express, /health e fronteiras de providers
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

A baseline valida os enums essenciais, os seis carregadores e o balanço energético de D0, além do endpoint `/health` via Supertest.

## Lint

```bash
npm run lint
```

## Variáveis de ambiente

Consulte `.env.example`. As chaves `VITE_*` são públicas no bundle do navegador; `SUPABASE_SERVICE_ROLE_KEY` é exclusivamente de servidor. Nenhuma credencial é necessária para executar o cenário D0.

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
- Pagamento, Pix, autorização, captura e devolução são simulados; nenhum gateway foi escolhido.
- A IA será integrada posteriormente e nunca deve bloquear a operação determinística.
- D0–D15 são dados/cenários de demonstração, não telemetria, cobranças ou pessoas reais.

Não estão implementados nesta baseline: login, Supabase Auth/RLS, dashboard completo, mapa, QR, checkout, sessão executável, fila, tarifação, relatórios, IA, OpenAPI real, notificações ou Demo Controller.
