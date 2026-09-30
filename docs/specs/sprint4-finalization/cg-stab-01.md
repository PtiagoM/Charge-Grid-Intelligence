# CG-STAB-01 — hardening mínimo do protótipo

**Classificação:** PEQUENO AJUSTE NO FRONT · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

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
