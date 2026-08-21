# Driver PWA mobile — especificação vigente

**Estado:** implementada no monorepo; validação integral depende das integrações externas descritas em `integrations.md`.  
**Precedência:** este documento incorpora as decisões posteriores do produto e substitui, para a Driver PWA, premissas antigas de mapa ilustrativo, gateway mock e tema exclusivamente escuro.

## Objetivo

Entregar uma PWA exclusivamente mobile para recarga de veículos elétricos, com identidade GoodWe/SEMS+, tema claro por padrão e jornadas completas para visitante e motorista cadastrado.

## Perfis

- `GUEST`: chega por busca, link ou QR; consulta condições, paga, acompanha a sessão e acessa o comprovante sem criar conta.
- `DRIVER`: cria conta ou entra; acessa mapa, geolocalização, estabelecimentos, fila, histórico, notificações e conta.

## Rotas implementadas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | público | entrada com escanear QR, criar conta e entrar |
| `/scan` | público | câmera, imagem ou código manual |
| `/qr/:chargerSlug` | público | detalhe público do carregador |
| `/signup` | público | cadastro de motorista e veículo |
| `/login` | público | autenticação |
| `/explore` | motorista | Google Maps, geolocalização, busca e catálogo |
| `/place/:establishmentId` | motorista | detalhe, carregadores, rota externa e fila |
| `/checkout` | público | limite, meio e Stripe Payment Element |
| `/queue` | público | posição, estimativa, chamada e saída da fila da planta |
| `/session` | público | autorização, energia, retirada e liquidação |
| `/receipt/:receiptId` | público | comprovante |
| `/history` | motorista | histórico próprio |
| `/notifications` | motorista | central e permissão do navegador |
| `/account` | motorista | perfil, veículo, tema, dados locais e logout |

## Entrada pública e QR

- A raiz é a landing esperada para resultados de busca e links públicos.
- As três ações principais são escanear QR, criar conta e entrar.
- O scanner usa `getUserMedia` e ZXing carregado sob demanda; imagem e código manual são alternativas obrigatórias.
- O QR válido resolve um `chargerSlug`, seleciona planta/carregador e exibe disponibilidade, potência, vaga, tarifa e ociosidade antes do checkout.
- Carregador disponível permite seguir como visitante ou com conta. Ao ler um carregador ocupado, visitante ou motorista entra na fila única da planta; a vaga é atribuída quando houver disponibilidade.

## Cadastro e autenticação

- Cadastro: nome, e-mail, senha, veículo e capacidade opcional da bateria.
- Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, Auth usa Supabase real: signup, login, refresh, restauração e logout.
- A chave nova `sb_publishable_...` é configurada no nome histórico `VITE_SUPABASE_ANON_KEY` por compatibilidade com o código.
- Metadados não sensíveis ficam em `user_metadata`.
- Confirmação de e-mail é respeitada quando habilitada no projeto.
- Sem credenciais Supabase, existe fallback local exclusivamente para desenvolvimento; não é autoridade de produção.
- Tabelas de perfil, veículos, RLS e autorização JWT na API ainda não estão implementadas.

## Descoberta e Google Maps

- Google Maps JavaScript API real, sem mapa cartográfico alternativo.
- O loader é singleton, assíncrono, possui timeout e remove tentativa incompleta antes de retry.
- O canvas só é revelado após `tilesloaded`, evitando o relance de um mapa posteriormente rejeitado.
- Falha de chave, cota, billing, referrer ou rede mantém a lista utilizável e apresenta erro estável.
- Data Layer e ícones vetoriais representam estabelecimentos com disponibilidade.
- Busca filtra mapa e cards; geolocalização recalcula distância e ordenação.
- Selecionar marcador atualiza estilo, centralização, zoom e card sem recriar o mapa inteiro. Abrir uma planta preserva-a como contexto da aba Sessão até que outra seja escolhida.
- A página da planta permite escolher explicitamente um dos carregadores. A fila é compartilhada pela planta, não por vaga; quando chamado, o app direciona para uma vaga disponível.
- O catálogo inicial possui seis plantas na Grande São Paulo.
- A chave demo usada no desenvolvimento atingiu a cota; funcionamento contínuo exige chave Google Cloud faturada e restrita corretamente.

## Stripe em modo teste

- O PWA recebe somente `pk_test_...`; API recebe `sk_test_...` e rejeita live.
- Payment Element coleta cartão/Pix diretamente no ambiente Stripe.
- Cartão usa `capture_method=manual`: reserva o limite e captura apenas o total final.
- Pix usa captura automática: paga o limite e permite reembolso da diferença não utilizada.
- Criação, consulta, captura, reembolso e verificação de webhook ficam na API.
- Metadata vincula `sessionId`, estabelecimento e carregador; operações usam idempotência.
- Retorno por redirecionamento recupera o PaymentIntent pendente e consulta o estado.
- O webhook valida assinatura sobre corpo bruto e registra eventos acompanhados; persistência/reconciliação comercial automática ainda é pendência.
- Em desenvolvimento na mesma rede, uma URL de API configurada como `localhost` é resolvida para o host aberto pelo celular. A API aceita origens IPv4 privadas somente fora de produção e o cliente interrompe a espera após 15 segundos com erro acionável.

## Sessão e fila

- A fila local suporta `WAITING`, `CALLED` e saída, com janela de dez minutos após chamada. Visitante também pode participar e, quando chamado, segue ao checkout em modo visitante.
- A jornada visual implementada é `AUTHORIZED → WAITING_START → STARTING → CHARGING → ENERGY_FINISHED → IDLE_GRACE_PERIOD → IDLE_FEE opcional → SETTLING → COMPLETED`.
- Energia só aparece após `CHARGING`.
- Em `SETTLING`, cartão é capturado ou saldo Pix é reembolsado pela API antes do comprovante.
- Estado atual de fila, sessão, comprovantes e notificações é mantido no cliente; persistência compartilhada na API/Supabase permanece futura.

## PWA, tema e notificações

- Mobile-first desde 320 px, safe areas, header compacto e bottom navigation autenticada.
- Tema claro com predominância branca e vermelho GoodWe é o padrão; escuro é opcional e persistido.
- Manifest, ícone e service worker permitem instalação.
- Notificações são solicitadas somente por gesto explícito e emitidas via `ServiceWorkerRegistration.showNotification`.
- O clique direciona à rota associada.
- São notificações locais; push remoto sem cliente aberto exige infraestrutura adicional ainda ausente.

## Segurança

- Segredos somente no servidor e em `.env` ignorado pelo Git.
- `sb_secret_...`, service role e `sk_test_...` nunca entram em `VITE_*`.
- Google Maps e chaves públicas devem ser restritas por origem/referrer.
- Dados financeiros são coletados por componentes hospedados pela Stripe.
- Câmera, localização, service worker e notificações exigem HTTPS em produção ou localhost em desenvolvimento.

## Fora do estado atual

- cobrança live e operação fiscal produtiva;
- persistência comercial e RLS completos;
- conciliação da sessão a partir do webhook;
- push remoto;
- telemetria e comandos GoodWe reais;
- publicação em lojas nativas;
- IA externa operacional.
