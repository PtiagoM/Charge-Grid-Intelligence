# Ordem canônica de execução da Sprint 4

**Atualizado em:** 30/09/2026  
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
| M6-U1 | **PRÓXIMA UNIDADE** | retomada, polling e service worker |
| M6-U2 | PENDENTE | falhas essenciais e usabilidade final baseada nos achados |
| M7-U1/U2 | PENDENTE | documentação/reprodução da baseline S4-C1 |

`G1–G4 concluído` permitiu entrar em M5. M5/G5 está concluído: U2A–U2C têm evidência automatizada focal e U3 foi confirmado manualmente pelo responsável. A evidência manual não contém IDs/capturas arquivados; isso não deve ser ampliado para alegações sobre hardware físico ou Stripe live.

## Sequência sem ambiguidade

```text
S4-M5-U2A concluída
→ S4-M5-U2B concluída
→ S4-M5-U2C concluída
→ S4-M5-U3 concluída
→ S4-M6-U1
→ S4-M6-U2
→ S4-M7-U1
→ S4-M7-U2 / G7
→ CG-F0-01
→ restante de sprint4-finalization
```

O pacote novo inteiro permanece `PLANNED` até G7. Um executor não deve começar `CG-F0-01`, dataset, Dashboard, previsão ou novos cenários antes disso.

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
