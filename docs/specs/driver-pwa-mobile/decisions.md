# Decisões da Driver PWA

## DPR-001 — Tema claro como padrão

- **Data:** 2026-08-20
- **Decisão:** iniciar em tema claro, com superfícies brancas, vermelho GoodWe e tokens visuais compartilhados com Admin Web/SEMS+.
- **Motivo:** priorizar legibilidade em uso externo e alinhar a experiência mobile à identidade solicitada.
- **Impacto:** a preferência é persistida; o tema escuro continua disponível no cabeçalho e na conta.

## DPR-002 — Google Maps obrigatório

- **Data:** 2026-08-20
- **Decisão:** usar Google Maps JavaScript API com Data Layer e eliminar o mapa ilustrativo e qualquer Map ID demonstrativo.
- **Motivo:** garantir geografia, interação, atribuição e comportamento de mapa reais.
- **Impacto:** sem `VITE_GOOGLE_MAPS_API_KEY`, a área mostra um erro acionável; a lista continua acessível.

## DPR-003 — Stripe como gateway de teste

- **Data:** 2026-08-20
- **Decisão:** adotar Stripe PaymentIntents e Payment Element no modo de teste.
- **Motivo:** o modelo suporta autorização com captura manual no cartão, Pix, webhook assinado, idempotência e um sandbox completo.
- **Impacto:** cartão reserva o limite e captura o total; Pix antecipa o limite e reembolsa a diferença. A API recusa `sk_live_`.

## DPR-004 — Processamento financeiro somente no servidor

- **Data:** 2026-08-20
- **Decisão:** manter criação, consulta, captura, reembolso e verificação de webhook em `apps/api`.
- **Motivo:** preservar chaves secretas e aplicar as regras financeiras em uma fronteira confiável.
- **Impacto:** o PWA recebe apenas chave publicável, client secret e estados normalizados.

## DPR-005 — Supabase Auth com fallback local de desenvolvimento

- **Data:** 2026-08-20
- **Decisão:** usar Supabase quando as variáveis públicas estão configuradas e manter uma conta local com senha hasheada para desenvolvimento isolado.
- **Motivo:** entregar o fluxo completo agora sem acoplar o repositório a credenciais externas inexistentes.
- **Impacto:** produção deve configurar Supabase e não tratar `localStorage` como fonte de identidade.

## DPR-006 — QR por câmera, imagem e código

- **Data:** 2026-08-20
- **Decisão:** carregar ZXing dinamicamente somente na rota de scanner.
- **Motivo:** oferecer leitura real sem aumentar o bundle inicial das demais jornadas.
- **Impacto:** permissão de câmera é pedida sob ação do usuário e sempre existe alternativa manual.

## DPR-007 — Notificações via service worker

- **Data:** 2026-08-20
- **Decisão:** emitir notificações do navegador pelo registro do service worker e vincular cada evento a uma rota.
- **Motivo:** manter alertas úteis mesmo quando a aba não está em primeiro plano.
- **Impacto:** a permissão é opcional, explícita e pode ser negada sem bloquear a jornada.

## DPR-008 — Catálogo comercial inicial no cliente

- **Data:** 2026-08-20
- **Decisão:** disponibilizar seis plantas comerciais com coordenadas, horários, tarifas e carregadores no catálogo versionado.
- **Motivo:** exercitar busca, fit bounds, marcadores, detalhe, fila e checkout em diferentes disponibilidades.
- **Impacto:** a futura API de estabelecimentos deve preservar os mesmos identificadores e o contrato usado pelo PWA.
