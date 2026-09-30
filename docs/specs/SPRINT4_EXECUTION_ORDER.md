# Ordem canônica de execução da Sprint 4

**Atualizado em:** 29/09/2026  
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
| M5-U2A | **PRÓXIMA UNIDADE** | E01 comércio e E02 persistência |
| M5-U2B | PENDENTE | E03 fila e E06 configuração |
| M5-U2C | PENDENTE | E04 energia e E05 falhas |
| M5-U3 | PENDENTE | gates reais e evidência visual |
| M6-U1/U2 | PENDENTE | hardening baseado somente em falhas de M5 |
| M7-U1/U2 | PENDENTE | documentação/reprodução da baseline S4-C1 |

`G1–G4 concluído` significa que os checkpoints implementados permitem entrar em M5. M5 ainda deve consolidar a evidência integrada e real; não reinterpretar o status como aprovação antecipada de E01–E06 ou dos gates externos.

## Sequência sem ambiguidade

```text
S4-M5-U2A
→ S4-M5-U2B
→ S4-M5-U2C
→ S4-M5-U3
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
