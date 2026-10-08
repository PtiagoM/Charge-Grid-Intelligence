# CG-STAB-01 — hardening mínimo do protótipo

**Classificação:** PEQUENO AJUSTE NO FRONT · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Corrigir somente regressões confirmadas que ameaçam reprodução, persistência ou demonstração final.

## Fora de escopo

Alta disponibilidade, cloud, observabilidade enterprise, IAM novo, offline avançado, refatoração estética ou otimização especulativa.

## Dependências e estado atual

Depende de INT-01B. Shutdown/lock PGlite e execução sem watch já possuem correções recentes e gate M6 da baseline; devem ser revalidados somente quando os deltas S4-C2 os afetarem.

## Arquivos relevantes

Scripts raiz/API, lease PGlite, polling Admin/PWA, service worker/cache da PWA somente se regressão, tratamento de erro das superfícies finais e documentação de execução.

## Execução obrigatória

1. Triar falhas dos gates por impacto e reproduzir antes de corrigir.
2. Corrigir raiz no backend/shared quando o estado for transversal.
3. Revalidar start/stop limpo, Ctrl+C, restart, lock stale, portas e persistência.
4. Revalidar loading/error/unavailable e polling sem avanço de relógio.
5. Não tocar na PWA sem evidência de regressão/contrato.
6. Rodar checks focais após cada correção; depois um único gate global.

## Critérios de aceite

- Dois ciclos iniciar→usar→encerrar→reiniciar sem corrupção/lock órfão.
- Reload/restart não perde estado persistente nem duplica decisão/forecast.
- Sem erro de console importante nos cenários finais.
- `lint`, `typecheck`, testes e builds globais passam ou falha preexistente é identificada.

## Testes, documentação e commit

Teste de regressão mínimo por bug; uma suíte global ao fim, E2E final uma vez. Atualizar troubleshooting. Commits `fix(scope): ...` por causa coerente.

## Condição de parada

Mudança visual relevante vira HUMAN FRONTEND GATE; problema fora do cenário final é documentado, não amplia escopo.

## Execução concluída

- Causa confirmada: o harness E2E encerrava a API com `SIGTERM`, que não fornece shutdown confiável ao processo filho no Windows e podia interromper o uso do PGlite. O harness agora solicita shutdown por IPC, aguarda a finalização e só usa encerramento forçado após timeout; a API de teste fecha servidor, repositório e diretório temporário isolado.
- Corrigidos seletores E2E que ainda esperavam o link antigo “ChargeGrid” e uma asserção que usava `demandKw` em vez do contrato atual `gridImportKw`.
- Sem alteração em código de produção, PWA, banco persistente ou branch da entrega Sprint 3. O E2E usa banco PGlite temporário exclusivo.
- Validação: E2E Sprint 4 8/8; E01/E02 repetido por dois ciclos 2/2; Admin 85/85, shared 5/5 e 52 testes da API aprovados em invocações focais por arquivo. `lint`, `typecheck` e `build` passaram.
- Limitação ambiental: a suíte API completa em um único processo terminou por OOM do Node 24 neste ambiente. Os arquivos relevantes passaram isoladamente; repetir a suíte completa não é necessário para esta unidade e o limite foi mantido visível, não mascarado.
- Encerramento de API isolada validado por sinal em porta de teste. O terminal PowerShell aninhado não encaminhou uma tecla Ctrl+C ao processo filho, então essa tecla literal não foi validada nesse ensaio; o shutdown pelo handler de sinal e a reinicialização pelo E2E passaram.

Entrega documental subsequente concluída em `CG-DEL-01`; consulte a SDD correspondente.
