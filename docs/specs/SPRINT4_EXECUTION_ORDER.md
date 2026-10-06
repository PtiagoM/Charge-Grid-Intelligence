# Ordem canônica de execução da Sprint 4

**Atualizado em:** 04/10/2026  
**Função:** eliminar concorrência entre o pacote original `sprint4` e a extensão `sprint4-finalization`.

## Regra de precedência

Os dois pacotes são sequenciais, não alternativas:

1. concluir o pacote original [`sprint4`](sprint4/spec.md), fechando a baseline funcional `S4-C1`;
2. somente depois de `G7` concluído, iniciar [`sprint4-finalization`](sprint4-finalization/spec.md), que adiciona Dashboard canônico, previsão, Decision Engine preditivo e cenários energéticos reproduzíveis sob `S4-C2`.

Documento histórico ou backlog antigo não altera esta ordem. Em conflito sobre “próximo passo”, este arquivo prevalece.

## Estado verificado

| Pacote original | Estado | Evidência/observação |
|---|---|---|
| M0 / G0 | CONCLUÍDO | contrato `S4-C1` ratificado |
| M1 / G1 | CONCLUÍDO | API, persistência e lifecycle compartilhados implementados |
| M2 / G2 | CONCLUÍDO | PWA validada; gate manual de encerramento registrado |
| M3 / G3 | CONCLUÍDO | Admin integrado e validado pelo responsável |
| M4 / G4 | CONCLUÍDO | energia, demanda, oferta e insights determinísticos implementados |
| M5-U1 | CONCLUÍDO | ambiente Playwright isolado no commit `11692ff` |
| M5-U2A | CONCLUÍDA | PWA QR/checkout, autorização API controlada, Admin atualiza por polling sem reload; API reiniciada preserva sessão e pagamento |
| M5-U2B | CONCLUÍDA | E03 fila e E06 configuração; E2E confirma atribuição+checkout, tarifa afeta novas quotes, sessão congelada, Admin mostra histórico e exporta CSV da API |
| M5-U2C | CONCLUÍDA | E01 stop/retirada/liquidação controlados, E04 energia e E05 falha de comando + recuperação; API 21 testes focais |
| M5-U3 | CONCLUÍDA | validação manual do responsável: Maps real, Stripe test, recarga >R$0,50, liquidação e reload; sem IDs/capturas arquivados |
| M6-U1 | CONCLUÍDA | polling não sobreposto/cancelável, stale sinalizado e recuperado, APIs comerciais fora do cache; E02 e smoke E2E de Service Worker aprovados |
| M6-U2 / G6 | CONCLUÍDO — 30/09/2026 | comportamento implementado e validação manual do responsável confirmada; E01/E02, typecheck, lint focal e build PWA passaram |
| M7-U1 | CONCLUÍDO — 30/09/2026 | README/estado/ordem/evidências atualizados; harness E2E isolado por diretório temporário; Sprint 4 E2E 7/7, testes, typecheck e build aprovados |
| M7-U2 | VALIDAÇÃO AUTOMATIZADA CONCLUÍDA — 30/09/2026 | checkout de arquivos versionados + `npm ci`, lint, typecheck, testes 117/117, builds e E2E 7/7; API oficial/PGlite respondeu health isolada na porta 4333 |
| G7 / ensaio manual M7-U2 | CONCLUÍDO — 30/09/2026 | responsável confirmou o ensaio após atualização do README; npm ci, gates automatizados, roteiro e limitações registrados. `npm ci` reportou 3 vulnerabilidades (2 moderadas, 1 alta), sem correção aplicada |
| CG-F0-01 | CONCLUÍDO — 30/09/2026 | merge normal em `8355c23`; os dois commits do vídeo foram incorporados no README da Sprint 4. A branch remota congelada permaneceu em `7d5c6de`; sem push. Execução S4-C2 segue em `feature/sprint4-finalization` (`461e9c5`). |
| CG-F0-02 | CONCLUÍDO | contrato S4-C2 congelado em `7cabb99`; DASH-01..03 e LAB-01 executados posteriormente em `feature/sprint4-finalization` |
| CG-AI-01..05 | CONCLUÍDOS | benchmark `SIMULATED_COMPOSITE`, Ridge Delta offline e inferência Node com persistência |
| CG-DEC-01 | CONCLUÍDO | evidência preditiva correlacionada; risco crítico bloqueia novos inícios, sem comando preditivo de hardware |

`G1–G4 concluído` permitiu entrar em M5. M5/G5 está concluído: U2A–U2C têm evidência automatizada focal e U3 foi confirmado manualmente pelo responsável. A evidência manual não contém IDs/capturas arquivados; isso não deve ser ampliado para alegações sobre hardware físico ou Stripe live.

## Sequência sem ambiguidade

```text
S4-M5-U2A concluída
→ S4-M5-U2B concluída
→ S4-M5-U2C concluída
→ S4-M5-U3 concluída
→ S4-M6-U2 / G6 concluídos
→ S4-M7-U1 concluída
→ S4-M7-U2 automatizada
→ ensaio manual / G7 concluído
→ CG-F0-01 concluído (merge local autorizado; origem preservada)
→ CG-F0-02
→ restante de sprint4-finalization
```

G7, F0-01, F0-02, DASH-01..03, LAB-01 e AI-01..05 estão concluídos. DEC-01 e OPS-01 foram implementados e validados; OPS-01 publica forecast persistido nas superfícies existentes, correlaciona alerta e recomendação pelo forecast atual, deduplica polling e marca a recomendação como superada quando uma previsão posterior deixa de indicar risco. O modelo e suas previsões continuam classificados como benchmark/dados `SIMULATED_COMPOSITE`, não telemetria operacional representativa do Aurora. O responsável validou visualmente LAB-02 e UI-01. LAB-01 foi corrigido para semear janela temporal simulada compatível com inferência de forecast e habilitar a política de demanda em cenários online. CG-INT-01A passou os testes focais da API e o E2E API→Admin (DEMAND_RAMP, forecast escalar e admissão bloqueada). Próxima unidade: CG-INT-01B, gate visual/manual de demonstração e evidências. A branch remota da entrega Sprint 3 continua congelada; não houve alteração, push ou publicação nela.

## Por que existem dois gates de integração/estabilidade/entrega

- M5–M7 fecham e documentam a baseline comercial/energética determinística já implementada sob `S4-C1`.
- `CG-INT-01`, `CG-STAB-01` e `CG-DEL-01` validam somente os deltas introduzidos depois por Dashboard, IA, previsão e novos cenários sob `S4-C2`.
- Evidência M5–M7 continua válida e deve ser referenciada; testes e jornadas não afetados não são repetidos.

## Instrução para modelos executores

Antes de executar qualquer unidade:

1. ler este arquivo e `git status -sb`;
2. confirmar a próxima unidade na tabela acima;
3. abrir somente o SDD dessa unidade, seus contratos citados e arquivos diretamente afetados;
4. executar apenas essa unidade, teste proporcional, documentação e commit;
5. não avançar automaticamente para o pacote seguinte.

Se a evidência atual contradizer a tabela, atualizar primeiro este documento e o registro de gates; nunca escolher silenciosamente outro plano.
