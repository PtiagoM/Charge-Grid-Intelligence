# Aceite executável e registro de evidências

Estado em 29/09/2026: **G0–G4 concluídos; G5 em andamento com M5-U1 concluído; G6–G7 pendentes**. Os vetores abaixo continuam sendo critérios executáveis; somente evidências registradas aprovam cada gate. Ver [contrato](contracts.md) e [ordem canônica](../SPRINT4_EXECUTION_ORDER.md).

## Vetores comuns de contrato

### V01 — Identidade canônica e catálogo

GIVEN seed Aurora C1, WHEN resolver `AURORA-02`, `aurora-02` ou UUID002, THEN mesmo UUID, codeAURORA-02, vagaB02, nominal7, est_aurora_001, plant_aurora_001. Lista pública não inclui driver/email/PI/sessionId. Outro local sem API permanece não operacional, sem checkout/fila habilitados. Alterar publicaçãofalse e reiniciar não restaura true.

### V02 — Ocupação sem sessão falsa

GIVEN seis conectores inicialmente AVAILABLE e publicados, WHEN CONNECT nos seis sem pagamento, THEN availableCount0, todos CONNECTED/OCCUPIED, sessionsCount0, paymentsCount0. WHEN DISCONNECT AURORA-01, THEN availableCount1 ou0 se imediatamente atribuído pela fila; nenhum histórico antigo se torna currentSessionId. Admin overview/locais/Operação e PWA concordam.

### V03 — Início e ordem de eventos

GIVEN tentativa da sessãoS1 no UUID001, CARDauthorized2500, tarifa190; WHEN pagamento→CONNECT e, em banco teste limpo, CONNECT→pagamento, THEN cada ordem gera1sessão/1PI/1Start confirmado, estadoCHARGING e potência7. Repetir CONNECT/webhook não aumenta contagem. Sem garantia ou com decisão energética bloqueada, zero comandosStart. Mesmo Idempotency-Key com outro limite/método→409, sem alteraçãoSQL.

### V04 — Energia, teto e fim sem regressão

GIVEN S1 CHARGING7kW, tarifa190 e garantia2500; WHEN tick avança exatamente600000ms confirmados, THEN Wh=1166,667 (tolerância0,001Wh), custo222centavos, pois round(1166,667×190/1000)=222. A soma de1tick ou600ticks deve diferir no máximo pela precisãoWh declarada, nunca somar arredondamento de dinheiro a cada tick. WHEN Stop confirmado, THEN potência0, estado de retirada/idle; nova consulta de PI AUTHORIZED não muda para WAITING_START. GET repetido não modifica lastEnergyAt/Wh/estado. No teto, custo≤2500 e Stop confirmado; sem energia cobrada do downtime de API.

GIVEN intenção de Stop por motorista/teto persistida e comando ainda pendente, WHEN reinicia API e mock confirma potência0, THEN finaliza energia/retirada e envia **zero novos Starts**. Stop por demanda pendente recupera como suspensão, não encerramento normal. Apenas uma sessão interrompida pelo runtime sem intenção de parada pode usar STARTING/RUNTIME_RECOVERY; Wh/quote/PI permanecem e downtime não gera energia ou idle presumidos.

### V05 — Ociosidade aceita

GIVEN energia222c, garantia2500c, política aceita15min/50cpor minuto iniciado/max60min; energyEndedAt=T0 e veículo ainda conectado:

| Instante | Idle esperado | Total esperado |
|---|---|---|
| T0+14:59 | 0 | 222 |
| T0+15:00 | 0 | 222 |
| T0+15:01 | 50 | 272 |
| T0+16:00 | 50 | 272 |
| T0+16:01 | 100 | 322 |
| T0+75:00 | min(3000,2278)=2278 | 2500 |

WHEN DISCONNECT emT0+16:01 THEN idle congela100c e captura total322c. Reload/restart não reinicia15min. Se garantia restante0, idle0 mas conector continua ocupado até desconexão. FAULTED/SUSPENDED_BY_DEMAND/legado sem aceite não cobram idle. A matriz de estado não precisa permanecer IDLE_FEE se líquido limitado0, mas payload deve explicar taxa limitada pela garantia.

### V06 — Dinheiro e identidade

- CARDauthorized2500/total322: confirmação captura322→captured322/refunded0/COMPLETED. Retry duplica0operações. Antes de confirmação não exibir pago.
- PIXreceived2500/total322: refund2178 confirmado→captured2500/refunded2178/COMPLETED; timeout→REFUND_PENDING/SETTLEMENT_PENDING sem recibo de sucesso.
- Refund administrativo parcial100 após CARDcaptured322→captured322/refunded100; não alterarWh/tarifa, não reabrir sessão. Solicitar323→409/400 conforme validation envelope, sem chamadaStripe.
- CredencialA não acessa sessãoB; guest tokenS1 não acessaS2; body.driverId não troca proprietário. PI deS2 com sessãoS1 negado antes do provider.
- Tarifa nova200 versus sessão/quote válida190: novaquote200, antiga190; UI e recibo não reinterpretam histórico.
- Valores1..49c: limitaçãoD2 documentada, não caso de correção/homologação do lote; não reportar como aprovado. Gate real usa≥50c.

### V07 — Fila global e janela servidor

GIVEN seis CONNECTED, A entraT0/BentraT0+1s, THEN WAITING posições1/2. JoinA duplicado mantém1entrada; guest negado. WHEN DISCONNECT UUID001 emT1, THEN ACALLED/assignmentExpiresAt=T1+10min, Bposição1, conector atribuído não disponível para terceiro. Sem ação, tick emT1+10min expiraA e chamaB. GET antes do tick não executa expiração. Em outro teste Acheckout→ASSIGNED/sessionId, CHARGING→filaCOMPLETED; não expirar sessão ativa. SaídaASSIGNED exige cancelar tentativa, não libera energia em curso. EstimatedWait=null aparece igualmente nas UIs.

### V08 — Energia e demanda

Sem bateria, limite20kW, limiares80/90/recovery75, fresh15s, recuperação30s. Todos são parâmetros de política demonstrativa, não limites certificados.

| Entradas/evento | Resultado esperado |
|---|---|
| PV20/base10/EV7 por10min | import0/export3; EV1166,667Wh, solarToEV1166,667Wh, export500Wh |
| PV4/base10/EV7 por10min | import13/export0; import2166,667Wh; solarToEV0 |
| PV0/base8/EV7; pedir outro7 | import15/projetada22; negar novoStart; ativo não é parado só por tentativa |
| import16/limite20 | ALERT; nenhum novoStart |
| import18/limite20 | CRITICAL; selecionar corte se háEV |
| import15 (75%) | Não conta para condição estrita de recuperação<75% |
| PV0/base8/doisEV7, sendo mais recenteGUEST | import22; cortar guest→import15; estado suspenso, semidle; não retoma só porque caiu para75% |
| Após corte, PV1/base8/EV7 | import14<75%; após30s ainda projeção21≥18, portanto NÃO retomar |
| Depois PV5/base8/EV7 | import10; após30s estável e projeção17<18, retomar elegível; uma decisão/start |
| Timestamp há16s ou provideroffline | qualitySTALE/UNKNOWN; não nova admissão nem selo solar; último valor não é zero medido |
| Base25/PV0/EV0 | Demanda excedida não resolvível porEV; bloquear novos e explicar, sem declarar sucesso |

Dois Starts concorrentes sobre mesma margem contabilizam pendingStart e não admitem ambos. Simular falhaStop não muda importação como se equipamento parasse. Oferta solar170 só novaquote quando condiçõesI-S08 verdadeiras; antigo preço190 permanece. Nenhum GET/polling cria sample/comando.

### V09 — Projeções e inteligência

GIVEN mesmo período [from,to), WHEN JSON/CSV/telas agregam, THEN mesma energia confirmada e capturado/refund; autorizado nunca receita. Sem amostra: gráfico indisponível, não curva fixture. Duas leituras da mesma condiçãoFAULT geram um incidente; recovery fecha condição, reconhecimento não finge recuperarhardware. Aceitar recomendação registra decisão e zero comandos. Orb mostra motivo/evidência ou indisponível. EV sem telemetria de bateria não produz diagnóstico.

## Rastreabilidade mínima

| Requisito/jornada | Unidade dona | Vetor/gate | Tipo |
|---|---|---|---|
| P1 identidade e recuperação | M1-U2/U7, M2-U2/U3 | V06, E02 | INTEGRATION/E2E |
| P2/P3 Maps/local/QR/code | M1-U1, M2-U1 | V01/V02, G-M1 | CONTRACT/E2E/MANUAL |
| P4 checkout/aceite/Stripe | M1-U3/U5, M2-U2 | V03/V06, G-M1 | INTEGRATION/E2E/MANUAL |
| P5/P6 início/energia/stop | M1-U4, M2-U3, M3-U1/U2 | V03/V04, E01 | UNIT/INTEGRATION/E2E |
| P7/P8 idle/liquidação | M1-U5, M2-U3 | V05/V06, G-M2 | UNIT/INTEGRATION/MANUAL |
| P9 histórico/recibo | M1-U7, M2-U3 | V06, E02 | INTEGRATION/E2E |
| P10/A5 fila | M1-U6, M2-U4, M3-U2 | V07, E03 | INTEGRATION/E2E |
| P11/P12 erros/notificações/cache | M2-U3/U4, M6-U1/U2 | E05, G-M5 | UNIT/E2E/MANUAL |
| A1/A11 limites acesso/técnico | M3-U4 | V09, G-M5 | VISUAL/CONTRACT |
| A2/A7 catálogo/publicação/tarifa | M1-U7, M3-U3 | V01/V06, E06 | INTEGRATION/E2E |
| A3/A4 operação/sessões | M1-U4, M3-U1/U2 | V02/V03/V04 | CONTRACT/E2E |
| A6 financeiro | M1-U5/U7, M3-U2 | V06, E01/E06 | INTEGRATION/E2E |
| A8 energia/automação | M4-U1/U2 | V08, G-M4 | UNIT/INTEGRATION/E2E/MANUAL |
| A9 recomendações/alertas | M4-U3, M3-U4 | V09, E04 | UNIT/INTEGRATION/E2E |
| A10 métricas/relatórios | M1-U7, M3-U3, M4-U3 | V09, E06 | INTEGRATION/E2E |
| A12 laboratório | M1-U4, M3-U2, M4-U1 | V02/V08 | INTEGRATION/MANUAL |
| D4 reprodução/runtime | M1-U1/U4, M6-U1, M7-U2 | E02, G-M6 | INTEGRATION/MANUAL |

CONTRACT = asserts de payload nos testes existentes, não biblioteca nova. Teste financeiro controlado não é prova Stripe real. Teste Maps interceptado não é gate visual Maps.

## Gates manuais (G-M, diferentes dos marcos G0–G7)

- **G-M1:** PWA Maps real → Aurora → AURORA-01 → condições/quote → Payment Element Stripe test → sessãoSQL → Adminmesma sessão/PI sem reload. Repetir acesso QR/code confereUUID. Confirmar API não expõe PII no catálogo.
- **G-M2:** CONNECT/Start automático → consumo≥50c → Stop → retirada/idle → disconnect → liquidação/financeiro/recibo. Testar15min com relógio real ou evidência automatizada de clockinjetado identificada; não alegar ter esperado se não esperou. Reload e restart preservamregistros.
- **G-M3:** seis ocupados → driverfila → lablibera → chamada → checkout ou expiração; Admin/PWA mesmosdados.
- **G-M4:** PV/base/EV/rede → restrição/corte/retomada → motivo/evento e efeito numérico. Mesma sessão/quote; simulação explicitada.
- **G-M5:** falhaessencial/retry/ownership e inspeção mobile/desktop das superfícies; IV/bateria/helpdesk etc sem falso sucesso.
- **G-M6:** executar por README com PGlite/Node, seed não destrutivo, processos e env documentados, sem SQLremoto/cloud. Ensaiar vídeo contínuo e registrar limitações.

## Registro de gates

Preencher somente após execução real. Uma linha pode apontar para relatório existente com evidência em vez de duplicá-lo. “Não executado” não vira “passou” por ausência de erro.

| Gate | Estado inicial | Evidência exigida |
|---|---|---|
| G0 contrato | APROVADO DOCUMENTALMENTE — 26/09/2026 | I-S01–I-S11 ratificadas; revisão de contrato/vetores, rastreabilidade e conflitos atuais registrados em M0-U1/U2 |
| G1 serviços | CONCLUÍDO — 26/09/2026 | checkpoints M1, contratos compartilhados, testes API/shared e validações registradas em CURRENT_STATE |
| G2 PWA | CONCLUÍDO — 26/09/2026 | checkpoints M2, build/typecheck, validação visual e encerramento manual após `124d255`/`6223d76` |
| G3 Admin | CONCLUÍDO — 26/09/2026 | checkpoints M3, testes/build e validação manual do responsável |
| G4 energia | CONCLUÍDO — 27/09/2026 | checkpoints M4, testes focais e registro `dfab16d`; integração ampla permanece responsabilidade de G5 |
| G5 integração | EM ANDAMENTO | M5-U1 (`11692ff`) e fatia U2A passaram: PWA QR/checkout observa disponibilidade; API com provider determinístico exclusivo de teste grava uma autorização; Operação atualiza por polling sem reload e Sessões mostra o mesmo registro; reinício da API preserva os dados. Stripe Payment Element real e encerramento/liquidação permanecem em M5-U3/U2C. |
| G6 estabilidade | PENDENTE | SW/restart/falhas/visual, V-GLOBAL/V-E2E, G-M5 |
| G7 entrega | PENDENTE | G-M6, README/diagramas/resultados, estadoGit, checklistfinal |

Formato da evidência de unidade: `S4-Mx-Uy | commit/build | ambiente/DBteste | comandos + exit/resultados | IDs/vetores | limites/nãoexecutado | próximoID`. Não gravar segredo, clientSecret, bearer, email ou foto do usuário. Screenshots sanitizados; pasta output local não é publicação automática.
