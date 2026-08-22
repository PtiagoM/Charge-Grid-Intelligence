# Especificações do ChargeGrid

Leia primeiro `docs/CURRENT_STATE.md`. Uma spec descreve comportamento implementável e não pode reabrir silenciosamente uma decisão posterior de produto.

## Specs atuais

| Spec | Estado | Escopo |
| --- | --- | --- |
| [`driver-pwa-mobile`](driver-pwa-mobile/spec.md) | implementada, com dependências externas | visitante, motorista, mapa, Supabase Auth, Stripe sandbox, fila, sessão e notificações |

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

