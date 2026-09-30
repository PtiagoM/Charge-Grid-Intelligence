# Especificações do ChargeGrid

Leia primeiro `docs/CURRENT_STATE.md`. Uma spec descreve comportamento implementável e não pode reabrir silenciosamente uma decisão posterior de produto.

## Specs atuais

| Spec | Estado | Escopo |
| --- | --- | --- |
| [`driver-pwa-mobile`](driver-pwa-mobile/spec.md) | implementada, com dependências externas | visitante, motorista, mapa, Supabase Auth, Stripe sandbox, fila, sessão e notificações |
| [`sprint4`](sprint4/spec.md) | em execução; M0–M4 e M5-U1/U2A/U2B/U2C concluídos | baseline S4-C1; próxima unidade obrigatória `S4-M5-U3` |
| [`sprint4-finalization`](sprint4-finalization/spec.md) | planejada; bloqueada até G7 do pacote anterior | extensão S4-C2: Dashboard, previsão, Decision Engine, laboratório, integração, estabilidade e entrega |

Antes de executar, ler a [ordem canônica da Sprint 4](SPRINT4_EXECUTION_ORDER.md). Primeiro concluir `sprint4` M5–M7; somente então iniciar `sprint4-finalization`. As specs históricas e o backlog abaixo não ampliam o escopo aprovado: autenticação administrativa nova, grants multi-organização, helpdesk, IV/bateria, expansão, offline avançado e cloud não são pré-requisitos. Nenhuma spec equivale a evidência de implementação.

> Próximo passo único: `S4-M5-U3`. `CG-F0-01` só se torna elegível após `S4-M7-U2/G7`.

## Fluxo para novas features

1. Copiar `_template` para `docs/specs/<feature>`.
2. Preencher `spec.md`, `acceptance.md` e `decisions.md`.
3. Referenciar `docs/CURRENT_STATE.md` e os contratos afetados.
4. Distinguir implementação local, integração real em sandbox e dependência ainda ausente.
5. Atualizar a spec no mesmo commit que muda o comportamento.

## Backlog documental atual

1. `supabase-commercial-persistence`
2. `stripe-webhook-reconciliation`
3. `goodwe-openapi-adapter`
4. `remote-web-push`
5. `admin-operational-api`
6. `session-lifecycle-server`
7. `queue-persistence`
8. `pricing-persistence`
9. `ai-prediction-contract`

Os nomes antigos `payment-mock` e `driver-discovery-map` não representam mais o estado atual: o mapa e o gateway Stripe sandbox já fazem parte da spec consolidada da Driver PWA.

