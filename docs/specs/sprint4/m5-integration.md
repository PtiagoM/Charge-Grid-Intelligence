# M5 — Prova da operação única

Objetivo: integrar interfaces já corretas contra C1, não descobrir domínio no E2E. MÉDIO. Entrada G2/G3/G4; U1 pode ser preparada após G1 para validar unidades sem tocar dados pessoais. Ler acceptance.md e C1–C9.

## S4-M5-U1 — Ambiente E2E isolado

- **Área:** novos `playwright.sprint4.config.ts` e `tests/integration/sprint4-*.spec.ts`, setup teste relacionado; `package.json` apenas se adicionar alias útil e documentado. Reutilizar Playwright instalado.
- **Base real:** configSprint3 usa `reuseExistingServer:!CI`, portas3333/5173/5174 e reset destrutivo. Não copiar sem corrigir isolamento.
- **Implementar:** workers1, reuseExistingServerfalse, API/PWA/Admin em portas alternativas fixadas na config, por exemplo3433/5274/5273; CHARGEGRID_DATABASE_PATH temporário exclusivo explicitado; CHARGEGRID_DATABASE_URL vazio no processo teste, não editar .env do usuário. Arquivo/directório de teste deve ser distinguível do banco normal.
- **Provider teste:** stub financeiro/identidade injetados somente no harness NODE_ENV=test; runtime normal só Stripe. Servidor de teste não acessa chave real mesmo se ambientepai a tiver; não fallback automático. Maps interceptado somente nos testes de contrato; gateexterno separado. Uma API/um banco para ambas páginas.
- **Segurança:** reset só no DB teste e Aurora; se destino não comprovado, abortar. Limpar temporário somente após fechar processos/handles, caminho absoluto validado dentro diretório de teste. Não resetar .local/commercial-db.
- **Aceite:** GIVEN servidor pessoal3333 ativo WHEN E2E roda THENnão reutiliza nem altera aquele banco; GIVEN porta teste ocupada THENfalha, não conecta silenciosamente.
- **Testes:** health+marcador de DBteste; test seed/resetsafe; documentar comandoV-E2E que passa a existir.
- **Saída:** harness pronto sem executar nenhuma operação real de cobrança. Commit `test(integration): isolate Sprint 4 browser environment`.

## S4-M5-U2 — E2E central, falhas e reload

- **Depende:** U1 e G2/G3/G4.
- **Implementar:** cenários abaixo em páginas normais, verificando sessionUUID/code/PI/Wh/cents contra API/DB do teste. Não contar dois frontends que compartilham a mesma fixture client como integração.

| Caso | Passos | Asserts indispensáveis |
|---|---|---|
| E01 comércio | Mapa/listaAurora→code→quote→checkout→pagamento controlado→labCONNECT→energia→stop→retirada→settle | 1sessão/1PI; ambas ordens CONNECT/pagamento; Operação/Sessões/Financeiro iguais; sem `/demo` |
| E02 persistência | Recarregar PWA/Admin; fechar UIs; reiniciar API mesmo DB | IDs/quote/histórico preservados; nenhum consumo de downtime inventado; reconsulta não regride |
| E03 fila | Seis conectados→driverfila→liberar→CALLED→checkout ou expirar | Mesma posição/assignment; próxima chamada servidor; guest negado |
| E04 energia | SinaisPV/base→segundoStart negado→corte→retomada | Reason/amostra/comando/efeito corretos; sem idle na suspensão; mesma tarifa aceita |
| E05 falha | ProviderFAULT→stop/freeze→pendência→recuperação física/financeira | Sem sucesso falso, sem receber dados alheios, próxima jornada elegível funciona |
| E06 configuração | Tarifa/publicação→nova quote; histórico/CSV | Nova oferta muda, sessão atual não; sem gráfico/receita fixture |

- **Testes:** V-E2E com screenshots/trace failure; relógio controlado somente harness para15min/10min, nunca botão comercial de avançar tempo. E02 usa diretório persistente de teste e reinício controlado, não memory://.
- **Aceite:** atualização entre clientes em até dois polls (~4s) no ambiente saudável; timeout financeiro simulado não cria segundo PI/capture; zero console errors relevantes.
- **Saída:** E01–E06 registrados com resultados reais de teste. Commit `test(integration): prove shared commercial and energy journeys`.

## S4-M5-U3 — Gates reais e evidência visual

- **Depende:** U2; aplicação normal PGlite+Node, Stripe test configurado, Maps com cota. Testes reais só em dataset sandbox explicitamente destinado à validação, não contas/sessões pessoais sem autorização.
- **Executar:** G-M1–G-M4 em acceptance.md; Maps tiles/pino/code real; Payment Element test sem stub; verificar PI e SQL; dois browsers/PWA/Admin e lab normal; sem novos botões. Consumir ≥50 centavos antes de encerrar. Não prometer validar físico real. G-M5 pertence a M6 e G-M6 a M7; ensaios antecipados são permitidos, mas não dependências circulares de G5.
- **Registro:** data/build/ambiente, IDs de sessão/code, intervalos/Wh/centavos, referência Stripe test sem segredo, capturas sanitizadas e console. Interrupção por cota/credencial registra gate não validado, não “passou mock”.
- **Aceite:** evidência visual demonstra fluxo contínuo e efeito energético; banco/PI correspondem à UI; reload sem perda.
- **Saída/G5:** E01–E06 e gates reais centrais comprovados; limites documentados. Commit de evidência/docs somente sem arquivos sensíveis.

Risco: gate real depende de Auth/Maps/Stripe remotos, mesmo com banco local. Isso não exige Supabase SQL nem cloud. Se indisponível, continuar preparação/teste local e marcar exclusivamente a evidência externa pendente.
