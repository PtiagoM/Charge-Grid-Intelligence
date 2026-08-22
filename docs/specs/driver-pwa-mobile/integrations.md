# Integrações da Driver PWA

## Arquivo de ambiente

Copie `.env.example` para `.env` na raiz. O Vite e a API leem esse arquivo; ele é ignorado pelo Git.

```dotenv
VITE_GOOGLE_MAPS_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CHARGEGRID_API_URL=http://localhost:3333
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CHARGEGRID_ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
PORT=3333
```

Reinicie Vite/API após alterar o ambiente. Nunca coloque `sb_secret_...`, service role, `sk_test_...` ou `whsec_...` em variável `VITE_*`.

## Google Maps

1. Use um projeto Google Cloud próprio, não uma Demo Key temporária.
2. Habilite **Maps JavaScript API**.
3. Habilite faturamento e confira a cota do projeto.
4. Restrinja a chave por API e por HTTP referrer.
5. Em desenvolvimento, permita explicitamente `http://localhost:5173/*`, `http://localhost:5174/*`, `http://127.0.0.1:5173/*` e `http://127.0.0.1:5174/*` se essas origens forem usadas.
6. Adicione os domínios HTTPS de produção, incluindo `https://chargegrid-driver-pwa.vercel.app/*`.
7. Defina `VITE_GOOGLE_MAPS_API_KEY` e reinicie os dois Vites.
8. Na Vercel, atualize a mesma variável somente no projeto `chargegrid-driver-pwa` e faça novo deploy do PWA; o Vite incorpora `VITE_*` no bundle de build. A API não precisa de deploy para essa troca isolada.

Diagnóstico conhecido: `Maps Demo Key limit reached` significa cota da chave demo, não bug de React. O app trata a recusa sem flicker e mantém a lista, mas uma chave faturada com cota é necessária para o mapa real.

## Supabase Auth

Mapeamento das chaves atuais do Supabase:

| Dashboard/entrada | Variável do projeto | Exposição |
| --- | --- | --- |
| Project URL | `VITE_SUPABASE_URL` e `SUPABASE_URL` | pública |
| `sb_publishable_...` | `VITE_SUPABASE_ANON_KEY` | pública |
| `sb_secret_...` | `SUPABASE_SERVICE_ROLE_KEY` | somente servidor |
| JWKS URL | não usada atualmente | futura validação JWT na API |

Passos:

1. Habilite e-mail/senha em Authentication.
2. Configure Site URL e Redirect URLs de desenvolvimento/produção.
3. Decida se signup exige confirmação de e-mail.
4. Preencha URL e publishable key no PWA.
5. Mantenha a secret key apenas no servidor.

O PWA já usa Auth. Tabelas de `profiles`/`vehicles`, migrations, RLS e verificação JWT da API permanecem pendentes.

## Stripe em modo teste

1. Ative o modo de teste.
2. Habilite cartão e Pix para a conta/região de teste.
3. Configure `pk_test_...` no PWA e `sk_test_...` na API.
4. Instale a Stripe CLI e faça login no contexto de teste.
5. Inicie `npm run dev:api`.
6. Em outro terminal, execute:

```bash
stripe listen --events payment_intent.amount_capturable_updated,payment_intent.succeeded,payment_intent.payment_failed,payment_intent.canceled,refund.created,refund.updated,refund.failed --forward-to http://localhost:3333/payments/webhook
```

7. Copie o `whsec_...` exibido pela CLI para `STRIPE_WEBHOOK_SECRET` e reinicie a API.
8. Dispare eventos em outro terminal:

```bash
stripe trigger payment_intent.succeeded
stripe trigger payment_intent.payment_failed
```

O segredo do listener local não deve ser confundido com o segredo do endpoint criado no Dashboard. Use o segredo correspondente ao emissor que está sendo testado.

### Produção na Vercel

- PWA: `https://chargegrid-driver-pwa.vercel.app`
- API: `https://chargegrid-api.vercel.app`
- Webhook Stripe de teste: `https://chargegrid-api.vercel.app/payments/webhook`

As variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY` e `VITE_CHARGEGRID_API_URL` pertencem ao projeto do PWA. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `CHARGEGRID_ALLOWED_ORIGINS` pertencem apenas ao projeto da API. Atualizar uma variável requer redeploy somente do projeto que a consome.

Eventos acompanhados pelo código atual:

- `payment_intent.amount_capturable_updated`
- `payment_intent.succeeded`
- `payment_intent.payment_failed`
- `payment_intent.canceled`
- `refund.created`
- `refund.updated`
- `refund.failed`

`checkout.session.completed` e eventos de subscription não são usados porque o produto atual cria PaymentIntents diretamente.

### Endpoints

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/payments/config` | provider, modo e configuração |
| `POST` | `/payments/intents` | criar PaymentIntent |
| `GET` | `/payments/:paymentIntentId` | consultar estado |
| `POST` | `/payments/:paymentIntentId/capture` | capturar cartão |
| `POST` | `/payments/:paymentIntentId/refund` | reembolsar Pix |
| `POST` | `/payments/webhook` | validar e receber eventos |

Cartão de teste: `4242 4242 4242 4242`, validade futura e CVC de três dígitos. Nunca use dados financeiros reais no sandbox.

## PWA e permissões

- Localhost é aceito em desenvolvimento; produção exige HTTPS.
- Para testar o PWA em outro aparelho na mesma rede, inicie PWA e API, acesse o IP LAN do computador na porta `5174` e confirme que o firewall permite a porta `3333`. Quando `VITE_CHARGEGRID_API_URL` estiver em `localhost:3333`, o PWA substitui somente em desenvolvimento esse host pelo IP usado no celular. A API aceita essa origem IPv4 privada apenas fora de produção.
- Câmera, localização e notificações têm permissões independentes.
- Notificações locais usam `apps/driver-pwa/public/sw.js`.
- Push remoto exige Web Push/FCM e não faz parte da implementação atual.

## Verificação

```bash
npm run dev
npm run lint
npm run test
npm run build
```

- Driver PWA: `http://localhost:5174`
- Admin Web: `http://localhost:5173`
- API: `http://localhost:3333`
- Health: `http://localhost:3333/health`
- Stripe config: `http://localhost:3333/payments/config`
