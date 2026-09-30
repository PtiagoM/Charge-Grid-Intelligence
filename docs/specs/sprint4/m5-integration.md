# M5 — Prova da operação única

**Estado em 29/09/2026:** U1 e U2A concluídas; **U2B é a próxima unidade obrigatória**; U2C/U3 pendentes. Objetivo: integrar interfaces já corretas contra C1, não descobrir domínio no E2E. Entrada G2/G3/G4 concluída. Ler acceptance.md, C1–C9 e a [ordem canônica](../SPRINT4_EXECUTION_ORDER.md).

## S4-M5-U1 — Ambiente E2E isolado

- **Área:** novos `playwright.sprint4.config.ts` e `tests/integration/sprint4-*.spec.ts`, setup teste relacionado; `package.json` apenas se adicionar alias útil e documentado. Reutilizar Playwright instalado.
- **Base real:** configSprint3 usa `reuseExistingServer:!CI`, portas3333/5173/5174 e reset destrutivo. Não copiar sem corrigir isolamento.
- **Implementar:** workers1, reuseExistingServerfalse, API/PWA/Admin em portas alternativas fixadas na config, por exemplo3433/5274/5273; CHARGEGRID_DATABASE_PATH temporário exclusivo explicitado; CHARGEGRID_DATABASE_URL vazio no processo teste, não editar .env do usuário. Arquivo/directório de teste deve ser distinguível do banco normal.
- **Provider teste:** stub financeiro/identidade injetados somente no harness NODE_ENV=test; runtime normal só Stripe. Servidor de teste não acessa chave real mesmo se ambientepai a tiver; não fallback automático. Maps interceptado somente nos testes de contrato; gateexterno separado. Uma API/um banco para ambas páginas.
- **Segurança:** reset só no DB teste e Aurora; se destino não comprovado, abortar. Limpar temporário somente após fechar processos/handles, caminho absoluto validado dentro diretório de teste. Não resetar .local/commercial-db.
- **Aceite:** GIVEN servidor pessoal3333 ativo WHEN E2E roda THENnão reutiliza nem altera aquele banco; GIVEN porta teste ocupada THENfalha, não conecta silenciosamente.
- **Testes:** health+marcador de DBteste; test seed/resetsafe; documentar comandoV-E2E que passa a existir.
- **Saída:** harness pronto sem executar nenhuma operação real de cobrança. Commit `test(integration): isolate Sprint 4 browser environment`.

### Checkpoint implementado

- `playwright.sprint4.config.ts` inicia API, Admin e PWA em 3433/5273/5274, sem reutilizar processos existentes. A API usa exclusivamente `.tmp/sprint4-e2e-db`; o launcher remove URL de banco e credenciais Stripe herdadas.
- Em `NODE_ENV=test`, o servidor não carrega `.env`, impedindo acesso acidental a chaves reais pelo harness. O teste de sanidade confirmou health, catálogo Aurora e Stripe não configurado nesse processo isolado.

## S4-M5-U2 — E2E central, falhas e reload (unidade-pai)

- **Depende:** U1 e G2/G3/G4. Não executar U2 diretamente; executar U2A → U2B → U2C.
- **Implementar:** cenários abaixo em páginas normais, verificando sessionUUID/code/PI/Wh/cents contra API/DB do teste. Não contar dois frontends que compartilham a mesma fixture client como integração.

| Caso | Passos | Asserts indispensáveis |
|---|---|---|
| E01 comércio | Mapa/listaAurora→code→quote→checkout→pagamento controlado→labCONNECT→energia→stop→retirada→settle | 1sessão/1PI; ambas ordens CONNECT/pagamento; Operação/Sessões/Financeiro iguais; sem `/demo`. U2A prova autorização/connect/CHARGING; U2C fecha stop/retirada/settle; U3 prova Payment Element/Stripe real. |
| E02 persistência | Recarregar PWA/Admin; fechar UIs; reiniciar API mesmo DB | IDs/quote/histórico preservados; nenhum consumo de downtime inventado; reconsulta não regride |
| E03 fila | Seis conectados→driverfila→liberar→CALLED→checkout ou expirar | Mesma posição/assignment; próxima chamada servidor; guest negado |
| E04 energia | SinaisPV/base→segundoStart negado→corte→retomada | Reason/amostra/comando/efeito corretos; sem idle na suspensão; mesma tarifa aceita |
| E05 falha | ProviderFAULT→stop/freeze→pendência→recuperação física/financeira | Sem sucesso falso, sem receber dados alheios, próxima jornada elegível funciona |
| E06 configuração | Tarifa/publicação→nova quote; histórico/CSV | Nova oferta muda, sessão atual não; sem gráfico/receita fixture |

- **Critérios comuns:** V-E2E com screenshots/trace failure; relógio controlado somente no harness para 15 min/10 min, nunca botão comercial de avançar tempo. E02 usa diretório persistente de teste e reinício controlado, não `memory://`. Atualização entre clientes ocorre em até dois polls (~4 s) no ambiente saudável; timeout financeiro controlado não cria segundo PI/capture; zero console errors relevantes.
- **Conclusão da unidade-pai:** U2 só está concluída depois de U2A, U2B e U2C verdes. Não existe implementação ou commit separado para U2; após U2C, apenas consolidar E01–E06 em `acceptance.md`, sem rerodar testes não afetados.

### S4-M5-U2A — Comércio e persistência

- **Escopo:** E01 e E02 somente; criar/ajustar specs do fluxo comercial normal e restart no harness isolado.
- **Invariantes:** uma sessão/PI, IDs canônicos, sem `/demo`, sem downtime cobrado e sem tocar banco pessoal/Stripe real.
- **Teste:** executar somente os specs E01/E02 e testes API diretamente afetados.
- **Aceite:** a PWA normal resolve AURORA-01 e exibe checkout; quote e PaymentIntent controlados percorrem a API compartilhada; CONNECT inicia a mesma sessão persistida; Operação atualiza por polling sem reload e Sessões reflete a sessão; reinício da API e reload preservam IDs, estado e pagamento. O harness injeta provider determinístico no servidor de teste; nenhum PaymentIntent real é criado.
- **Limite comprovado:** o E2E não confirma Payment Element nem Stripe. O harness não recebe publishable/secret keys. Essa evidência permanece obrigatória em M5-U3; o fluxo normal da PWA não foi alterado.
- **Evidência:** `npm run test:e2e:sprint4 -- tests/integration/sprint4-commercial-persistence.spec.ts` passou; `npm run test --workspace @chargegrid/api -- src/app.test.ts --testTimeout=15000` passou (8 testes); build da API e ESLint focado passaram. O limite de 5 s padrão do Vitest foi curto para inicialização fria do catálogo PGlite, por isso o teste focal foi executado com limite proporcional maior.
- **Commit:** `test(integration): prove commercial journey and persistence`.

### S4-M5-U2B — Fila e configuração

- **Depende:** U2A; **escopo:** E03 e E06 somente.
- **Invariantes:** fila autenticada/assignment servidor; tarifa/publicação só afetam novas jornadas; CSV e UI reconciliam com a mesma fonte.
- **Teste:** specs E03/E06 e testes focais de fila/tarifa/relatório afetados.
- **Aceite:** posição/expiração/configuração persistem e nenhum gráfico/receita fixture reaparece.
- **Commit:** `test(integration): prove queue and configuration journeys`.

### S4-M5-U2C — Energia, encerramento e falhas

- **Depende:** U2B; **escopo:** encerramento/retirada/liquidação controlados do E01, E04 e E05.
- **Invariantes:** política usa amostra persistida; suspensão não gera idle; falha não produz sucesso, energia ou acesso indevido.
- **Teste:** conclusão controlada E01, specs E04/E05 e regressões focais de demand/provider/settlement.
- **Aceite:** stop, desconexão e liquidação concluem o mesmo registro; reason/amostra/comando/efeito são rastreáveis e uma jornada elegível funciona após recuperação.
- **Saída de U2:** consolidar E01–E06 sem rerodar specs não afetados; atualizar acceptance. Commit documental somente se necessário para evidência agregada.

## S4-M5-U3 — Gates reais e evidência visual

- **Depende:** U2A, U2B e U2C concluídas; aplicação normal PGlite+Node, Stripe test configurado, Maps com cota. Testes reais só em dataset sandbox explicitamente destinado à validação, não contas/sessões pessoais sem autorização.
- **Executar:** G-M1–G-M4 em acceptance.md; Maps tiles/pino/code real; Payment Element test sem stub; verificar PI e SQL; dois browsers/PWA/Admin e lab normal; sem novos botões. Consumir ≥50 centavos antes de encerrar. Não prometer validar físico real. G-M5 pertence a M6 e G-M6 a M7; ensaios antecipados são permitidos, mas não dependências circulares de G5.
- **Registro:** data/build/ambiente, IDs de sessão/code, intervalos/Wh/centavos, referência Stripe test sem segredo, capturas sanitizadas e console. Interrupção por cota/credencial registra gate não validado, não “passou mock”.
- **Aceite:** evidência visual demonstra fluxo contínuo e efeito energético; banco/PI correspondem à UI; reload sem perda.
- **Saída/G5:** E01–E06 e gates reais centrais comprovados; limites documentados. Commit de evidência/docs somente sem arquivos sensíveis.

Risco: gate real depende de Auth/Maps/Stripe remotos, mesmo com banco local. Isso não exige Supabase SQL nem cloud. Se indisponível, continuar preparação/teste local e marcar exclusivamente a evidência externa pendente.
