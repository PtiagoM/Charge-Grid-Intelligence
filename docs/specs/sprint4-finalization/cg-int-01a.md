# CG-INT-01A — prova integrada automatizada

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Criar a menor bateria automatizada que prove contratos e propagação de estado nos cenários finais, reutilizando infraestrutura Sprint 4.

## Fora de escopo

Stripe test real em CI, Google Maps real automatizado, snapshots cosméticos, duplicar testes M1–M4 já cobertos ou alterar UI para facilitar teste.

## Dependências e estado atual

Depende de DASH-03, LAB-01, DEC-01 e OPS-01. LAB-02/UI-01 não são necessários para validar backend, mas entram no gate manual.

## Arquivos relevantes

`playwright.sprint4.config.ts`, `tests/e2e/sprint4/`, testes API/commercial e helpers de DB isolado existentes.

## Cenários mínimos

1. **Solar/operação:** perfil solar → quote favorável → sessão existente/energia → summary/relatório iguais.
2. **Pico previsto/real:** DEMAND_RAMP → forecast crítico → nova admissão bloqueada → pico real aciona regra reativa → recuperação controlada.
3. **Falha:** perda/fault → quality stale/unavailable → alarme/recomendação → recuperação fecha condição sem apagar histórico.
4. **Persistência:** restart da API mantém sessão, amostras, forecast, decisão e insights; GETs não avançam estado.
5. **Identidade:** todos os payloads mantêm `est_aurora_001`, `plant_aurora_001` e chargerId/code canônicos.

PWA entra apenas como smoke dos fluxos já finalizados quando contrato compartilhado mudar; não reescrever seus testes.

## Critérios de aceite

- Cenários determinísticos passam em DB isolado.
- IDs/valores de energia/decisão batem entre API e Admin.
- Nenhum cenário cria pagamento/sessão pelo laboratório.
- Falhas informam origem em vez de fallback silencioso.

## Testes, documentação e commit

Executar apenas testes focais novos e regressões diretamente afetadas. Registrar comandos/IDs/resultados. Commit: `test(integration): prove final energy intelligence flow`.

## Condição de parada

Parar e devolver à unidade dona se o teste revelar divergência de contrato ou source of truth; não adicionar stub ao frontend.
