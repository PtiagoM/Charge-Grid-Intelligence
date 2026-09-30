# CG-LAB-01 — perfis energéticos reproduzíveis

**Classificação:** BACKEND ONLY · **Status:** PLANNED · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Fornecer cenários determinísticos na fronteira MockGoodWe para solar, carga-base, perda e recuperação de telemetria, alimentando a mesma série persistida do Aurora.

## Fora de escopo

UI, sessão/pagamento/receita fictícios, bateria obrigatória, relógio comercial paralelo ou provider GoodWe real.

## Dependências e estado atual

Depende de F0-02. O laboratório já define PV/base/online e eventos físicos por carregador; falta perfil temporal reproduzível adequado aos gates finais.

## Arquivos relevantes

`apps/api/src/goodwe/mock-goodwe-provider.ts`, commercial clock/repository/routes, provider config persistida, shared scenario contract e testes.

## Cenários mínimos

Definir IDs imutáveis de `LabScenarioId` em shared (versão pertence ao perfil aplicado):

- `SOLAR_SURPLUS`: PV acima de base + EV, oferta solar/admissão favoráveis;
- `DEMAND_RAMP`: carga-base crescente até alerta/crítico previsto e real;
- `LOW_SOLAR`: importação da rede com carga EV;
- `TELEMETRY_LOSS`: provider offline/stale;
- `RECOVERY`: retorno online com margem abaixo do limiar de recuperação.

Cada cenário define seed, step, unidades, sequência e prefixo histórico simulado suficiente ao modelo. Ao aplicar, prefixo pode ser inserido com timestamps anteriores e proveniência `SIMULATED`; jamais rotulado medido. Estado do cenário fica na configuração persistida do provider. EV continua derivado exclusivamente de carregadores realmente energizados no backend.

## Contratos/API

API técnica aplica `scenarioId`/`version` à planta; GET de energia expõe cenário/proveniência. Reaplicar mesma versão é idempotente. Reset restaura estado técnico Aurora sem apagar catálogo e sem criar comércio.

## Critérios de aceite

- Mesmo cenário/seed produz mesma série.
- Reload/restart mantém cenário e continua coerentemente.
- Nenhum cenário cria session/payment/queue/revenue.
- Perda/recovery mudam quality e política pelo fluxo normal.

## Testes, documentação e commit

Integration focal por perfil, idempotência e restart; unit só para gerador temporal. Documentar valores e finalidade. Commit: `feat(lab): add reproducible GoodWe energy profiles`.

## Condição de parada

Parar se o perfil precisar escrever estado comercial ou se dados simulados não puderem ser distinguidos dos reais.
