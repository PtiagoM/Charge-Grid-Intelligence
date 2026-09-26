# Contrato comum S4-C1

Alvo a congelar em G0, **não implementado**. Ler [decisões](decisions.md). Reutilizar interfaces `Commercial*Record` em `packages/shared/src/contracts/index.ts`, enums existentes e fronteira `apps/api/src/goodwe/goodwe-provider.ts`. Não criar modelos comerciais independentes nos frontends.

## C1 — Identificadores, tipos e catálogo

Preservar estabelecimento `est_aurora_001`, coordenadas `-23.55052,-46.633308`, qrSlug `aurora`, tarifa base 190 centavos/kWh. Planta proposta `plant_aurora_001` vinculada a esse estabelecimento; bateria ausente (`null`). Não inferir capacidade FV pela soma dos 42 kW de EV.

| chargerId (UUID atual) | code | qrIdentifier | vaga | nominal kW |
|---|---|---|---|---|
| 00000000-0000-4000-8000-000000000001 | AURORA-01 | aurora-01 | A01 | 7 |
| 00000000-0000-4000-8000-000000000002 | AURORA-02 | aurora-02 | B02 | 7 |
| 00000000-0000-4000-8000-000000000003 | AURORA-03 | aurora-03 | C03 | 7 |
| 00000000-0000-4000-8000-000000000004 | AURORA-04 | aurora-04 | D04 | 7 |
| 00000000-0000-4000-8000-000000000005 | AURORA-05 | aurora-05 | A05 | 7 |
| 00000000-0000-4000-8000-000000000006 | AURORA-06 | aurora-06 | B06 | 7 |

`sessionId/id` UUID imutável, `publicCode` apenas label. `driverId` é subject Supabase verificado; visitante tem `actorType=GUEST` e `driverId=null`. Valores monetários em centavos inteiros BRL; energia exposta em Wh com 3 casas decimais, acumulador SQL com 9 casas para não perder frações a cada tick; potência kW; JSON number finito. Datas ISO UTC. Campo não medido é `null`, nunca zero inventado. IDs em links de recurso são os IDs internos; código/QR entram exclusivamente no resolvedor.

## C2 — Projeções a adicionar/estender

Campos existentes permanecem salvo correção documentada de `chargerId`. Campos abaixo são alvo obrigatório nas features que os usam; não retornar placeholders como se fossem medidos.

| DTO | Campos mínimos e semântica |
|---|---|
| CommercialEstablishmentRecord | Existentes + `plantId, timezone, openingHours, published, availableChargerCount, queueSummary`; horário estruturado semanal `{day:0..6,opens:'HH:mm',closes:'HH:mm'}`; inicialmente Aurora 24h explícito; intervalos noturnos divididos por dia |
| CommercialChargerRecord | Existentes + `plantId, physicalStatus:ChargerTechnicalStatus, currentSessionId:null/UUID, assignmentId:null/UUID`; `published` continua autoridade, sem duplicar lifecycle de publicação no banco |
| CommercialQuote | `id, chargerId, establishmentId, policyVersion, energyCentsPerKwh, idleGraceMinutes:15, idleCentsPerMinute, idleMaxMinutes, idleEnabled, offeredAt, expiresAt, reasonCode, energySampleId:null/id`; imutável |
| CommercialTariffVersion | `id, establishmentId, energyCentsPerKwh, solarEnergyCentsPerKwh:null/number, idleGraceMinutes:15, idleCentsPerMinute, idleMaxMinutes, idleEnabled, validFrom, createdAt, reason`; versão imutável, sem segmentos |
| CommercialSessionRecord | Existentes + `actorType, quote, energyCostCents, idleCostCents, totalCostCents, energyEndedAt, disconnectedAt, settledAt, idleGraceEndsAt, endReason, transitionReason, pendingCommandId, updatedAt`; timestamps/motivos/comando ausentes são null; `costCents` alias de total durante migração, `tariffCents` alias de quote |
| CommercialPaymentRecord | Existentes + `id, refundedCents, pendingOperation, lastErrorCode`; `capturedCents` é bruto recebido, nunca subtrair refund nesse campo; líquido recebido = captured−refunded; não é payout |
| CommercialQueueRecord | Existentes + `sessionId:null/UUID, estimatedWaitMinutes:null/number`; position ≥1 WAITING, 0 nos demais; ordem `(joinedAt,id)` |
| CommercialEvent | `id, establishmentId, sessionId:null, chargerId:null, type, occurredAt, origin, reasonCode, operationId:null, payload`; sem segredos/clientSecret |
| CommercialReceipt | `sessionId, publicCode, chargerCode, establishmentName, quote, energyWh, energyCostCents, idleCostCents, totalCostCents, payment, settledAt`; pendente identificado, não comprovante de sucesso |
| CommercialSnapshot | Existentes + `contractVersion:'S4-C1'`; DTO administrativo, não fonte pública da PWA; sessions preservam estados sem compressão |

Catálogo público omite nome/email/driverId, sessionId, PaymentIntent e detalhes de fila alheia; pode incluir contagem/posição apenas na consulta própria. Recibo/histórico são projeções, não outra entidade comercial.

## C3 — Persistência mínima e migração

Não reescrever as três migrations aplicadas. Acrescentar migrations sequenciais compatíveis com PGlite/pg. Nenhum RLS extenso/grant multi-organização.

| Registro | Evolução necessária / restrição |
|---|---|
| Ledger migrations (novo) | Nome único + applied_at; aplicar uma vez em ordem; detectar schema legado antes de registrar baseline e não reexecutar seus UPSERTs |
| commercial_establishments | timezone, opening_hours; manter IDs/coordenadas/tarifa. Seed explícito `DO NOTHING` para existentes, não reset |
| commercial_plants (nova) | id, establishment_id UNIQUE FK, energy_policy JSON tipado, provider_config JSON tipado; bateria/capacidade opcional |
| commercial_chargers | plant_id FK; current_session_id nullable; vínculo só da ocupação atual, não da última sessão concluída |
| commercial_tariff_versions (nova) | id, establishment_id, preços/idle/validade/motivo imutáveis; versão ativa por estabelecimento, referenciada nas quotes |
| commercial_quotes (nova) | DTO C2 + ator/owner interno e guest_token_hash nullable, UNIQUE id; congelar no checkout; pequena persistência evita assinatura de token customizada |
| commercial_sessions | Quote aceita JSON imutável + quote_id FK; timestamps/valores C2; energy_wh numeric(20,9), sem arredondamento monetário por tick; guest_token_hash nullable; expires_at da tentativa; terminar ocupação sem apagar histórico |
| commercial_payments | refunded_cents, pending_operation, last_error; vínculo PI e sessão únicos existentes preservados |
| commercial_queue_entries | session_id nullable FK; unique ativa por driver já existe; índice único parcial charger_id para CALLED/ASSIGNED |
| commercial_events (nova) | C2; operation_id/evento externo deduplicável; status de comando/resultado no payload tipado; não event sourcing |
| commercial_energy_samples (nova, M4) | plant_id + observed_at únicos, fonte/qualidade, campos C8 e Wh acumulados; índice período/planta |
| commercial_decisions (nova, M4) | key estável, kind ALERT/RECOMMENDATION, estado de revisão, actor demonstrativo, updated_at; evidência referencia evento/amostra |

Atomicidade: transação para aquisição/liberação de conector, assignment e sessão; índice/compare-and-set impede dois donos. Uma sessão pode ter financeiro pendente sem segurar fisicamente carregador já desconectado. Não usar `status != COMPLETED` como única regra de ocupação. Falha ao migrar para execução com erro claro; jamais fallback automático para fixture/outro DB. Backfill legado preserva custos/tarifa e desabilita idle sem aceite anterior.

## C4 — Acesso, HTTP e compatibilidade

Driver: `Authorization: Bearer <Supabase access token>`, identidade verificada no servidor por Auth existente; não confiar em JWT apenas decodificado. Usar verificação de usuário pela API Auth disponível sem exigir service role. Visitante: token aleatório opaco emitido na primeira quote, hash no banco; `X-Session-Token` na criação da tentativa e nas leituras/ações da sessão. Nome/email de visitante são dados declarados, não identidade verificada. Nunca token em logs/URLs. UUID público não é autorização. Token perdido não autoriza recuperar sessão por email; explicar limite ao visitante.

Quote input: `{chargerId,guest?:{name:string,email?:string}}`; name aparado 1..160 caracteres, email opcional sintaticamente válido até254. Driver autenticado usa perfil servidor e ignora guest. Sem bearer e sem guest válido:400. Response sempre `{quote:CommercialQuote,guestToken:string|null}`; token novo somente para guest sem credencial existente. Nova quote com X-Session-Token válido reutiliza owner/token (response guestToken=null); o cliente conserva o token anterior. Intent copia o hash da quote para sessão, nunca emite outro token. Token não permite outras sessões/quotes que não pertencem à mesma tentativa guest; trocar tentativa exige cancelar anterior e emitir nova credencial, não estender acesso à sessão alheia.

Admin/lab: **apenas ambiente local controlado**, sem novo login/IAM. Separar endpoints administrativos dos públicos; acesso não autenticado local é limitação explícita. API bind loopback no modo oficial; cenário telefone/LAN só com proteção de rede configurada, não inferir segurança de CORS. Não adicionar bypass de motorista em modo normal.

Headers novos exigem ajustar `app.ts` (hoje CORS não aceita Authorization/X-Session-Token nem PATCH). Webhook continua recebendo raw body antes de express.json e assinatura válida.

Erro: `{code,message,retryable,currentState?}`; 400 input inválido; 401 credencial ausente/inválida; 404 recurso ausente ou sessão alheia; 409 conflito estado/ocupação/quote expirada/idempotência; 503 dado/provider não disponível; 502 falha externa. Não retornar segredos/exceção crua Stripe. Repetir operação concluída retorna resultado persistido, não segunda cobrança/comando. Mesmo `Idempotency-Key` com payload diferente = 409. Chave financeira vinculada à sessão + tipo + montante final congelado, não ao clique.

| Método/rota final | Entrada relevante | Saída / dono / mudança |
|---|---|---|
| GET /commercial/catalog | Nenhuma | `{establishments,generatedAt}` público sanitizado; novo |
| GET /commercial/chargers/resolve/:identifier | UUID/code/qrIdentifier normalizados trim/case de code | `{establishment,charger}` público; não expõe sessão; novo |
| GET /commercial/snapshot | establishmentId Aurora | CommercialSnapshot administrativo existente corrigido |
| POST /commercial/quotes | Input/identidade definidos acima | `{quote,guestToken}`; token associado à quote e depois sessão; novo |
| POST /payments/intents | `{sessionId,quoteId,chargerId,establishmentId,authorizedCents,method}` + credencial + Idempotency-Key; authorizedCents inteiro50..100000, method CARD/PIX | `{paymentIntentId,clientSecret,session}`; rota existente, payload migrado para centavos/UUID |
| GET /payments/:paymentIntentId | Credencial da sessão | Payment + sessão persistidos; passa a somente observar, sem reconciliar por GET |
| POST /payments/webhook | Raw event assinado | `{received:true}` após processamento/dedup; existente, não apenas log |
| GET /commercial/me/session | Driver JWT | `{session:null/record}`; novo; sessão acionável mais recente, pendências antigas no histórico |
| GET /commercial/sessions/:id | Driver proprietário/guest token | CommercialSessionRecord; existente protegido |
| POST /commercial/sessions/:id/stop | `{reason:'DRIVER_REQUEST'}` ou operador local com motivo | `{session,command}` 200 confirmado/202 pendente; existente unificado |
| POST /commercial/sessions/:id/cancel | Credencial, motivo | `{session}`; novo; apenas sem energia em entrega, conciliar financeiro |
| POST /commercial/sessions/:id/settle | Credencial, sem montante | `{session,payment}`; novo, retry da mesma liquidação; servidor também inicia automaticamente |
| GET /commercial/me/sessions | Driver JWT; `limit` 1..100 default20, offset≥0, status opcional | `{items,total}` ordenado createdAt/id desc; novo |
| GET /commercial/sessions/:id/receipt | Proprietário/guest token | CommercialReceipt; novo |
| GET /commercial/queue/me | Driver JWT | `{entry:null/record}`; substituir driverId livre |
| POST /commercial/queue | `{establishmentId}`; motorista verificado, nome/veículo do perfil | QueueEntry; existente com identidade corrigida |
| POST /commercial/queue/:id/leave | Proprietário | 204; existente; ASSIGNED requer cancelar tentativa primeiro |
| PATCH /commercial/chargers/:id | Admin local `{published:boolean}` | Charger; novo; não interrompe sessão existente |
| PATCH /commercial/establishments/:id | Admin local `{openingHours}` | Establishment; novo, sem CRUD empresarial |
| POST /commercial/establishments/:id/tariffs | Admin local campos C2 sem id/createdAt; preços inteiros≥0, idleGrace15, idleMaxMinutes60, motivo1..500 caracteres | `{tariff:CommercialTariffVersion}`; novo; não altera quotes/sessões existentes |
| POST /commercial/chargers/:id/commands | Admin local `{type,reason}`; type START_CHARGE ou STOP_CHARGE | `{command,session}`; mesmas pré-condições, sem override de pagamento |
| POST /commercial/sessions/:id/refunds | Admin local `{amountCents,reason}` | Payment/operation; refund ≤captured−refunded; novo delega ao provider existente |
| GET /commercial/reports | Admin local `{establishmentId,from,to,format}` query; format json ou csv | Agregados/linhas mesma fonte; novo; intervalo UTC [from,to), max31 dias inicialmente |
| GET /commercial/plants/:id/energy | Admin local ou resumo público sanitizado no catálogo | `{snapshot:null/record,decision,series}`; novo, implementado M4 |
| PATCH /commercial/plants/:id/policy | Admin local campos editáveis da política C8 | `{policy:CommercialEnergyPolicy,decision:CommercialEnergyDecision}`; novo M4 |
| GET /commercial/insights | Admin local establishmentId | `{alerts,recommendations}`; novo M4 |
| POST /commercial/insights/:id/decision | Admin local `{decision,reason}` com enum C8, reason1..500 caracteres | `{insight:CommercialInsight}`; sem comando implícito; novo M4 |
| POST /commercial/chargers/:code/hardware | Lab local ação existente + powerKw | Snapshot; manter compatibilidade do code na fronteira lab |
| POST /commercial/plants/:id/hardware | Lab local `{pvKw,buildingLoadKw,online}` | Snapshot; novo M4; EV não é input |
| POST /commercial/test-data/reset | Lab local confirmação explícita Aurora | Snapshot limpo; rejeitar se PI/garantia pendente no sandbox, resolver antes; nunca apagar catálogo |

Rotas antigas de capture/refund/queue por driverId só podem permanecer temporariamente como delegação com mesma verificação e valores servidor. Nenhum caminho antigo pode contornar o contrato. Remover após M2/M3 sem consumidores. Não manter API `/v2` paralela; checkpoint compartilhado atualiza consumidores do payload de intent.

## C5 — Sessão, hardware e ocupação

Uma função de avaliação de início no servidor é chamada por confirmação de pagamento, CONNECT, recuperação válida e retomada energética. Pré-condições: sessão WAITING_START ou SUSPENDED_BY_DEMAND (ou STARTING com transitionReason RUNTIME_RECOVERY no caminho específico de startup abaixo); garantia suficiente CARD AUTHORIZED/PIX PAID; conector correto CONNECTED; publicação/horário válidos para início novo; assignment próprio se houver; nenhuma outra sessão; decisão energética permite; nenhum comando start pendente efetivo.

| Evento / estado anterior | Próximo estado / efeito |
|---|---|
| Intent reservado | AWAITING_PAYMENT; conector comercial OCCUPIED; físico não muda |
| Autorização confirmada | Evento AUTHORIZED e estado WAITING_START; tentar início uma vez |
| CONNECT sem garantia | Físico CONNECTED/OCCUPIED; não criar sessão nem enviar Start |
| Pré-condições completas | STARTING + comando; só confirmação de entrega leva CHARGING |
| Start falha | START_FAILED + evento; zero consumo; cancelar/devolver garantia; não inventar AVAILABLE enquanto conectado |
| Driver stop / teto / fim físico | Fechar intervalo medido; STOP_CHARGE; CHARGING enquanto pendente com pendingCommandId; confirmado → ENERGY_FINISHED → IDLE_GRACE_PERIOD se elegível/conectado |
| Corte por demanda | STOP_CHARGE confirmado → SUSPENDED_BY_DEMAND; sem idle; preservar quote/garantia; reavaliar retomada |
| Desconexão normal | Fechar medição/idle; disconnectedAt; físico AVAILABLE; iniciar SETTLING; liberar currentSessionId sem apagar financeiro |
| Captura/refund necessários confirmados | COMPLETED e settledAt; custo final imutável |
| Timeout financeiro | SETTLEMENT_PENDING + próxima ação; nunca voltar WAITING_START |
| FAULT/OFFLINE | FAULTED, potência confirmada 0 no mock, congelar última medição; sem idle; registrar pendência de liquidação |
| RECOVER | Restabelece leitura, não declara pagamento nem inicia sessão concluída; ocupado se ainda conectado; reavaliar liberação |
| Restart em CHARGING/STARTING | Primeiro reconciliar intenção/tipo/motivo do comando anterior; STOP de encerramento nunca vira Start. Somente sem intenção de encerramento: entrega0 confirmada no mock, STARTING/RUNTIME_RECOVERY, reavaliar pré-condições sem novo checkout/PI |
| Cancel antes de energia | Cancelar PI/devolver Pix, CANCELLED após confirmação; pendência se provider indisponível |

O mock pode confirmar comando e evento físico na mesma chamada, mas registrar ambos. GoodWeCommandResult SUCCESS é ack; no mock confirmação de entrega emitida explicitamente. Hardware START exige sessão elegível e não aprova pagamento. Repetir CONNECT/STOP não repete comando já confirmado. Leitura de último histórico não define currentSessionId.

Suspensão não consome/gera idle; stop pedido pelo motorista durante suspensão encerra energia e inicia retirada normal. Publicação suspensa bloqueia novas tentativas, não cancela sessões aceitas. Falha/desconexão não reutiliza sessão anterior para veículo novo. Financeiro pendente antigo sem ocupação não impede automaticamente próxima tentativa; exceção <R$0,50 continua documentada.

**Recuperação após restart (mock):** registrar evento RUNTIME_GAP, preservar Wh/quote/garantia. Antes de enviar Stop, persistir sua intenção e motivo no evento/comando. No boot, reconciliar comando anterior com leitura mock reiniciada (CONNECTED se veículo antes conectado, potência0). A intenção prevalece sobre o enum CHARGING: STOP por motorista/teto/fim físico confirmado segue ENERGY_FINISHED/retirada ou SETTLING se desconectado; STOP por demanda segue SUSPENDED_BY_DEMAND e janela normal de retomada; nenhum desses casos entra no auto-restart genérico. Não cobrar idle do intervalo de parada sem confirmação temporal: energyEndedAt é o instante de confirmação conhecido, preservando valor anterior se já registrado.

Somente sem intenção anterior de encerramento, sessão antes CHARGING/STARTING ainda elegível pode ir a STARTING/RUNTIME_RECOVERY e emitir exatamente um novo Start com operationId de recuperação persistido. Enquanto pendente, UI apresenta “retomando recarga”, não “novo pagamento/aguardando início”. Se demanda bloqueia, SUSPENDED_BY_DEMAND; se pagamento inválido/falha física, FAULTED e fechamento abaixo. Sessões em retirada/settlement/terminais nunca voltam a Start. Isso não afirma recuperação de hardware real: provider real futuro teria de confirmar medição/entrega acumuladas.

**Recuperação de FAULTED:** não retomar a recarga anterior. Congelar consumo/energyEndedAt/endReason=HARDWARE_FAULT, sem idle. RECOVER ligado mantém CONNECTED e indisponível para novo veículo; DISCONNECT confirmado libera currentSessionId e inicia SETTLING da sessão anterior. Se já houve desconexão confirmada, RECOVER pode reavaliar disponibilidade sem aguardar nova desconexão. Captura/devolução confirmada leva COMPLETED (ou CANCELLED sem entrega), preservando endReason/evento da falha; falha financeira mantém SETTLEMENT_PENDING no histórico. Novo checkout elegível usa novo UUID. Sem confirmação de desconexão, RECOVER não inventa vaga livre.

## C6 — Dinheiro, relógio e conciliação

- `deltaWh=powerKw*deltaMs/3600`, só intervalo confirmado CHARGING, nunca polling. Acumulador SQL numeric(20,9), resposta arredondada a 0,001 Wh; custo calculado do acumulado, não somando valores monetários arredondados a cada tick. Amostras acumuladas usam a mesma precisão.
- `energyCostCents=round(energyWh*energyCentsPerKwh/1000)`. Teto: cortar no limite de Wh coberto; não cobrar além authorizedCents. Mock para antes de ultrapassar; hardware real é futura capacidade, não afirmar garantia física real.
- `idleGraceEndsAt=energyEndedAt+15min`. Se desconecta antes, zero. Depois: `billableMinutes=min(60,ceil(max(0,disconnectedAtOrNow−idleGraceEndsAt)/60000))`. Taxa `min(billableMinutes*50,max(0,authorizedCents−energyCostCents))`, usando valores da quote, não constantes React. Duração limite não torna equipamento disponível.
- `totalCostCents=energyCostCents+idleCostCents`; quote antiga sem aceite idle → zero idle. Falha/demanda não iniciam tolerância. Tarifa zero válida não divide por zero; continua respeitando limite de idle e evento físico.
- CARD captura total suportado uma vez na desconexão; zero segue cancelamento já suportado, sem inventar cobrança. PIX já recebido devolve `capturedCents−totalCostCents` se positivo. Refund parcial administrativo é operação financeira distinta e não reabre sessão.
- Mapear confirmação financeira explicitamente: CARD requires_capture→AUTHORIZED; recebido/capturado confirmado→PAID; devolução em curso→REFUND_PENDING; devolução total confirmada→REFUNDED; devolução parcial concluída mantém PAID com refundedCents>0; falha definitiva→FAILED. Acrescentar somente `PaymentStatus.CANCELLED` para garantia cancelada sem captura, pois não é falha nem reembolso. `providerStatus` conserva o valor externo; evento cancelado atrasado não anula captura confirmada.
- Montante final vem do banco/medição. PI recebido em request deve pertencer à sessão. Mesma chave/operação permanece até confirmação ou falha conclusiva; timeout não cria nova operação financeira.
- Webhook assinado e reconsulta backend convergem para a mesma função idempotente. Evento repetido/atrasado não regride estados nem zera capturado/refund. Estado terminal do pagamento vem de confirmação Stripe, não de timer.
- Um tick Node sem sobreposição avança energia/idle/fila; conciliação financeira a cada 5 s para operações pendentes. Chamadas externas fora de transação longa; persistir intenção antes e resultado depois. No restart reconsultar operações pendentes antes de retry externo. Sem worker distribuído.
- Downtime sem amostra: preservar acumulados, registrar gap e não extrapolar entrega. Mock reinicia potência 0 até reavaliação, sem reset comercial.

Não alterar nem homologar captura entre 1 e 49 centavos. Documentar limitação D2 e ensaiar com ≥50 centavos. Não adicionar arredondamento mínimo, dívida ou top-up para escondê-la.

## C7 — Fila

Uma ativa global por motorista autenticado; visitante recebe 401/403, nunca fila local. Join só sem carregador elegível e sem sessão ocupando outro equipamento. Mesma requisição do mesmo motorista retorna entrada ativa existente; se outro estabelecimento, 409 com contexto, não mover silenciosamente.

FIFO `(joinedAt,id)`; carregadores elegíveis ordenados code. `WAITING → CALLED` atribui por 10 min. `CALLED → ASSIGNED` ao criar tentativa própria; referência sessionId explícita. `ASSIGNED → COMPLETED` no início CHARGING (não esperar captura). Tentativa expirada/cancelada sem iniciar → EXPIRED/LEFT conforme causa e liberar próxima. Não furar fila por checkout direto: só owner da chamada pode usar o conector atribuído.

Tick expira CALLED; ASSIGNED expira pela tentativa, após conciliar pagamento. Autorização confirmada na fronteira do timeout ganha se registrada antes da decisão de cancelamento; transação revalida antes de liberar. Não cancelar sessão CHARGING por relógio da fila. Call seguinte só quando físico AVAILABLE, publicado/aberto, sem sessão/assignment e energia elegível. CONNECT sem sessão ocupa fisicamente e permite teste de todos ocupados.

`estimatedWaitMinutes=null` até dados suficientes, mesma projeção nas UIs. Posição não muda por GET; expiry/recovery/disconnect/tick disparam processamento. Cancelamento de chamada não exige scheduler externo.

## C8 — Energia, demanda e inteligência

PlantEnergySnapshot estendido: `id,plantId,observedAt,source:'SIMULATED',quality:'FRESH'|'STALE'|'UNKNOWN',pvKw,buildingLoadKw,evLoadKw,gridImportKw,gridExportKw,batteryChargeKw:null,batteryDischargeKw:null,energyStatus,evWh,gridImportWh,gridExportWh,solarToEvWh`. Desconhecido mantém último valor com qualidade, não vira medição zero.

Tick 1 s; PV/base são sinais determinísticos do lab persistidos. EV é soma de entregas confirmadas dos seis carregadores; lab não manda evLoad. Sem bateria: `net=base+EV−PV`, import=max(0,net), export=max(0,−net). Integração por intervalos de amostras, não por render. `solarToEvKw=min(EV,max(0,PV−base))`; integrar Wh; sem atribuir toda bateria ao solar. Capacidade FV simulada explicitamente rotulada se exibida; no seed é desconhecida, não 42 kWp.

Política teste inicial: limite 20 kW, alert 80%, critical 90%, recovery 75%, recoveryStableSeconds30, freshSeconds15. `demandControlEnabled=false` é estágio transitório explícito de M1, com reasonCode ENERGY_POLICY_DISABLED e sem leitura energética inventada; G4 exige true e amostras reais do provider simulado. Utilização=import/limite. NORMAL<80%, ALERT[80,90), CRITICAL≥90%. Novo start só com fresh, estado NORMAL, e demanda projetada incluindo potência nominal/pending starts **<90%** do limite. ALERT não inicia novos EV. Critério usa `gridImport`, não potência EV isolada.

Se CRITICAL e há carga EV: parar um candidato por vez e reavaliar após confirmação. Visitantes primeiro, mais recente `startedAt` primeiro; depois drivers mais recentes; empate UUID lexicográfico. Se base sozinha excede limite, bloquear e explicar “sem carga EV adicional controlável”, não alegar demanda resolvida. Retomar um por vez após importação <75% por 30 s e projeção <90%; suspensão mais antiga primeiro; passar mesmas pré-condições financeiras/físicas. Falta de leitura bloqueia novo start, gera alerta, não presume proteção elétrica.

DTOs energéticos obrigatórios:

- `CommercialEnergyPolicy`: `{id,plantId,version,demandControlEnabled,limitKw,alertPercent,criticalPercent,recoveryPercent,recoveryStableSeconds,freshSeconds,updatedAt}`. id/version/updatedAt servidor; demais campos PATCH validados finitos: limitKw>0; 0<recoveryPercent<alertPercent<criticalPercent≤100; segundos positivos. Defaults acima, sem novo framework de políticas.
- `CommercialEnergyDecision`: `{plantId,policyVersion,sampleId:null|string,state:null|'NORMAL'|'ALERT'|'CRITICAL',quality:'FRESH'|'STALE'|'UNKNOWN',enabled,canAdmit,reasonCode,projectedImportKw:null|number,candidateSessionIds:string[],observedAt}`. M1 desligado: enabled=false, sampleId/state/projectedImportKw=null, quality=UNKNOWN, reasonCode=ENERGY_POLICY_DISABLED; canAdmit cobre apenas ausência de veto energético, não substitui demais pré-condições. Ligado sem leitura: canAdmit=false, state=null, reasonCode=TELEMETRY_UNAVAILABLE. Avaliação por carregador usa nominal daquele ID; boolean genérico não permite bypass.
- `CommercialInsight`: `{id,kind:'ALERT'|'RECOMMENDATION',type,entityId,sourceEventId:null|string,sampleId:null|string,policyVersion:null|string,conditionActive:boolean,severity:'INFO'|'WARNING'|'CRITICAL',reasonCode,message,evidence:string[],suggestedAction:null|string,reviewState,updatedAt}`. ALERT reviewState OPEN/ACKNOWLEDGED/RESOLVED; decisões ACKNOWLEDGE/RESOLVE. RESOLVE só com conditionActive=false, senão409. RECOMMENDATION reviewState OPEN/ACCEPTED/DEFERRED/REJECTED; decisões ACCEPT/DEFER/REJECT. IDs e evidências estáveis para mesma ocorrência; nenhum enum inferido no frontend.

GET insights devolve `{alerts:CommercialInsight[],recommendations:CommercialInsight[]}`. GET energy aceita `from,to` UTC [from,to), max31 dias e devolve `{snapshot,decision,series}`; series são buckets de1min contendo início/fim, médias de potência sobre intervalos conhecidos, Wh do intervalo e quality. Intervalos sem dados são gaps/null, não amostras interpoladas. Sem parâmetros, última hora. PATCH retorna nova versão e decisão recalculada, não altera quote/sessão aceita.

Oferta solar (I-S08): nova quote 170 c/kWh quando fresh/NORMAL e PV−base≥7, senão tarifa base ativa (190 inicial); desconto configurado nunca supera preço base, min0. Sem oferta solar quando stale. Referenciar sampleId/motivo na quote. Quotes válidas e sessões não mudam com clima, fila ou edição administrativa.

Alertas mínimos: HARDWARE_FAULT, TELEMETRY_STALE, SETTLEMENT_PENDING; uma ocorrência aberta por tipo+entidade, encerra condição ao recuperar; reconhecimento é separado da recuperação. Recomendações mínimas: DEMAND_REVIEW, RESTORE_TELEMETRY, SOLAR_OPPORTUNITY; inputs/sample/policy/reason/ação claros. Aceitar/adiar/rejeitar persiste decisão, **não executa Start/Stop**. Automação habilitada na política é quem comanda. Orb explica esses mesmos objetos ou indisponível. Não adicionar LLM, previsão, score comercial, carbono sem fator validado.

## C9 — Compatibilidade visual e aceite de contrato

Labels são projeção de enum, não nova máquina de estados. Sessão energética finalizada não é receita capturada. Operation usa currentSessionId; timeline usa eventos dessa sessão. Totais financeiros separam autorizado, capturado, devolvido e consumido; fee/payout desconhecidos são null/indisponível. Intervalo de relatórios [from,to), energia por amostras/intervalos, receita por confirmação financeira; incluir período e método.

Antes de G1: vetores de [acceptance](acceptance.md) serializados como fixtures **somente de teste**, consumidos pelos adapters Admin/PWA. Um payload pode ser renderizado diferente, mas IDs/status/Wh/cents/PI devem ser iguais. C1 não permite alias code no campo ID nem reduzir FAULTED/SETTLEMENT_PENDING a finished.
