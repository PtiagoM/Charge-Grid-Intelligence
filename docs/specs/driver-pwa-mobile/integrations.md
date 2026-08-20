# Configuração das integrações da Driver PWA

## Preparação

Copie `.env.example` para `.env` na raiz do monorepo e mantenha esse arquivo fora do Git. O Vite do Driver PWA lê o ambiente da raiz; a API carrega o mesmo arquivo no processo Node.

```dotenv
VITE_GOOGLE_MAPS_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_CHARGEGRID_API_URL=http://localhost:3333
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
CHARGEGRID_ALLOWED_ORIGINS=http://localhost:5174,http://127.0.0.1:5174
PORT=3333
```

## Google Maps

1. Crie ou selecione um projeto no Google Cloud.
2. Habilite Maps JavaScript API e faturamento para o projeto.
3. Crie uma chave de navegador e restrinja os HTTP referrers aos domínios do PWA.
4. Restrinja a chave à Maps JavaScript API.
5. Defina `VITE_GOOGLE_MAPS_API_KEY`.
6. Reinicie a aplicação e confirme no console do Google Cloud que as requisições pertencem à chave restrita. A Data Layer não exige Map ID adicional.

Reinicie o Vite após alterar qualquer variável `VITE_*`.

## Supabase Auth

1. Crie um projeto Supabase e habilite o provedor de e-mail/senha.
2. Cadastre as URLs de desenvolvimento e produção em Authentication → URL Configuration.
3. Defina a Site URL e os redirect URLs usados pelo PWA.
4. Copie a Project URL para `VITE_SUPABASE_URL`.
5. Copie a chave pública/anon para `VITE_SUPABASE_ANON_KEY`.
6. Decida se o ambiente exigirá confirmação de e-mail; a interface suporta os dois comportamentos.

A chave service role nunca deve ser adicionada ao PWA. Persistência de perfis em tabela própria e políticas RLS devem ser criadas antes de armazenar dados além de `user_metadata`.

## Stripe sandbox

1. Ative o modo de teste no Dashboard Stripe.
2. Habilite cartão e Pix nos métodos de pagamento disponíveis para a conta.
3. Defina a chave publicável `pk_test_...` em `VITE_STRIPE_PUBLISHABLE_KEY`.
4. Defina a chave secreta `sk_test_...` em `STRIPE_SECRET_KEY`.
5. Para desenvolvimento local, instale e autentique a Stripe CLI.
6. Encaminhe eventos para a API:

```bash
stripe listen --forward-to localhost:3333/payments/webhook
```

7. Copie o segredo `whsec_...` exibido pela CLI para `STRIPE_WEBHOOK_SECRET`.
8. Inicie novamente API e PWA.

Cartão de sucesso para teste: `4242 4242 4242 4242`, validade futura e qualquer CVC de três dígitos. Nunca use dados financeiros reais no sandbox.

### Modelo financeiro

- cartão: autoriza o limite com `capture_method=manual`; `POST /payments/:id/capture` captura o total da sessão;
- Pix: paga o limite antecipadamente; `POST /payments/:id/refund` devolve a diferença;
- metadata: `sessionId`, `establishmentId` e `chargerId` vinculam o pagamento à jornada;
- idempotência: a criação da intenção usa a sessão como chave;
- webhook: a assinatura é validada antes do processamento.

### Endpoints

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/payments/config` | informa se Stripe e webhook estão configurados |
| `POST` | `/payments/intents` | cria a intenção e retorna client secret |
| `GET` | `/payments/:paymentIntentId` | normaliza o estado atual |
| `POST` | `/payments/:paymentIntentId/capture` | captura o total do cartão |
| `POST` | `/payments/:paymentIntentId/refund` | devolve saldo do Pix |
| `POST` | `/payments/webhook` | recebe eventos assinados |

## Notificações e recursos PWA

- Localhost é aceito durante o desenvolvimento; produção requer HTTPS.
- A permissão de notificação é solicitada na central ou na conta, após gesto do motorista.
- Câmera e geolocalização possuem permissões independentes.
- Se uma permissão for negada permanentemente, ela precisa ser reativada nas configurações do navegador.
- O service worker está em `apps/driver-pwa/public/sw.js` e é atualizado pelo navegador quando o conteúdo muda.

## Execução e verificação

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

Endereços locais:

- Driver PWA: `http://localhost:5174`
- Admin Web: `http://localhost:5173`
- API: `http://localhost:3333`
- Saúde da API: `http://localhost:3333/health`
- Configuração Stripe: `http://localhost:3333/payments/config`
