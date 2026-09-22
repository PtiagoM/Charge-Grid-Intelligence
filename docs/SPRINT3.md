# Sprint 3 — Prototipagem Funcional e Integração

Atualizado em 22/09/2026. Registro vigente da entrega; complementa `CURRENT_STATE.md`.

## Correção de direção e Marco 1

O fluxo `/demo` abaixo registra a prova de conceito anterior, mas não representa mais a arquitetura-alvo. A demonstração final usa as telas normais e uma única operação comercial persistida.

Marco 1 validado:

- migration PostgreSQL mínima para estabelecimentos, carregadores, sessões e pagamentos;
- catálogo compartilhado do Hub Solar Aurora, incluindo o código operacional `AURORA-01`;
- checkout normal da PWA com Payment Element e PaymentIntent Stripe test real;
- sessão e pagamento vinculados no banco e promovidos para `WAITING_START` após confirmação do Stripe;
- PWA e Admin atualizados por polling de dois segundos sobre a mesma API;
- Admin `Operação` exibe AURORA-01 aguardando conexão e `Sessões` exibe o mesmo ID, motorista, carregador e pagamento;
- reload da PWA/Admin e reinício da API preservam o estado.

Evidência focal: 18 testes da API, teste de projeção do snapshot no Admin e builds de API, Admin e PWA aprovados. A jornada também foi executada em navegador real com cartão Stripe de teste.

Marco 2 validado:

- o laboratório `/admin` foi convertido em fronteira de hardware/GoodWe simulada e usa os mesmos carregadores da operação comercial;
- conexão, início, potência configurável, parada, desconexão, offline, falha e recuperação passam pela API e pelo banco normal;
- um relógio da API acumula `energia = potência × tempo`; polling de PWA/Admin somente observa;
- o teto autorizado limita simultaneamente custo e energia, inclusive ao recuperar uma sessão após reinício;
- a PWA normal encerra a entrega, captura o PaymentIntent real em teste e recebe `COMPLETED` com comprovante;
- Admin `Operação`, `Sessões` e `Resumo financeiro` exibem o mesmo carregador, sessão e PaymentIntent, com atualização a cada dois segundos;
- os controles de cenário demonstrativo foram removidos de `ChargeGrid > Operação`.

Evidência visual: a sessão `CG-868A92DC` no carregador `AURORA-01` avançou até `CHARGING`, encerrou com 21,05 kWh/R$ 40,00, capturou `pi_3UIO8b1zxDyq7sgU0SsaCvFU` no Stripe test e apareceu como finalizada/capturada no Admin. O carregador voltou a `AVAILABLE_TO_START`.

Marco 3 validado:

- migration `202609220003_commercial_queue.sql` persiste a fila e garante no banco uma única entrada ativa por motorista autenticado;
- PWA normal entra, consulta e sai da fila pela API; posição, chamada e carregador atribuído são atualizados automaticamente a cada dois segundos;
- Admin `Fila` projeta as mesmas entradas persistidas e calcula a posição dentro do estabelecimento;
- liberar um carregador pelo laboratório chama o primeiro motorista elegível e mantém o equipamento temporariamente atribuído por dez minutos;
- a atribuição autoriza o checkout normal no carregador chamado; sair da fila libera o carregador se não houver sessão ativa.

Evidência visual: com os seis carregadores Aurora conectados, `Motorista Fila Browser` entrou como `WAITING`, apareceu no Admin, recebeu `AURORA-03` após o evento físico `DISCONNECT`, apareceu como chamado nas duas interfaces e preservou o estado após reload. A saída removeu a fila ativa e devolveu AURORA-03 a `AVAILABLE_TO_START`.

Marco 4 validado no recorte necessário à gravação:

- QR, URL e entrada manual aceitam o código operacional e resolvem o mesmo `chargerId` usado pela API, banco e Admin;
- a landing QR observa disponibilidade, offline/falha e recuperação pelo snapshot comercial, inclusive após reload;
- o cache do service worker exclui `/api/*`, evitando reexibir snapshot comercial obsoleto quando API e PWA compartilham a origem;
- recuperação de pagamento, sessão, fila e atribuição após reload permanece coberta pelos fluxos normais já validados.

Evidência visual: `AURORA-01` digitado no scanner abriu `/qr/AURORA-01`; um evento `OFFLINE` apareceu como falha na PWA, permaneceu após reload e voltou a disponível depois de `RECOVER`, sem atualização manual.

Limitações do ambiente: Google Maps não carrega porque `VITE_GOOGLE_MAPS_API_KEY` está vazia; a migration não pôde ser aplicada ao Supabase remoto sem login/token da CLI. O fallback executável é PostgreSQL local persistente via PGlite, não JSON.

## Auditoria de partida

- Base limpa: `develop/admin-web`, commit `c8cc21c`, PR #16 integrada. Referências remotas atualizadas por fetch.
- Branch de trabalho: `feature/admin-sprint3-integration`, derivada exatamente dessa base. Escopo transversal solicitado: Admin, PWA, API e contratos compartilhados.
- Admin: React/TypeScript nativo, comandos, sessões, fila, permissões demonstrativas, financeiro e relatórios. Persistência e adapters operacionais exclusivamente locais.
- PWA: QR, catálogo, mapa, identidade local/Supabase, Stripe sandbox, sessões/fila/comprovantes locais. Não compartilha sessões com o Admin.
- API: Express/TypeScript, saúde e pagamentos Stripe sandbox; GoodWe é um adapter não conectado. Não há tabelas comerciais ou RLS Supabase implementadas.
- Lacunas verificadas: simulador Admin alterava somente badge; métricas gráficas eram fixtures; PWA perdia recuperação de pagamento e sessão em alguns fluxos; ausência de testes de integração entre os dois produtos.
- Validação de partida: `npm run lint`, `npm test` (88 testes) e `npm run build` aprovados. Aviso de chunk Admin acima de 500 kB, sem erro de build.
- GitHub CLI sem autenticação. Não impede trabalho/commits locais; publicação e merge não fazem parte desta execução.

## Decisão de escopo

A prioridade vigente é demonstrar uma sessão compartilhada por API, desktop e mobile, com simulação explícita e reproduzível quando não existe hardware ou serviço externo disponível. Não reconstruir novamente a interface SEMS+, não afirmar homologação GoodWe e não misturar uma autorização financeira simulada com PaymentIntents Stripe reais em teste.

As listas visuais F0–F7 anteriores continuam referências de evolução do produto, não a definição de pronto da Sprint 3.

## Prova de conceito anterior (legado `/demo`)

- `@chargegrid/shared` define o contrato tipado do cenário executável, sempre identificado como `mode: "simulated"`.
- A API expõe `/demo/state`, `/demo/reset`, `/demo/scenario`, `/demo/advance` e o ciclo de sessões. O runtime usa relógio determinístico, valida o estado carregado e persiste cada mutação por troca atômica do arquivo JSON.
- A PWA possui a rota opt-in `/demo` para iniciar, acompanhar e encerrar a recarga compartilhada. O Admin possui o console `/admin` para controlar cenário e tempo, observar energia, financeiro e eventos da mesma sessão.
- O início respeita disponibilidade, capacidade energética e autorização simulada. A medição calcula energia por potência e duração, atribui excedente solar, congela a tarifa da sessão e encerra exatamente no limite financeiro ou quando o provider fica offline.
- `npm run dev:demo` inicia Admin, PWA e API somente em localhost, limpa credenciais externas nos processos filhos e grava o estado em `.local/demo/state.json`. O modo não é montado pela API em produção.
- O fluxo PWA existente recebeu correções independentes para recuperar o ponto associado ao PaymentIntent, impedir sessões concorrentes, liquidar valor zero, respeitar expiração da fila e limitar ociosidade à garantia financeira.
- O Admin separa leitura e gestão financeira: o papel `REPORT_VIEWER` consulta transações apenas no próprio escopo, enquanto conciliação, reembolso e política tarifária continuam restritos a `finance:manage`.

## Validação

Executado no commit `2d3291c` com a correção E2E local subsequente:

- `npm run lint` — aprovado;
- `npm test` — 98 testes aprovados: 5 shared, 16 API e 77 Admin;
- `npm run typecheck` — aprovado;
- `npm run build` — aprovado; permanece o aviso conhecido do chunk Admin acima de 500 kB;
- `npm run test:e2e:demo` — 3 cenários aprovados no Chromium: sessão compartilhada e recuperação após reload, bloqueios/limite financeiro e offline/recuperação da API.
- `npm run test:e2e` — 58 cenários Admin aprovados no Chromium, incluindo personas, escopos, navegação, operação, financeiro, relatórios e estados de bloqueio.

## Limites preservados

- O runtime é uma demonstração local de processo único; o JSON não substitui banco, concorrência transacional, autenticação, RLS ou auditoria produtiva.
- Nenhum pagamento Stripe, comando GoodWe ou leitura de hardware é executado por `/demo`.
- As demais telas operacionais do Admin e o fluxo comercial normal da PWA continuam usando seus adapters e estados anteriores; esta entrega não os converte silenciosamente para o runtime demonstrativo.
- Não foram executadas nesta unidade homologação de hardware, publicação ou integração em `develop/admin-web`/`main`; a PWA ainda não possui uma suíte ampla própria fora das jornadas integradas da Sprint 3.
