# ChargeGrid Intelligence — estado atual e guia de continuidade

**Atualizado em:** 21 de agosto de 2026  
**Branch de referência:** `codex/driver-pwa-mobile`  
**Escopo:** produto, implementação, integrações, design e decisões vigentes

Este é o primeiro documento que uma pessoa ou IA sem contexto deve ler. Ele descreve o que existe no repositório hoje e prevalece sobre trechos históricos conflitantes dos documentos v1.0. Os documentos de Produto, Arquitetura, Contratos, Demo e Design System continuam válidos para intenção e domínio, desde que não contradigam este estado, a spec `driver-pwa-mobile` ou uma decisão posterior registrada.

## 1. Produto atual

O ChargeGrid Intelligence é uma camada comercial e operacional para recarga de veículos elétricos no ecossistema GoodWe. O monorepo possui três superfícies:

- `admin-web`: experiência desktop para operação de rede, plantas e estabelecimentos, com identidade SEMS+/GoodWe;
- `driver-pwa`: aplicativo exclusivamente mobile para visitante e motorista cadastrado;
- `api`: backend Express responsável pelo gateway Stripe e pelas futuras regras críticas e integrações.

A prioridade atual de produto é a Driver PWA. Ela deve parecer parte do mesmo ecossistema do Admin Web, mas usar composição mobile, tema claro por padrão e predominância branca.

## 2. Decisões vigentes

Estas decisões foram dadas depois dos documentos v1.0 e, portanto, têm precedência:

1. O mapa da Driver PWA usa Google Maps JavaScript API real; não deve existir mapa cartográfico fictício.
2. O catálogo mobile contém várias plantas comerciais para exercitar busca, bounds, disponibilidade e seleção.
3. A landing pública atende quem chega por busca ou link e oferece escanear QR Code, criar conta ou entrar.
4. O visitante pode seguir pelo QR até pagamento, sessão e comprovante sem cadastro obrigatório.
5. O motorista cadastrado possui cadastro, login, mapa, fila, histórico, conta e notificações.
6. O tema padrão da PWA é claro e predominantemente branco; o escuro é opcional.
7. Notificações usam a API do navegador e o service worker, sempre após permissão explícita.
8. Pagamentos usam Stripe real em modo de teste, acima de qualquer premissa antiga de gateway demonstrativo.
9. A interface não deve exibir rótulos como “dados simulados”, “cenário demo” ou equivalentes. A natureza de fixtures deve permanecer documentada e testável, sem poluir a experiência do usuário.
10. Supabase Auth é a identidade remota do motorista quando configurado. O fallback local existe somente para desenvolvimento sem credenciais.

## 3. Estado implementado

| Área | Estado atual | Fonte principal |
| --- | --- | --- |
| Landing pública | Implementada com QR, cadastro e login | `apps/driver-pwa/src/pages/HomePage.tsx` |
| Scanner QR | Câmera, imagem e código manual com ZXing | `apps/driver-pwa/src/pages/QrScannerPage.tsx` |
| Visitante | QR → detalhe → checkout → sessão → comprovante | `apps/driver-pwa/src/app/AppRouter.tsx` |
| Cadastro/login | Supabase Auth quando configurado; fallback local em desenvolvimento | `apps/driver-pwa/src/services/driverAuth.ts` |
| Mapa | Google Maps JavaScript API, Data Layer, busca, geolocalização e seis plantas | `apps/driver-pwa/src/components/DriverDiscoveryMap.tsx` |
| Resiliência do mapa | SDK singleton, timeout, espera por tiles, retry limpo e fallback para a lista | `apps/driver-pwa/src/components/DriverDiscoveryMap.tsx` |
| Pagamento | Stripe Payment Element e PaymentIntents em modo teste | `apps/driver-pwa/src/pages/CheckoutPage.tsx` |
| API financeira | Criar, consultar, capturar e reembolsar PaymentIntent | `apps/api/src/payments/` |
| Webhook Stripe | Assinatura validada sobre corpo bruto; eventos relevantes registrados | `apps/api/src/payments/routes.ts` |
| Fila/sessão | Jornadas de UI e estado local implementadas | `apps/driver-pwa/src/app/DriverAppContext.tsx` |
| Notificações | Permissão e notificações locais pelo service worker | `apps/driver-pwa/src/services/browserNotifications.ts` |
| PWA | Manifest, service worker, ícone, instalação e safe areas | `apps/driver-pwa/public/` |
| Admin Web | Shell e mapa operacional SEMS+/GoodWe | `apps/admin-web/` |
| GoodWe | Contrato e `MockGoodWeProvider`; OpenAPI real ainda não conectada | `apps/api/src/goodwe/` |
| Persistência comercial | Estrutura prevista; migrations, RLS e repositories ainda não implementados | `supabase/` |
| IA externa | Apenas fronteira documental | `apps/api/src/ai/README.md` |

## 4. Fronteiras que não devem ser confundidas

- **Integração real em sandbox:** Google Maps com chave válida, Supabase Auth e Stripe em modo teste chamam serviços externos reais.
- **Dados versionados:** plantas, disponibilidade, sessões de referência e estados operacionais vêm de fixtures ou estado local enquanto a API comercial e o banco não estão implementados.
- **Não implementado:** telemetria e comandos GoodWe reais, cobrança Stripe live, persistência completa com RLS, push remoto, conciliação por webhook e IA.

“Real em sandbox” não significa produção. “Fixture” não deve aparecer como aviso na UI; deve estar explícito em documentação, testes e limites de operação.

## 5. Rotas reais da Driver PWA

| Rota | Acesso | Uso |
| --- | --- | --- |
| `/` | público | landing de visitante |
| `/scan` | público | scanner QR |
| `/qr/:chargerSlug` | público | carregador identificado |
| `/signup` | público | cadastro de motorista |
| `/login` | público | login |
| `/explore` | motorista | mapa, busca e catálogo |
| `/place/:establishmentId` | motorista | detalhe do estabelecimento |
| `/checkout` | público | Stripe Payment Element |
| `/queue` | motorista | fila |
| `/session` | público | sessão corrente |
| `/receipt/:receiptId` | público | comprovante |
| `/history` | motorista | histórico |
| `/notifications` | motorista | central e permissão |
| `/account` | motorista | perfil, veículo, tema e logout |

## 6. Integrações e variáveis

O arquivo local é `.env` na raiz e nunca deve ser versionado. Consulte `docs/specs/driver-pwa-mobile/integrations.md` para o procedimento completo.

| Variável | Onde pode existir | Finalidade |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | browser | Maps JavaScript API; restringir por HTTP referrer e API |
| `VITE_SUPABASE_URL` | browser | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | browser | chave `sb_publishable_...` ou anon legada |
| `SUPABASE_URL` | servidor | URL do mesmo projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | chave `sb_secret_...` ou service role legada; nunca usar em `VITE_*` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | browser | chave `pk_test_...` |
| `STRIPE_SECRET_KEY` | servidor | chave `sk_test_...`; a API rejeita live |
| `STRIPE_WEBHOOK_SECRET` | servidor | segredo `whsec_...` do endpoint/CLI em uso |
| `VITE_CHARGEGRID_API_URL` | browser | URL da API |
| `CHARGEGRID_ALLOWED_ORIGINS` | servidor | origens CORS permitidas |

`SUPABASE_JWKS_URL` não é consumida pelo código atual. Ela só passa a ser necessária quando a API validar JWT Supabase diretamente.

## 7. Limitações operacionais conhecidas

### Google Maps

A chave configurada em 20 de agosto de 2026 foi identificada pelo próprio SDK como **Maps Demo Key** e atingiu a cota diária. O componente está estável diante dessa recusa, mas nenhum código consegue contornar uma cota externa. Para exibir o mapa continuamente é obrigatório usar um projeto Google Cloud com faturamento, Maps JavaScript API habilitada, cota disponível e referrers corretos.

### Stripe

O gateway chama a API Stripe em modo teste. O webhook atual valida a assinatura e registra os tipos acompanhados, mas ainda não persiste nem reconcilia automaticamente o estado comercial da sessão. O segredo do `stripe listen` é próprio do listener local e pode ser diferente do segredo criado no Dashboard.

### Supabase

Cadastro, login, persistência e refresh da sessão Auth estão conectados no PWA. Perfis comerciais em tabelas próprias, RLS, auditoria e autorização de operações críticas na API ainda precisam de migrations e validação JWT no servidor.

### Notificações

São notificações locais do navegador. Push remoto com entrega quando nenhum cliente está executando exige Web Push/FCM, subscriptions persistidas e serviço de envio, ainda não implementados.

## 8. Comandos de trabalho

```bash
npm install
npm run dev
npm run dev:admin
npm run dev:pwa
npm run dev:api
npm run lint
npm run test
npm run build
```

Endereços padrão: Admin `5173`, Driver PWA `5174` e API `3333`.

## 9. Regras para continuidade

- Não mover segredo para variável `VITE_*`.
- Não tratar `localStorage` como banco ou autoridade de produção.
- Não declarar integração GoodWe real enquanto o provider ativo for o mock.
- Não substituir Google Maps por desenho fictício para esconder falha de credencial.
- Não apresentar pagamento testado na Stripe como cobrança live.
- Não duplicar enums: usar `@chargegrid/shared`.
- Não reintroduzir tema escuro como padrão da PWA.
- Atualizar este documento, a spec afetada e a documentação de integração quando uma fronteira mudar.

## 10. Ordem de leitura para uma nova IA

1. `docs/CURRENT_STATE.md` — realidade atual e precedência.
2. `README.md` — execução e estrutura.
3. `docs/specs/driver-pwa-mobile/` — comportamento implementado da PWA.
4. `docs/design-system/README.md` — identidade vigente.
5. Produto, Arquitetura e Contratos — visão ampla e regras de domínio.
6. Demo — fixtures D0–D15 usadas por Admin/testes, não estado de produção.
