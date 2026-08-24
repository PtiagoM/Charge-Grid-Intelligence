# Escopo proposto — SEMS+ com módulo ChargeGrid

**Status:** classificação final desta análise. As decisões de produto continuam subordinadas a `docs/CURRENT_STATE.md`.

**Classificação da síntese:** `INFERRED`, confiança alta, com base no inventário SEMS+ e nas regras vigentes do ChargeGrid. A existência de uma página no SEMS+ não é motivo suficiente para reconstruí-la.

## Critério

- `MUST IMPLEMENT`: indispensável para a experiência administrativa coerente e para uma regra vigente do ChargeGrid.
- `SHOULD IMPLEMENT`: agrega valor relevante, mas pode entrar após o fluxo principal.
- `PRESERVE SEMS+`: função técnica que permanece na experiência SEMS+ e não deve ser removida ou substituída pela camada comercial.
- `REFERENCE ONLY`: orienta linguagem, integração ou comportamento; não deve ser clonada como página completa.
- `OUT OF SCOPE`: não pertence ao novo projeto ou conflita com a fronteira vigente.

## Matriz de escopo

| Página/capacidade | Classificação | Ator principal | Justificativa | Dependências | Evidência SEMS+ | Regra ChargeGrid |
| --- | --- | --- | --- | --- | --- | --- |
| shell, navegação, conta e temas | `MUST IMPLEMENT` | todos os papéis administrativos | faz o ChargeGrid parecer parte do SEMS+ | identidade, escopo, tokens e rotas | SEMS-SHELL-002; SEMS-THEME-001 | módulo incorporado; claro e escuro |
| home administrativa e KPIs por escopo | `MUST IMPLEMENT` | consultor/gestor GoodWe; Central GoodWe; estabelecimento | oferece entrada por responsabilidade sem trocar o shell | projeções por papel, escopo e período | SEMS-DASH-001/002 | carteira/região/parceiro; `EstablishmentKpis` por planta autorizada |
| lista e detalhe de planta comercial | `MUST IMPLEMENT` | consultor GoodWe; estabelecimento; operador | planta é o contexto técnico e comercial comum | GoodWe Adapter + contrato/vínculo/perfil comercial | SEMS-PLANT-001..004; SEMS-ENERGY-002 | GoodWe é verdade técnica; ChargeGrid adiciona perfil somente à planta contratada |
| onboarding comercial de planta existente | `MUST IMPLEMENT` | estabelecimento admin; consultor GoodWe | vincula contrato por planta sem duplicar comissionamento | contrato externo, código, membership, validação, EV e políticas | SEMS-PLANT-005..007 como referência | contrato → código → vínculo → perfil → revisão → publicar |
| criação técnica de usina SEMS+ | `PRESERVE SEMS+` | instalador/proprietário | fluxo técnico continua disponível e independente da camada comercial | contexto GoodWe | SEMS-PLANT-005/006 | criar planta não a torna comercial |
| inventário genérico de dispositivos | `PRESERVE SEMS+` | usuário técnico autorizado | inversor, dongle, HomeKit e EV continuam como inventário técnico SEMS+ | projeção GoodWe | SEMS-DEVICE-001/004 | ChargeGrid apenas enriquece carregadores de plantas contratadas |
| inventário e detalhe de EV Charger | `MUST IMPLEMENT` | GoodWe conforme escopo; estabelecimento; operador | ponte direta entre telemetria e operação comercial | `Charger`, status técnico/comercial e frescor | SEMS-EV-001/002 | disponibilidade técnica ≠ comercial |
| sessões e recargas | `MUST IMPLEMENT` | estabelecimento; operador; GoodWe agregado por escopo | ciclo comercial não existe como equivalente completo no SEMS+ | sessão, pagamento, telemetria e comandos assíncronos | SEMS-EV-001 como sinal parcial | máquina de estados de `CommercialSession` |
| fila operacional | `MUST IMPLEMENT` | estabelecimento; operador | contexto obrigatório da operação administrativa | elegibilidade, disponibilidade e chamadas | nenhum equivalente observado | fila por estabelecimento e exclusiva para autenticados |
| tarifa e ociosidade | `MUST IMPLEMENT` | estabelecimento admin | define condições aceitas e monetização após fim energético | política versionada, sessão e relógio confiável | receita energética é apenas referência: SEMS-ENERGY-002 | preço transparente; 15 min e taxa demonstrativa configurável |
| pagamentos, liquidação, receita e comissão | `MUST IMPLEMENT` | estabelecimento admin; GoodWe agregado autorizado | mantém a verdade financeira e separa receita de energia de receita comercial | gateway, conciliação e RBAC | SEMS-REPORT-002/003 como padrão de relatório/tarefa | gateway + ChargeGrid; comissão demonstrativa parametrizada |
| energia, sustentabilidade e controle de demanda | `MUST IMPLEMENT` | estabelecimento; operador; GoodWe conforme responsabilidade | usa energia como evidência sem assumir SLA/proteção elétrica | `PlantEnergySnapshot`, regras e GoodWe Adapter | SEMS-ENERGY-001/002 | `NORMAL/ALERT/CRITICAL`; visão comercial prioriza exceções/oportunidades |
| alarmes técnicos e incidentes comerciais | `MUST IMPLEMENT` | operador; estabelecimento; GoodWe conforme escopo | conecta diagnóstico técnico à resolução operacional | correlação alarme–planta–carregador–sessão | SEMS-ALARM-001/002; SEMS-EV-003 | incidente não substitui alarme GoodWe |
| trilha de comandos e auditoria | `MUST IMPLEMENT` | usuário com capacidade explícita | comandos são assíncronos e precisam de autoria, motivo e resultado | gateway/GoodWe, RBAC e logs | SEMS-EV-002; SEMS-ORG-001 | v1 limitada a start/stop documentados |
| relatórios, exportações e tarefas | `SHOULD IMPLEMENT` | GoodWe por escopo; estabelecimento admin | importante para operação e financeiro, sem bloquear o primeiro fluxo vertical | agregações e geração assíncrona | SEMS-REPORT-001..003 | projeções por papel e dados financeiros autorizados |
| assinaturas e notificações administrativas | `SHOULD IMPLEMENT` | estabelecimento admin; operador | padrão útil para incidentes e relatórios | canais, destinatários e preferências | SEMS-SUBSCRIPTION-001/002 | notificações rastreáveis; sem expor dados fora do escopo |
| organização, usuários e RBAC do módulo | `MUST IMPLEMENT` | Central/gestor GoodWe autorizado; estabelecimento admin | garante escopo por organização, planta e capacidade | Auth, RLS/policies e matriz de ações | SEMS-USER-001/002; SEMS-PERM-001/002 | papel × escopo × capacidade; membership comercial por planta |
| mapa de plantas comerciais | `SHOULD IMPLEMENT` | GoodWe por carteira/região; estabelecimento multi-planta | facilita rede e seleção sem carregar payload técnico bruto | projeção sanitizada por planta | SEMS-DASH-001/002 | DTO de mapa derivado e sem financeiro privado |
| IA preditiva e recomendações | `SHOULD IMPLEMENT` | GoodWe por escopo; estabelecimento | orienta demanda, ocupação e expansão, sem bloquear operação | dados suficientes, fallback determinístico e explicação | agente/ferramentas analíticas: SEMS-ANALYSIS-001 | IA opcional, explicável e não autoritativa |
| Diagnóstico IV e Consistência da bateria | `PRESERVE SEMS+` | usuário técnico autorizado | diagnóstico técnico permanece disponível e não é substituído pela camada comercial | SEMS+/GoodWe | SEMS-ANALYSIS-001 | ChargeGrid pode apenas criar entrada contextual quando útil |
| Comparação de dados SEMS+ | `PRESERVE SEMS+` | usuário técnico autorizado | análise técnica permanece no SEMS+ | projeções analíticas | SEMS-ANALYSIS-001 | ChargeGrid adiciona métricas comerciais sem remover as técnicas |
| Centro de serviço, garantia e RMA | `PRESERVE SEMS+` | GoodWe/parceiros | suporte técnico continua no ecossistema existente | SEMS+/encaminhamento externo | SEMS-SHELL-002 | ChargeGrid acompanha incidente, não recria nem remove RMA |
| atualização de firmware/dispositivo e configuração elétrica | `PRESERVE SEMS+` | instalador/GoodWe autorizado | responsabilidade técnica continua fora da camada comercial | SEMS+/SolarGo | SEMS-PLANT-003/004 | ChargeGrid não substitui comissionamento ou proteção elétrica |
| Driver PWA | `OUT OF SCOPE` | motorista/visitante | aplicação separada e congelada nesta etapa | contratos somente | fronteira documental SEMS-CONTEXT-001 | não alterar UI, UX, jornadas, funções ou regras da PWA |

## Corte mínimo coerente

```text
shell e RBAC
→ portfólio/planta comercial
→ EV Chargers + sessões + fila
→ energia/demanda
→ tarifa + financeiro
→ incidentes + auditoria
```

Relatórios, mapa completo, assinaturas e IA podem seguir como incrementos sem invalidar esse núcleo.
