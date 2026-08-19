# Especificações do ChargeGrid

Toda feature começa com uma pasta própria baseada em `_template`. A spec detalha a implementação sem alterar decisões congeladas de Produto, Arquitetura ou Contratos.

## Fluxo mínimo

1. Copiar `_template` para `docs/specs/<nome-da-feature>`.
2. Preencher `spec.md`, `acceptance.md` e `decisions.md` antes da implementação.
3. Referenciar os documentos superiores e os dados Demo afetados.
4. Manter critérios de aceite e decisões locais atualizados no PR.

## Candidatos iniciais

1. `driver-qr-charge-flow`
2. `driver-discovery-map`
3. `admin-operational-dashboard`
4. `session-lifecycle`
5. `goodwe-mock-adapter`
6. `payment-mock`
7. `demand-control`
8. `queue-management`
9. `pricing`
10. `ai-prediction-contract`

## Ownership sugerido

| Responsável | Área principal |
|---|---|
| Dev 1 | Admin Web |
| Dev 2 | Driver PWA |
| Dev 3 | Core / Session Lifecycle |
| Dev 4 | GoodWe / Payment / Demand / integrações |
| Responsável IA | AI contract + treinamento/inferência |

Ownership reduz conflitos, mas não cria exclusividade: contratos e revisão pertencem ao time.
