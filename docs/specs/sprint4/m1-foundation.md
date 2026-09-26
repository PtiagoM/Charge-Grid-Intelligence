# M1 — Fundação compartilhada, por unidades

Objetivo: API/SQL executam contratos estáveis, sem frontend decidir negócio. GRANDE, dividido em sete checkpoints. Entrada G0. Ler C1–C7 e C9; C8 apenas formatos de energia. Regras [decisions](decisions.md) vinculantes após G0.

Área autorizada: `apps/api/src/{commercial,payments,goodwe,app.ts,server.ts}`, `packages/shared/src/{contracts,enums,domain}`, migrations/seed; adapters mínimos de ambos frontends quando campo compartilhado mudar. Não redesenhar telas. Não criar microsserviços, ORM, broker ou engine paralelo.

## S4-M1-U1 — SQL versionado e catálogo público — IMPLEMENTADO (26/09/2026)

- **Depende:** G0; **tamanho:** MÉDIO.
- **Alterar:** constructor/migration bootstrap, `chargerRecord/sessionRecord/snapshot` em `commercial/repository.ts`; `routes.ts`; contratos shared; novas migrations. Seed explícito não destrutivo; `supabase/seed.sql` acompanha.
- **Implementar:** ledger C3; banco legado detectado sem reexecutar UPSERT destrutivo; preservar IDs/vagas/coordenadas. Planta canônica, tarifa inicial/quote schema e campos de sessão são aditivos. Publicar catalog/resolve C4 sem PII; UUID verdadeiro em session.chargerId; code em campo próprio. Ajustar adapters consumidores no mesmo checkpoint.
- **Compatibilidade:** seed só inclui Aurora completo; não migrar outras fixtures. Sessões antigas recebem política legacy-s3 sem idle novo. CurrentSessionId só se vínculo ativo comprovado; ambiguidade antiga exige indisponibilidade explicada, não associar última concluída.
- **Testes:** repository.test.ts em memory:// e diretório temporário: instalar vazio, migrar schema legado, alterar tarifa/publicação, reiniciar duas vezes, contar exatamente seis IDs. V01/V02; catalog não contém driver/email/PI. `V-SHARED`, `V-API`, `V-GLOBAL` no checkpoint de integração.
- **Aceite:** GIVEN Aurora existente WHEN migrate/seed/restart THEN nenhuma sessão/configuração some; GIVEN code/QR/UUID WHEN resolve THEN mesmo chargerId e B02 preservado.
- **Risco/saída:** falha migration encerra startup, não fallback fixture. Commit sugerido `feat(api): version commercial schema and expose canonical Aurora catalog`.

## S4-M1-U2 — Ownership motorista e visitante

- **Depende:** U1; **tamanho:** MÉDIO.
- **Alterar:** `commercial/routes.ts`, `payments/routes.ts`, `app.ts`; helper pequeno de verificação de identidade na API (arquivo novo apenas se reutilizado); shared envelopes; `services/driverAuth.ts` PWA só passagem de token.
- **Implementar:** C4. Validar access token Supabase no servidor; ignorar driverId arbitrário no body. Token guest opaco aleatório emitido ao criar quote, hash persistido, escopo quote→sessão. Consulta/stop/settle/receipt exigem proprietário; fila só driver. Sem login Admin novo. CORS permite headers/métodos necessários; não chamar CORS de autorização.
- **Erros:** token inválido401; sessão alheia404; visitante fila403; timeout Auth503 sem usuário fake. Não logar bearer/guest/clientSecret.
- **Testes:** Supertest com verificador Auth controlado somente no teste; A/B/guest, UUID conhecido não dá acesso; webhook raw continua aceitando assinatura. Permissões negadas não mudam SQL. `V-API`, `V-PWA`, typecheck.
- **Aceite:** GIVEN token A e body.driverId B WHEN cria/consulta THEN propriedade é A e B não lê; GIVEN guest WHEN usa outro sessionId THEN404.
- **Saída:** nenhuma rota antiga de sessão/pagamento escapa à mesma verificação; Admin local explicitamente separado. Commit `feat(api): enforce driver and guest operation ownership`.

### Registro de execução U1

- O bootstrap agora mantém `chargegrid_schema_migrations`, faz baseline das três migrations legadas quando o schema já existe e aplica `202609260004_s4_foundation.sql` uma única vez.
- O schema recebeu planta Aurora, campos aditivos de tarifa/quote/sessão/pagamento/fila e vínculos explícitos `current_session_id`/`assignment_id`; o reset limpa esses vínculos antes dos registros referenciados.
- `GET /commercial/catalog` e `GET /commercial/chargers/resolve/:identifier` expõem somente o catálogo publicado. UUID, código e QR resolvem o mesmo carregador; a projeção não inclui sessão, fila, motorista, e-mail ou PaymentIntent.
- A projeção administrativa passou a emitir `session.chargerId` como UUID real e conserva `chargerCode` para exibição. A migration preserva Aurora, tarifa e publicação existentes; dados legados ficam em `legacy-s3`, sem idle habilitado.
- Validação: lint, typecheck, builds Admin/PWA/API, 18 testes API e 78 testes Admin passaram. O PWA não possui script de testes unitários neste repositório.

## S4-M1-U3 — Quote, tentativa e Stripe normal

- **Depende:** U2; **tamanho:** MÉDIO.
- **Alterar:** `reserveSession/attachPayment/failSession`, pagamentos routes/provider existente, shared C2/C4. Cliente `paymentApi.ts` migra payload no checkpoint; UI detalhada em M2.
- **Implementar:** quote persistida e aceita imutável (5 min); limite inteiro 50..100000 centavos; enum CARD/PIX existente; charger UUID, estabelecimento consistente; sessão/client-generated UUID permanece permitido com validação/ownership. Requisição idempotente com mesmo payload devolve mesma tentativa/PI; payload diferente409. Adquirir conector atomicamente; não criar segundo PI ao repetir.
- **Ordem:** reservar tentativa/quote na transação → criar PI fora da transação com chave estável → anexar PI → registrar erro recuperável se timeout. Não marcar failed/liberar cegamente quando Stripe pode ter criado intent; retry pela mesma chave/reconsulta resolve.
- **Tempo:** expiresAt checkout10min; expirar só após conciliar estado real. Quote vence antes da criação do intent, não expira sessão aceita. Cancelar tentativa abandonada libera se não há entrega e confirmação financeira permite. Garantia autorizada não expira por simples relógio do checkout.
- **Testes:** repetir request/timeout anexação/quote expirada/payload alterado/conector ocupado/assignment alheio; um PI mock observado e uma sessão. Não fazer pagamento externo em unit. `V-API`, V-GLOBAL checkpoint.
- **Aceite:** GIVEN quote190 WHEN política muda para170 THEN intent dentro da validade congela190; GIVEN retry idêntico THEN1sessão/1PI; UI segue Payment Element, sem select de aprovação.
- **Saída:** criar intent não basta G1; aguardar U4/U5. Commit `feat(api): persist accepted quotes and idempotent checkout attempts`.

## S4-M1-U4 — Lifecycle e fronteira física únicos

- **Depende:** U3; **tamanho:** GRANDE, manter escopo C5.
- **Alterar:** `recordPayment`, `hardwareEvent`, `advanceEnergy`, `stopSession`, `startCommercialClock`; GoodWeProvider/mock e repository tests.
- **Implementar:** avaliador único chamado por pagamento e conexão em ambas ordens; currentSessionId; pendingCommandId/eventos request/ack/confirmação; start só com pré-condições; stop do motorista/teto/lab passam mesma orquestração/provider. Mock confirma fisicamente explicitamente, sem sessão/pagamento sintético.
- **Estado:** C5 completo, ENERGY_FINISHED não COMPLETED. Demanda será implementada M4: preservar contrato `demandControlEnabled=false` neste checkpoint, reason `ENERGY_POLICY_DISABLED`; não inventar leitura normal/solar. M4 liga política e passa a exigir fresh. Isso é estágio transitório documentado, não gate energético aprovado.
- **Tempo:** tick backend sem sobreposição, precisão C6, GETs não alteram domínio. Repeated CONNECT não dispara novo start. Hardware físico pode CONNECT sem sessão para representar vaga ocupada; START exige sessão válida. OFFLINE/FAULT indisponíveis, RECOVER não apaga histórico nem resolve pagamento.
- **Testes:** V03/V04; duas ordens, dois CONNECT, stop duplicado, falha start, teto, sem browser, restart sem energia de downtime e restart durante Stop pendente (nunca emitir novo Start de encerramento). Potência >nominal ou negativa400; nenhuma entrega sem garantia. Provider falso verificável nos testes; sem API GoodWe real.
- **Aceite:** GIVEN fim confirmado WHEN consulta pagamento autorizado de novo THEN não regride WAITING_START; GIVEN corrente ligada sem sessão THEN ocupado físico, nenhum registro comercial criado.
- **Saída:** mesma regra em todos os callers e estado físico separado de comercial. Commit `feat(api): unify session lifecycle and hardware commands`.

## S4-M1-U5 — Ociosidade, liquidação e recibo

- **Depende:** U4; **tamanho:** GRANDE, exclusivamente fluxo comercial suportado.
- **Alterar:** `assertReadyForCapture/completeCapture`, payments routes/stripe provider, clock, session projection; events/payment migration C3.
- **Implementar:** idle aceito15min conforme C6, cutoff no saldo/60min; marca energyEndedAt uma vez, não recria graceEndsAt em polling/restart. Desconexão fecha idle e inicia liquidação servidor; stop normal não pode voltar aguardando início. RecordPayment monotônico, webhook real assinado persiste/deduplica; reconsulta5s cobre retorno de página ausente. Timestamp de confirmação financeira diferente do fim energético.
- **Stripe:** reutilizar lifecycle existente. Montante calculado servidor; validar PI↔session antes de capture/refund; persistir refundedCents e operation; PIX devolve saldo, CARD captura consumo, cancel sem entrega trata garantia. Timeout→SETTLEMENT_PENDING, mesma chave no retry. Webhook atrasado não regride estado. GET /payments observa SQL depois desta unidade.
- **Limites:** não corrigir1..49c, não arredondar para50, não criar top-up/dívida. Ensaios finais≥50c; pendência nessa faixa continua documentada. Não atualizar SDK/API version ou reformular checkout.
- **Testes:** V04/V05/V06; falha Stripe não gera recibo “pago”; refund repetido não duplica; sessionId/PI cruzados404; valor cliente adulterado não muda cobrança; idle não corre em suspensão/falha. Sem segredos reais.
- **Aceite:** GIVEN end+15min exatos THEN idle0; GIVEN end+16min01s THEN100c antes de cap; GIVEN disconnect THEN custo congelado e recibo mesma sessão; GIVEN legado sem aceite THEN idle0.
- **Saída:** pagamento confirmado/refund/pendência coerentes no SQL e projeções. Commit `feat(api): settle sessions and accepted idle policy on the server`.

## S4-M1-U6 — Fila, atribuição e expiração

- **Depende:** U5; **tamanho:** MÉDIO.
- **Alterar:** `joinQueue/leaveQueue/processQueue/queueForDriver/queueSnapshot`, clock e reserve/start/cancel integração.
- **Implementar:** C7, unique global já existente preservado; session_id em assignment; expiry backend10min e FIFO com desempate id; completar assignment quando CHARGING; sem liberação de sessão ativa por leave; null estimativa. Processar vagas disponíveis suficientes, uma aquisição transacional por par, sem duplicação por tick.
- **Testes:** V07; Auth necessário, join com vaga409; outro estabelecimento não migra fila; CALLED expirado chama próximo; ASSIGNED com autorização confirmada não expira como não paga; START→COMPLETED fila; disconnect/recover chama automaticamente; preço não varia com fila.
- **Aceite:** GIVEN seis CONNECTED sem sessões WHEN driver entra THEN entry WAITING; WHEN lab desconecta uma THEN CALLED/expiry correto em ambas leituras; GET não expira entrada por si.
- **Saída:** reserva temporal e ocupação física distintas, sem janela local como autoridade. Commit `feat(api): complete server-owned queue assignment lifecycle`.

## S4-M1-U7 — Leituras próprias, configuração e agregados

- **Depende:** U6; **tamanho:** MÉDIO.
- **Alterar:** C4 rotas me/receipt/snapshot/publicação/tarifas/reports; repository projections; shared; testar adapters atuais antes de M2/M3.
- **Implementar:** histórico/recibo por identidade; session atual inclui tentativa/retirada/suspensão, pendências antigas ficam histórico; GET puro. Admin altera publicação/horário/versão de tarifa pela API; dado inválido400, charger ativo não é desligado por suspender publicação. Totais e CSV dos registros filtrados [from,to), sem receita fixture ou fee/payout fictício. Conferência interna se mantida é evento, não conciliação bancária.
- **Energia:** somente shape contrato e indisponível até M4; não amostras falsas para preencher gráfico.
- **Testes:** V01/V02/V06; paginação/history usuárioB, editar tarifa→quote nova/sessão antiga, publish false→sem checkout novo, restart preserva edição. CSV e JSON batem centavos/Wh.
- **Aceite:** PWA e Admin podem consumir fixtures contratuais idênticas; UUID/code/status preservados; `V-GLOBAL` verde, documentação CURRENT_STATE afetada atualizada.
- **Saída/G1:** C1–C7 implementados e vetores comerciais verdes; energia honestamente pendente. Commit `feat(api): expose canonical driver history and operational projections`.

## Riscos comuns / critério de parada

Não executar migrations remotas nem reset sobre dados pessoais para provar checkpoint. Não fazer alteração compartilhada sem compilar ambos frontends. Descobrir indisponibilidade Stripe/Auth registra gate externo pendente; continuar regras em testes isolados sem chamar stub de integração real. Qualquer proposta de novo catálogo/IAM/cloud sai desta unidade e não bloqueia G1 local.
