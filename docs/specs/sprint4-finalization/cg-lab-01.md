# CG-LAB-01 — perfis energéticos reproduzíveis

**Classificação:** BACKEND ONLY · **Status:** DONE · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

## Objetivo e escopo

Aplicar perfis determinísticos na fronteira MockGoodWe, persistindo os sinais e as amostras na mesma planta Aurora já usada por API, Admin e PWA.

## Fora de escopo

UI/controles novos, sessão/pagamento/receita fictícios, bateria obrigatória, relógio comercial paralelo ou provider GoodWe real.

## Implementado

IDs de cenário existentes em `packages/shared/src/contracts/index.ts` foram reutilizados. Cada perfil em `commercial_plants.provider_config` contém `scenarioId`, versão 1, seed, passo de 60 segundos e `appliedAt`. Os sinais abaixo são SIMULADOS e são lidos pelo relógio backend através do provider normal:

| Cenário | Perfil do MockGoodWe |
|---|---|
| `SOLAR_SURPLUS` | 30 kW FV, 8 kW carga-base. |
| `DEMAND_RAMP` | 2 kW FV; carga-base crescente de 8 até 28 kW. |
| `LOW_SOLAR` | 1 kW FV, 12 kW carga-base. |
| `TELEMETRY_LOSS` | provider offline; amostra anterior passa a stale. |
| `RECOVERY` | FV crescente de 2 até 30 kW, 12 kW carga-base. |

Na aplicação de um cenário online, a API grava 96 amostras anteriores (intervalos de 1 minuto), sempre `source=SIMULATED`; isso forma uma janela reproduzível de 96 minutos para inspeção. A seed desloca deterministicamente a rampa em até três passos. Essa série não é medição do Aurora e não autoriza treinamento operacional do forecast. EV permanece calculado a partir de carregadores realmente energizados. Nenhum cenário cria sessão, pagamento, fila ou receita.

## Contrato/API e persistência

`POST /commercial/plants/:plantId/hardware` mantém o payload de sinais manuais já existente e também aceita `{ "scenarioId": LabScenarioId, "seed": number }`. Reaplicar o cenário/seed ativo é idempotente. `GET /commercial/plants/:plantId/energy` retorna `simulation` com o perfil persistido (ou `null`), além do snapshot e da decisão energética. O reset existente limpa configuração e telemetria de teste; não apaga catálogo. Não foi necessária migration: `provider_config` já é JSONB persistido.

Aplicar sinais manuais limpa os metadados do perfil e preserva o fluxo de configuração atual.

## Validação e documentação

- Unit: determinismo e transições dos perfis — passou.
- Integração API/repository: prefixo simulado, idempotência, leitura do cenário e retorno ao modo manual — passou dentro da suíte focal do repository.
- Rota HTTP do cenário e `GET energy` — passou.
- Build `@chargegrid/shared` e `@chargegrid/api` — passou.
- Não houve alteração visual nem teste browser.

## Condição de parada

Parar se qualquer cenário escrever estado comercial ou se sinais simulados forem apresentados como medidos. Implementação concluída sem cruzar essa fronteira.

Commit: `feat(lab): add reproducible GoodWe energy profiles`.
