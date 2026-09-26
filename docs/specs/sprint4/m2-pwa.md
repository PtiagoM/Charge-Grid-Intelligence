# M2 — Driver PWA final contra a API

Objetivo: P1–P12 do plano, preservando UI normal. GRANDE em quatro unidades. Entrada G1; ler `apps/driver-pwa/AGENTS.md`, [C1–C7/C9](contracts.md). Não editar Admin nem inventar endpoints; ausência contratual volta como falha de G1. Tipos shared não são autorizados a mudar unilateralmente.

Ponto de entrada: `apps/driver-pwa/src/app/{AppRouter,DriverAppContext}.tsx`, `services/{paymentApi,driverAuth,browserNotifications}.ts`, `data/{commercialPlants,useCommercialPlants,plantRecommendations}.ts`, componentes/páginas abaixo. Storage permanece apenas preferência/cache/credencial guest; nenhum timer comercial cliente. Todos os erros mostram próxima ação sem sucesso fictício.

## S4-M2-U1 — Descoberta, Maps, QR e code

- **Depende:** G1; **tamanho:** MÉDIO; **jornadas:** P2/P3.
- **Arquivos:** ExplorePage, MapPage, EstablishmentPage, QrScannerPage, QrLandingPage, `components/DriverDiscoveryMap.tsx`, SessionPlantCatalog, data commercialPlants/useCommercialPlants/plantRecommendations.
- **Implementar:** catálogo público C4, somente Aurora integral; resolver code/QR em UUID; não enviar code em chargerId. Outros locais podem permanecer como contexto não operacional claramente identificado, sem CTA checkout/fila. Endereço/coordenadas/vaga/tarifa/horário vêm do catálogo; imagem/decoração estática pode ficar local.
- **Maps:** preservar mapa real, instância estável; atualizar marcadores sem recriar ao polling; manter zoom/pino selecionado; loading e cota indisponível explícitos. Distância sem geolocalização não finge posição; rota externa existente preservada. “Energia favorável” só quando C8 indicar, não pelo número de vagas.
- **Estados:** available habilita condições; ocupado/assignment alheio orienta login/fila quando permitido; offline/fault/unpublished indisponível; code inválido404 amigável; sem API não restaurar disponível fixture.
- **Aceite:** GIVEN mapa/QR/manual AURORA-02 WHEN abre THEN UUID002/vagaB02 e preço coincidem; GIVEN polling repetido THEN seleção/zoom não reiniciam; GIVEN local não operacional THEN impossível iniciar checkout.
- **Testes:** V01/V02; teste client/API com payload canônico; Playwright com interceptações apenas em ambiente teste, manual Maps real G-M1 depois. V-PWA; sem instalação de biblioteca de mapa.
- **Saída:** descoberta normal aponta para catálogo único; sem alteração visual além de estados verdadeiros. Commit `feat(pwa): use canonical Aurora discovery and charger resolution`.

## S4-M2-U2 — Identidade, quote e checkout

- **Depende:** U1; **tamanho:** MÉDIO; **jornadas:** P1/P4.
- **Arquivos:** DriverAppContext, CheckoutPage, LoginPage, SignupPage, AccountPage, services paymentApi/driverAuth; router de retorno existente.
- **Implementar:** token Supabase em chamadas próprias, nome de conta versus visitante correto; quote servidor + aceite exibindo tarifa/15min/taxa/teto idle; client apenas escolhe garantia dentro faixa e método. Reutilizar Payment Element e retorno Stripe. Uma tentativa UUID/idempotencyKey reaproveitada em reload; mudar meio/limite cancela/reconcilia tentativa antes da substituta, sem abandonar conector no banco.
- **Guest:** guardar token restrito com tentativa; se perdido, não inventar recuperação por UUID/email. Mostrar limite de recuperação sem conta. Token nunca query string/log. Logout limpa snapshot pessoal, não apaga sessão SQL nem token de outra identidade.
- **Erros:** quote expirada exige novo aceite;409ocupado retorna condições; Stripe recusado permite retry conforme estado API; Auth expirado pede relogin, não fallback guest silencioso. Bloquear CTA enquanto solicitação pendente sem esconder resultado de requisição anterior.
- **Aceite:** GIVEN quote aceita190 WHEN backend oferta170 THEN sessão mantem190; GIVEN reload checkout THEN mesma sessão/PI; GIVEN contaB THEN sem dadosA. Nenhum componente escolhe estado AUTHORIZED.
- **Testes:** V03/V06 e ownership com duas contas de teste; Payment Element real em gate separado; V-PWA e contrato cliente. Não adicionar script unit inexistente como se já rodasse.
- **Saída:** sessão criada via API normal e recuperável, sem session fake. Commit `feat(pwa): bind checkout and identity to shared commercial state`.

## S4-M2-U3 — Sessão, retirada, histórico e recibo

- **Depende:** U2; **tamanho:** GRANDE; **jornadas:** P5–P9/P11.
- **Arquivos:** SessionPage, HistoryPage, ReceiptPage, DriverAppContext, paymentApi; componentes que apresentam estado/custo.
- **Implementar:** session atual da API/owner; polling2s compartilhado dentro PWA e cancelado no logout/unmount; resposta antiga não sobrescreve sessão/conta nova. Status C5 integral; energia Wh/1000 apenas exibição. Stop envia comando; enquanto pendente não declarar energy finished. Botão “veículo desconectado” observa/solicita settle, não simula hardware; explicar aguardo de desconexão física quando necessário.
- **Idle:** usar graceEndsAt/idleCost servidor; relógio visual pode contar tempo até timestamp, nunca incrementar custo/estado. Em demanda suspensa mostrar motivo, não cobrança de ociosidade. SETTLEMENT_PENDING permite acompanhamento/retry, não “pago”. Captura abaixo50c continua limitação documentada, sem nova lógica.
- **Histórico:** buscar API filtrada por usuário; recibo mesmo sessionId e composição de valores; impressão reutiliza tela. Pendência não tem selo de pago; refund atualiza detalhes sem apagar energia entregue. Descartar cache cross-account. Remover da execução normal branches non-backendManaged/tickSession que fabricam comércio, preservando fixtures só nos testes.
- **Aceite:** GIVEN sessão concluída WHEN reload/novo browser autenticado THEN mesmo histórico/recibo; GIVEN fim energia conectado THEN retirada/idle, não novo início; GIVEN página fechada THEN backend avança; GIVEN stale THEN valores antigos identificados, não zero.
- **Testes:** V03–V06; UI renderiza todos enums críticos com mesmas métricas da API; V-PWA; E2E financeiro stub só no teste, Stripe real gate depois.
- **Saída:** nenhuma ação necessária depende de estado exclusivamente local; sem travar navegação após falha. Commit `feat(pwa): finish server-owned session and receipt journeys`.

## S4-M2-U4 — Fila, notificações e cobertura final PWA

- **Depende:** U3; **tamanho:** MÉDIO; **jornadas:** P10/P12 e exceções restantes.
- **Arquivos:** QueuePage, NotificationsPage, AccountPage, browserNotifications, DriverAppContext, public/sw.js apenas cache comercial necessário.
- **Implementar:** queue/me com identidade; position/expiry/assignment API; null estimativa honesta; expirar no servidor, UI nunca chama próximo. CALLED abre carregador atribuído/quote normal; sair ASSIGNED orienta cancelamento da tentativa. Notificações locais deduplicadas por evento+usuário; sem prometer push app fechado. Preferências de tema/permissão locais preservadas.
- **Cache:** todas URLs de API e respostas financeiras são network-only, inclusive API em origem própria; SW não devolve snapshot anterior como disponível. Offline básico indica indisponibilidade e mantém navegação; sem fila offline de comandos.
- **Aceite:** GIVEN seis ocupados WHEN entra fila e equipamento libera THEN chamada reflete sem reload; GIVEN logout THEN não continua aviso da conta anterior; GIVEN evento repetido THEN um aviso, não um a cada poll.
- **Testes:** V07, reload/auth expirada/notificação negada; V-PWA; Playwright nos fluxos PWA com API isolada quando M5 existir; inspeção mobile320/390, teclado, estados vazios/loading/erro.
- **Saída/G2:** P1–P12 coerentes comercialmente contra API. C8 indisponível não gera benefício solar fictício; revalidar energia em G4/G5. Commit `feat(pwa): finalize shared queue and honest recovery states`.

## Erros que invalidam G2

Mock comercial no modo normal; botão “liberar recarga” como caminho necessário; code usado como UUID; “pago” pela resposta visual Stripe; ticker React alterando kWh/idle; visitante na fila; catálogo fixture acionável; histórico de outro usuário. Não resolver redesenhando telas.
