# CG-INT-01A — prova integrada automatizada

**Classificação:** BACKEND ONLY · **Status:** CONCLUÍDO · **Tamanho:** MÉDIO · **Risco:** ALTO.

## Objetivo e escopo

Criar a menor bateria automatizada que prove os **deltas S4-C2** e sua propagação, reutilizando infraestrutura e evidências M5–M7 da baseline.

## Fora de escopo

Stripe test real em CI, Google Maps real automatizado, snapshots cosméticos, duplicar testes M1–M4 já cobertos ou alterar UI para facilitar teste.

## Dependências e estado atual

Depende de DASH-03, LAB-01, DEC-01 e OPS-01. LAB-02/UI-01 não são necessários para validar backend, mas entram no gate manual.

## Arquivos relevantes

`playwright.sprint4.config.ts`, `tests/integration/sprint4-*.spec.ts`, testes API/commercial e helpers de DB isolado existentes.

## Cenários mínimos

1. **Solar/operação:** perfil solar → quote favorável → sessão existente/energia → summary/relatório iguais.
2. **Pico previsto/real:** DEMAND_RAMP → forecast crítico → nova admissão bloqueada → pico real aciona regra reativa → recuperação controlada.
3. **Falha:** perda/fault → quality stale/unavailable → alarme/recomendação → recuperação fecha condição sem apagar histórico.
4. **Persistência:** restart da API mantém sessão, amostras, forecast, decisão e insights; GETs não avançam estado.
5. **Identidade:** todos os payloads mantêm `est_aurora_001`, `plant_aurora_001` e chargerId/code canônicos.

PWA entra apenas como smoke dos fluxos já finalizados quando contrato compartilhado mudar; não reescrever seus testes. E01–E06 da baseline são referenciados e só reexecutados se Dashboard/IA/cenários alterarem seu caminho.

## Critérios de aceite

- Cenários determinísticos passam em DB isolado.
- IDs/valores de energia/decisão batem entre API e Admin.
- Nenhum cenário cria pagamento/sessão pelo laboratório.
- Falhas informam origem em vez de fallback silencioso.

## Testes, documentação e commit

Executar apenas testes focais novos e regressões diretamente afetadas. Registrar comandos/IDs/resultados. Commit local consolidado: `feat(sprint4): integrate predictive demand decisions and energy view`.

## Condição de parada

Parar e devolver à unidade dona se o teste revelar divergência de contrato ou source of truth; não adicionar stub ao frontend.

## Bloqueio encontrado e resolvido — 06/10/2026

O cenário de laboratório semeava 96 amostras de 1 minuto, enquanto `generatePlantForecast` exige 96 buckets completos de 15 minutos. A janela agora prepara 1.455 amostras simuladas, incluindo um bucket adicional para alinhamento; reaplicação idempotente preenche lacunas, e o reset remove forecasts derivados. Cenários online também habilitam a política de demanda persistida, permitindo que o Decision Engine aplique o veto de admissão.

Não inserir forecasts artificiais nem relaxar critérios do modelo. A regressão LAB-01 confirma `DEMAND_RAMP → forecast disponível → evidência crítica e admissão bloqueada` a partir dos dados do próprio laboratório. O cenário estável foi também confirmado da API à apresentação no Admin; os gates restantes de demonstração manual e evidências pertencem à CG-INT-01B.

Validação da integração: `rtk npm run test:e2e:sprint4 -- tests/integration/sprint4-environment.spec.ts` — 3/3 passaram, incluindo `DEMAND_RAMP` da API até a tela Energia e demanda do Admin, comparando valor escalar, proveniência, horizonte e decisão de admissão. `rtk npm exec -- eslint tests/integration/sprint4-environment.spec.ts` passou. Testes focais da API executados serialmente — 6 arquivos, 36 testes — e build da API passaram; execução paralela de PGlite excedeu memória, por isso a validação foi serial.

O cenário mantém o motivo prioritário do Decision Engine (telemetria medida pode produzir `DEMAND_ALERT`) separado do resultado preditivo (`PREDICTED_CRITICAL`); a admissão bloqueada e a evidência vinculada ao mesmo forecast são as invariantes verificadas. Nenhum pagamento ou sessão é criado pelo laboratório. Gate automatizado concluído; o gate visual/manual e registro das evidências reais/sandbox/simuladas pertencem à CG-INT-01B.
