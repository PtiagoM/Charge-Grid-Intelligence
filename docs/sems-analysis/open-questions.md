# Perguntas abertas priorizadas

Questões abaixo não foram convertidas em fatos. Defaults são apenas caminhos seguros para prototipagem e não substituem decisão humana/homologação.

## P0 — bloqueiam integração ou segurança

| ID | Pergunta | Impacto | Responsável sugerido | Default seguro até decisão |
| --- | --- | --- | --- | --- |
| OQ-01 | qual identidade/SSO e escopo de organização/planta o módulo receberá do SEMS+? | autenticação, rotas, multi-planta e isolamento | GoodWe + arquitetura | adapter de identidade mockado; nenhuma sessão proprietária copiada |
| OQ-02 | quais campos EV/energia estão homologados por região, hardware e frescor? | status, demanda, sessão e sustentabilidade | GoodWe técnico | exibir indisponível/antigo; não inventar medição |
| OQ-03 | quais comandos podem ser usados e por quais papéis? | start/stop, demanda, auditoria e risco operacional | GoodWe + produto + segurança | somente start/stop documentados, simulados e pendentes até confirmação |
| OQ-04 | a planta compartilhada observada possui qualquer conexão externa real? | impede testes mutáveis de controle | dono do sandbox | manter `NOT TESTED — EXTERNAL IMPACT RISK` |
| OQ-05 | qual matriz final de capacidades para `GOODWE_ADMIN`, `ESTABLISHMENT_ADMIN` e `ESTABLISHMENT_OPERATOR`? | todas as ações sensíveis | produto + segurança | menor privilégio; operador sem tarifa, usuários, comissão ou política global |

## P1 — bloqueiam regras comerciais completas

| ID | Pergunta | Impacto | Responsável sugerido | Default seguro até decisão |
| --- | --- | --- | --- | --- |
| OQ-06 | qual modelo comercial definitivo substitui ou confirma a comissão demonstrativa? | KPIs, contrato e settlement | negócio/GoodWe | manter parâmetro claramente demonstrativo e configurável |
| OQ-07 | como calcular custo energético e quando usar a palavra lucro? | financeiro e relatórios | negócio/financeiro | exibir receita, taxas e líquido conhecido; não chamar de lucro sem custos completos |
| OQ-08 | qual gateway/fluxo produtivo, split, fiscalidade, chargeback e conciliação? | pagamento e live readiness | financeiro/jurídico/arquitetura | Stripe sandbox; nenhum live ou split presumido |
| OQ-09 | quais limiares/frescor definem `NORMAL`, `ALERT` e `CRITICAL`? | admissão e suspensão por demanda | energia/GoodWe/produto | fixtures configuráveis; bloqueio seguro se telemetria crítica estiver ausente |
| OQ-10 | qual regra promove/deduplica alarme GoodWe em incidente ChargeGrid? | suporte e notificações | operação + GoodWe | manter vínculo com origem e exigir impacto comercial identificável |
| OQ-11 | quais parâmetros finais de tarifa, limite e ociosidade são editáveis? | checkout, sessão e financeiro | produto/negócio | referências vigentes continuam demonstrativas/configuráveis |

## P2 — afetam escopo SHOULD e refinamento

| ID | Pergunta | Impacto | Responsável sugerido | Default seguro até decisão |
| --- | --- | --- | --- | --- |
| OQ-12 | quais relatórios/exportações entram na primeira release? | M8 e carga de dados | produto/operação | sessões, energia, financeiro e incidentes por período |
| OQ-13 | como recomendações ChargeGrid coexistem com o agente de IA GoodWe? | nomenclatura e responsabilidade | produto/GoodWe/IA | área separada, explicável e sem autoexecução |
| OQ-14 | mapa de rede entra no primeiro corte ou após planta/lista? | esforço visual e provider de mapas | produto | SHOULD; lista funciona sem mapa |
| OQ-15 | existe necessidade de entrada contextual para Diagnóstico IV/bateria? | navegação técnica | GoodWe/produto | `REFERENCE ONLY`, sem clone |
| OQ-16 | por que Editar/Excluir apareceram no EV compartilhado sem abrir edição? | interpretação do RBAC SEMS+ | GoodWe/sandbox | não usar como evidência de permissão; nenhuma ação no ativo |
| OQ-17 | edição, ativação/desativação ou arquivamento técnico de planta é relevante ao módulo? | fronteira do onboarding | produto/GoodWe | fora da camada comercial; somente vínculo/publicação ChargeGrid |

## Respondidas nesta análise

- Proprietário pôde criar e excluir planta própria controlada, iniciar adição de dispositivo, abrir compartilhamento, relatórios e assinaturas.
- Compartilhamento diferencia `Monitoramento` e `Monitoramento + Controle`, usuário/organização e prazo.
- Usuários organizacionais observados usam `ADMINISTRATOR` e `BROWSER`; esses nomes não substituem os papéis ChargeGrid.
- Existe taxonomia EV específica de falha/alarme/aviso e histórico de comandos Web/App.
- Relatórios possuem tarefa assíncrona e assinaturas semanais, mensais ou anuais.
- O projeto futuro não deve clonar o SEMS+ inteiro, criar Dashboard ChargeGrid independente ou alterar a Driver PWA.

## Registro de incerteza

- `OBSERVED`: somente o comportamento descrito no ledger.
- `INFERRED`: estratégia, encaixe e arquitetura derivados das evidências.
- `UNKNOWN`/`OPEN QUESTION`: itens desta lista até validação.
- `NOT TESTED — EXTERNAL IMPACT RISK`: controles e mutações de ativos preexistentes compartilhados.
