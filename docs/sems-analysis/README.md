# Análise autorizada do SEMS+

**Status:** Fases 0–7 concluídas em 22/08/2026; modelo de produto refinado em 23/08/2026. Consultar `docs/admin-dashboard/PRODUCT_DECISIONS.md` para as decisões vigentes posteriores à auditoria.

## Executive summary

O SEMS+ oferece um antecedente forte para shell, navegação, plantas, dispositivos, energia, alarmes, relatórios, usuários, temas e auditoria. Ele não oferece como equivalentes completos as entidades comerciais centrais do ChargeGrid: sessão, fila, tarifa de recarga, pagamento, liquidação, ociosidade, disponibilidade comercial, lucro/comissão ou recomendação preditiva operacional.

A decisão vigente é preservar a experiência técnica SEMS+ reconstruída e incorporar o ChargeGrid como camada aditiva por planta. Habilitar a camada não troca o shell, não remove funções técnicas e não converte automaticamente todas as plantas da conta. A arquitetura interna continua modular, com GoodWe como verdade técnico-energética, ChargeGrid como verdade comercial e gateway + ChargeGrid como verdade financeira.

O corte mínimo é:

```text
shell/RBAC
→ planta comercial
→ EV Chargers, sessões e fila
→ energia e demanda
→ tarifa e financeiro
→ incidentes e auditoria
```

Relatórios, mapa completo, assinaturas e IA são incrementos planejados. Criação técnica de planta, diagnóstico IV, bateria e inventário genérico servem como referência; firmware/configuração elétrica, Centro de Serviço e Driver PWA ficam fora do escopo.

## Metodologia

```text
reconhecimento amplo
→ evidência estruturada
→ aprofundamento orientado ao ChargeGrid
→ consolidação
→ escopo e jornadas
→ arquitetura e plano
```

- leitura integral do contexto obrigatório, com precedência de `docs/CURRENT_STATE.md`;
- exploração de dois papéis efetivos: `Distribuidor/Instalador` e `Proprietário`;
- observação seletiva de shell, páginas, componentes, estados e permissões;
- mutações controladas somente em entidade própria `CG_ANALYSIS_*`;
- classificação `OBSERVED`, `TESTED IN SANDBOX`, `INFERRED`, `UNKNOWN`, `OPEN QUESTION` ou `NOT TESTED — EXTERNAL IMPACT RISK`;
- screenshots seletivos, rotas sanitizadas e evidências por ID;
- cruzamento com produto, contratos, arquitetura e design system vigentes.

## Cobertura e resultados

- dois papéis e dois viewports desktop;
- temas claro e escuro;
- sete entradas-raiz e navegação contextual de planta/dispositivo;
- planta própria vazia, criação C&I, validação assíncrona, detalhe, compartilhamento e exclusão;
- EV Charger, telemetria, histórico de carga/controle e erro de identificação controlado;
- energia, demanda, geração, consumo, bateria, rede e sustentabilidade;
- alarmes EV, assinaturas, usuários, organizações, logs, relatórios e tarefas assíncronas;
- matriz SEMS+ × ChargeGrid, escopo final proposto, sete jornadas, arquitetura híbrida e dez milestones;
- 9 capturas sanitizadas no manifest.

A entidade de teste criada foi excluída e a busca posterior confirmou ausência. Nenhum dispositivo, usuário, compartilhamento ou assinatura permaneceu criado.

## Limitações

- O sandbox não comprova integração GoodWe/OpenAPI, SSO, backend RBAC ou hardware real.
- Ações em planta/EV compartilhados preexistentes não foram executadas por risco de impacto externo.
- A presença de Editar/Excluir na UI não provou permissão efetiva.
- Estados produtivos de pagamento, settlement, fila, ociosidade, demanda e IA não existem como equivalentes observados no SEMS+; são regras ChargeGrid documentadas.
- Viewports mobile/tablet e todos os estados visuais futuros ainda precisam de baseline no projeto reconstruído.
- Nenhuma inferência foi apresentada como comportamento confirmado do SEMS+.

## Entregáveis

| Entregável | Documento |
| --- | --- |
| metodologia, síntese e limites | este `README.md` |
| ledger de evidências | [evidence-ledger.md](evidence-ledger.md) |
| sitemap e navegação | [sitemap.md](sitemap.md), [navigation.md](navigation.md) |
| catálogo de páginas e fluxos | [pages.md](pages.md), [flows.md](flows.md) |
| entidades e permissões | [entities.md](entities.md), [permissions.md](permissions.md) |
| componentes e estados | [components.md](components.md), [states.md](states.md) |
| matriz SEMS+ × ChargeGrid | [chargegrid-fit.md](chargegrid-fit.md) |
| escopo MUST/SHOULD/REFERENCE/OUT | [scope-candidates.md](scope-candidates.md) |
| jornadas administrativas | [journeys.md](journeys.md) |
| arquitetura e estratégia | [architecture-proposal.md](architecture-proposal.md) |
| decisões vigentes da camada comercial | [../admin-dashboard/PRODUCT_DECISIONS.md](../admin-dashboard/PRODUCT_DECISIONS.md) |
| milestones | [implementation-plan.md](implementation-plan.md) |
| validação visual | [visual-validation-plan.md](visual-validation-plan.md) |
| perguntas priorizadas | [open-questions.md](open-questions.md) |
| screenshots | [screenshots/manifest.md](screenshots/manifest.md) |

## Fronteiras e precedência

- `docs/CURRENT_STATE.md` prevalece em conflitos.
- `docs/admin-dashboard/PRODUCT_DECISIONS.md` registra as decisões explícitas de 23/08/2026 e prevalece sobre inferências anteriores desta auditoria dentro do seu escopo.
- A decisão histórica de Dashboard ChargeGrid independente está superada.
- A fila vigente é exclusiva para usuários autenticados; a regra histórica que incluía visitante não orienta o novo projeto.
- A Driver PWA permanece separada e congelada.
- Nenhum código proprietário foi obtido ou inspecionado.

## Confirmação de não implementação

Esta missão alterou somente `docs/sems-analysis/`. Não foram modificados Dashboard, Driver PWA, API, banco, estilos ou componentes; não foi criado scaffold do clone.
