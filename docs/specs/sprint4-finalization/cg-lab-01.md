# CG-LAB-01 — perfis energéticos reproduzíveis

**Classificação:** BACKEND ONLY · **Status:** DONE — HISTÓRICO REPRODUZÍVEL COMPATÍVEL COM FORECAST · **Tamanho:** MÉDIO · **Risco:** MÉDIO.

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

Na aplicação de um cenário online, a API grava 1.455 amostras anteriores de 1 minuto (`97 × 15`), sempre `source=SIMULATED`. Isso fornece os 96 buckets contínuos de 15 minutos exigidos pelo forecast, mais um bucket de alinhamento para a fronteira temporal. Os valores continuam sendo gerados pela mesma função determinística do perfil; a seed desloca a rampa em até três passos. Reaplicar cenário/seed preserva `appliedAt` e preenche amostras ausentes sem duplicar timestamps. A telemetria simulada não é medição do Aurora nem autoriza treinamento operacional do forecast. Um cenário online habilita a política de demanda persistida; um cenário offline conserva o estado da política. EV permanece calculado a partir de carregadores realmente energizados. Nenhum cenário cria sessão, pagamento, fila ou receita.

## Contrato/API e persistência

`POST /commercial/plants/:plantId/hardware` mantém o payload de sinais manuais já existente e também aceita `{ "scenarioId": LabScenarioId, "seed": number }`. Reaplicar o cenário/seed ativo é idempotente. `GET /commercial/plants/:plantId/energy` retorna `simulation` com o perfil persistido (ou `null`), além do snapshot e da decisão energética. O reset limpa configuração, telemetria, forecast e decisões derivados do Aurora, e reseta o marcador de geração em memória; não apaga catálogo. Não foi necessária migration: `provider_config` já é JSONB persistido.

Aplicar sinais manuais limpa os metadados do perfil e preserva o fluxo de configuração atual.

## Validação e documentação

- Unit: determinismo e transições dos perfis — passou.
- Integração API/repository: prefixo simulado, idempotência, leitura do cenário e retorno ao modo manual — passou dentro da suíte focal do repository.
- Regressão API/repository: `DEMAND_RAMP` produz forecast disponível e decisão crítica imediatamente após aplicação; reaplicação não duplica amostras e reset remove forecast — passou em `lab-forecast-history.test.ts`.
- Rota HTTP do cenário e `GET energy` — passou.
- Build `@chargegrid/shared` e `@chargegrid/api` — passou.
- Não houve alteração visual nem teste browser.

## Condição de parada

Parar se qualquer cenário escrever estado comercial ou se sinais simulados forem apresentados como medidos. Implementação concluída sem cruzar essa fronteira.

Commit: `feat(lab): add reproducible GoodWe energy profiles`.
