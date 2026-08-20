# Driver PWA mobile — especificação funcional

## Objetivo

Entregar uma experiência PWA exclusivamente mobile para motoristas de veículos elétricos, mantendo a identidade GoodWe/SEMS+ do Admin Web e usando tema claro como padrão. A aplicação cobre descoberta, identificação do carregador, autenticação, pagamento em sandbox, fila, sessão, comprovante, histórico e notificações.

Esta especificação incorpora as orientações posteriores do produto e substitui, para o Driver PWA, premissas anteriores de mapa ilustrativo, checkout local e tema exclusivamente escuro.

## Perfis

- `GUEST`: chega por busca ou link público, escaneia um QR Code e pode iniciar uma recarga sem criar conta.
- `DRIVER`: cria conta ou entra, consulta todos os estabelecimentos, usa fila, histórico, perfil e notificações.

## Rotas

| Rota | Acesso | Função |
| --- | --- | --- |
| `/` | público | entrada com escanear QR, criar conta ou entrar |
| `/scan` | público | câmera, imagem ou código manual |
| `/qr/:slug` | público | identificação pública do carregador |
| `/signup` | público | cadastro de motorista e veículo |
| `/login` | público | autenticação |
| `/explore` | motorista | mapa, geolocalização, busca e catálogo |
| `/establishments/:id` | motorista | detalhe, carregadores e fila |
| `/checkout` | público | limite, meio de pagamento e Stripe Payment Element |
| `/queue` | motorista | posição, estimativa, chamada e saída |
| `/session` | público | autorização, início, energia, encerramento e liquidação |
| `/receipt/:id` | público | comprovante da recarga |
| `/history` | motorista | histórico do motorista |
| `/notifications` | motorista | central e permissão do navegador |
| `/account` | motorista | dados, veículo, tema e saída |

## Entrada pública e QR Code

- A rota raiz é a landing page pública esperada para resultados de busca por ChargeGrid.
- O visitante recebe três ações inequívocas: escanear QR, criar conta ou entrar.
- A leitura usa a câmera do aparelho por `getUserMedia` e ZXing; também aceita imagem e código manual.
- Um QR reconhecido é normalizado para a rota `/qr/:slug`.
- O detalhe público sempre exibe estabelecimento, carregador, vaga, potência, disponibilidade, tarifa e política de ociosidade antes do checkout.

## Cadastro e autenticação

- O cadastro coleta nome, e-mail, senha, veículo e capacidade opcional da bateria.
- Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, cadastro, login, sessão e logout usam Supabase Auth.
- Metadados não sensíveis do motorista são enviados em `user_metadata`.
- Quando o projeto Supabase exige confirmação de e-mail, a interface orienta o motorista a confirmar antes do login.
- Sem configuração remota, o ambiente de desenvolvimento mantém um fallback local funcional com hash da senha; ele não é autoridade de produção.
- Senhas, tokens e chaves secretas nunca são persistidos em texto legível no estado da aplicação.

## Descoberta e Google Maps

- O mapa usa Google Maps JavaScript API real e não possui representação cartográfica alternativa.
- O carregamento é assíncrono e usa o callback recomendado pela API.
- Os pontos usam a Data Layer da própria API e ícones vetoriais, com quantidade disponível e estado por cor.
- A geolocalização do navegador ajusta as distâncias e a ordenação.
- Busca por nome, endereço ou cidade filtra simultaneamente cards e marcadores.
- Seleção no mapa abre informação contextual e sincroniza o card selecionado.
- A ausência de chave ou falha de rede produz estado de erro recuperável, sem desenhar mapa fictício.
- O catálogo inicial possui seis plantas comerciais e múltiplos carregadores distribuídos na Grande São Paulo.

## Pagamentos Stripe em sandbox

- O PWA usa Stripe Payment Element e somente chave publicável `pk_test_`.
- A API usa somente chave secreta `sk_test_` e rejeita chave live.
- Cartão cria `PaymentIntent` em BRL com captura manual: o limite é autorizado antes da energia e somente o valor final é capturado.
- Pix cria `PaymentIntent` em BRL com pagamento antecipado; o saldo não utilizado é devolvido por reembolso parcial no encerramento.
- Criação, consulta, captura e reembolso ficam na API, nunca no PWA.
- Cada intenção leva `sessionId`, estabelecimento e carregador em metadata e usa chave de idempotência.
- O webhook valida a assinatura Stripe sobre o corpo bruto.
- O retorno por redirecionamento recupera a intenção pendente e consulta seu status até a autorização.

## Fila e sessão

- O motorista cadastrado pode entrar e sair da fila quando não houver vaga imediata.
- A interface mostra somente a posição e a estimativa relevantes ao motorista.
- A chamada abre uma janela de dez minutos para aceitar a vaga.
- A sessão respeita a sequência `AUTHORIZED → STARTING → CHARGING → FINISHING → IDLE_GRACE → SETTLED`.
- Nenhuma energia é apresentada antes da autorização financeira.
- Cartão é capturado e Pix é parcialmente reembolsado antes de emitir o comprovante final.

## PWA, tema e notificações

- A aplicação é mobile-first a partir de 320 px, usa safe areas e navegação inferior para o motorista autenticado.
- O tema inicial é claro, com predominância branca, vermelho GoodWe e tokens do Admin Web/SEMS+; o tema escuro permanece opcional.
- Manifesto, ícones, `theme-color` e service worker permitem instalação como PWA.
- A solicitação de notificações acontece somente após ação explícita do usuário.
- Com permissão concedida, eventos de fila, sessão e liquidação usam `ServiceWorkerRegistration.showNotification`.
- O clique em uma notificação abre a rota correspondente e reutiliza uma janela existente quando possível.

## Segurança e privacidade

- Segredos ficam somente na API e em arquivos locais ignorados pelo Git.
- Chaves públicas são restringidas por origem/referrer nos provedores.
- O gateway bloqueia valores fora dos limites, métodos desconhecidos e operações sem associação à sessão.
- A câmera e a localização dependem de contexto seguro (`https` ou localhost) e de consentimento do usuário.
- Dados financeiros são coletados em elementos hospedados pela Stripe.

## Dependências externas para validação integral

- projeto Google Cloud com Maps JavaScript API, chave restrita e cobrança habilitada;
- projeto Supabase com Auth configurado para os domínios de desenvolvimento/produção;
- conta Stripe com modo de teste, cartão e Pix habilitados, mais segredo de webhook;
- HTTPS em produção para câmera, geolocalização, service worker e notificações.

## Fora deste incremento

- publicação em loja nativa;
- cobrança live;
- aquisição automática de lojistas ou plantas por API de terceiros;
- comandos físicos de carregamento sem credenciais e homologação GoodWe.
