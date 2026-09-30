# Especificações do ChargeGrid

Leia primeiro `docs/CURRENT_STATE.md`. Uma spec descreve comportamento implementável e não pode reabrir silenciosamente uma decisão posterior de produto.

## Specs atuais

| Spec | Estado | Escopo |
| --- | --- | --- |
| [`sprint4-finalization`](sprint4-finalization/spec.md) | planejada; somente SDDs nesta etapa | unidades finais pós-M4: Dashboard, previsão, Decision Engine, laboratório, integração, estabilidade e entrega |
| [`driver-pwa-mobile`](driver-pwa-mobile/spec.md) | implementada, com dependências externas | visitante, motorista, mapa, Supabase Auth, Stripe sandbox, fila, sessão e notificações |
| [`sprint4`](sprint4/spec.md) | especificação executável; código não implementado nesta etapa | contrato comum, decisões, aceites e unidades dos Marcos 0–7; Aurora e núcleo final aprovado |

Para executar a Sprint 4, começar por `sprint4/spec.md`. As specs históricas e o backlog abaixo não ampliam o escopo aprovado: autenticação administrativa nova, grants multi-organização, helpdesk, IV/bateria, expansão, offline avançado e cloud não são pré-requisitos. D1–D4 prevalecem; nenhuma spec equivale a evidência de implementação.

> O pacote `sprint4` preserva o contrato e o histórico executado até M4. O pacote `sprint4-finalization` é a fila vigente do trabalho restante e prevalece para novas execuções.

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

