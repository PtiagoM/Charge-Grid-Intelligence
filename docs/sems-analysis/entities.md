# Entidades observadas e fronteiras de domínio

| Entidade | Relações observáveis | Atributos/estados visíveis | Classificação |
| --- | --- | --- | --- |
| Conta | pertence a papel e escopo | papel, modo de visualização, preferências | `OBSERVED`, alta |
| Papel | condiciona conteúdo e contexto | Distribuidor/Instalador; Proprietário | `OBSERVED`, alta |
| Organização | contém usuários e plantas próprias | nome, dados cadastrais, usuários | `OBSERVED`, alta; dados cadastrais não capturados |
| Planta | contém dispositivos e alarmes | própria/compartilhada, em construção/em operação, capacidade e energia | `OBSERVED`, alta |
| Dispositivo | pertence a planta | tipo, status, potência, energia e identificação técnica | `OBSERVED`, alta |
| EV Charger | especialização de dispositivo | inativo, conectividade, porta, energia carregada e histórico de carga | `OBSERVED`, alta |
| Inversor | especialização de dispositivo | operacional, tipo armazenamento/terceiro | `OBSERVED`, média |
| Alarme | relacionado a planta/dispositivo | status, severidade, ocorrência, resolução e confirmação | `OBSERVED`, alta |
| Relatório | agrega planta ou dispositivo | modelo, assinatura e área de downloads | `OBSERVED`, alta |
| Métrica energética | pertence a planta/dispositivo/período | potência, geração, consumo, bateria, rede, receita energética | `OBSERVED`, alta |
| Usuário organizacional | pertence a organização | tipo de conta, habilitação e operação | `OBSERVED`, alta; valores não capturados |
| Log de operação | registra ator e ação | módulo, tipo, operador e data | `OBSERVED`, alta |
| Assinatura | relaciona notificação, plantas e destinatários | tipo, ativação, pontualidade e configuração | `OBSERVED`, média |
| Compartilhamento de planta | relaciona planta a usuário ou organização | monitoramento/controle, prazo e operação | `OBSERVED`, alta |
| Tarefa de download | materializa relatório ou exportação assíncrona | nome, tipo, progresso, estado, data e solicitante | `OBSERVED`, alta |
| Registro de controle | relaciona dispositivo, comando, origem e resultado | modo de carga, potência, SOC, Web/App, sucesso | `OBSERVED`, alta |
| Tipo de alarme EV | pertence a severidade e componente EV | falha, alarme ou aviso; latência de notificação | `OBSERVED`, alta |

## Decisões de identidade posteriores à observação

- permanecem os tipos de conta SEMS+ `Proprietário` e `Distribuidor/Instalador`;
- a conta profissional depende de aprovação/código organizacional;
- `Usuário comercial` não é novo tipo de conta: é uma projeção derivada dos vínculos comerciais ativos por planta;
- compartilhamento técnico SEMS+ e acesso comercial ChargeGrid são relações independentes.

Sessão comercial, tarifa de recarga, pagamento, liquidação, lucro, comissão, fila, ociosidade, recomendação de IA e incidente ChargeGrid ainda não foram observados como entidades equivalentes do SEMS+ nesta fase.

## Relações observadas consolidadas

```text
Organização → usuários e plantas próprias
Planta → dispositivos, métricas, alarmes, relatórios e compartilhamentos
EV Charger → telemetria, registros de carga, alarmes e registros de controle
Assinatura → plantas + tipos de evento/relatório + canais + destinatários
Relatório → seleção de plantas/dispositivos → tarefa de download
```

## Entidades ChargeGrid necessárias, não observadas como equivalentes

| Grupo | Entidades | Fonte de verdade | Classificação |
| --- | --- | --- | --- |
| oferta comercial | `Establishment`, disponibilidade comercial e políticas | ChargeGrid + projeção GoodWe | `INFERRED`, alta |
| operação | `CommercialSession`, `QueueEntry`, `IdlePolicy`, `Incident` | ChargeGrid, com telemetria GoodWe correlacionada | `INFERRED`, alta |
| financeiro | `Payment`, `TariffPolicy`, `TariffSegment` | gateway + ChargeGrid | `INFERRED`, alta |
| energia derivada | `PlantEnergySnapshot`, `PlantEnergyStatus` | GoodWe + regras derivadas | `INFERRED`, alta |
| comando | `GoodWeCommand`, `GoodWeCommandResult` | ChargeGrid solicita; GoodWe confirma | `INFERRED`, média |
| predição | `PredictionSummary` | IA/cálculo derivado | `INFERRED`, média |

## Entidades comerciais confirmadas em 23/08/2026

| Entidade | Relação/regra | Fonte de verdade |
| --- | --- | --- |
| `Establishment` | parte contratante; pode possuir várias plantas comerciais | ChargeGrid + sistema comercial |
| `CommercialContract` | cobre exatamente uma planta; mantém histórico e somente uma vigência ativa por operação | sistema contratual; projeção ChargeGrid |
| `ActivationCase` | acompanha contrato, validação técnica, resgate, configuração, revisão e publicação | ChargeGrid |
| `ActivationInvite` | código temporário, único, revogável e auditável; vinculado a contrato/estabelecimento/consultor | ChargeGrid |
| `PlantCommercialLink` | liga uma planta SEMS+ a estabelecimento e contrato sem duplicar a planta | ChargeGrid + referência GoodWe |
| `CommercialPlantMembership` | concede capacidade comercial a usuário/organização somente naquela planta | ChargeGrid/Auth |
| `CommercialProfile` | horários, acesso, tarifa, disponibilidade e publicação | ChargeGrid |
| `ConsultantAssignment` | liga usuário GoodWe a carteira, região, parceiro, contrato ou ativação | ChargeGrid/CRM |
| `GoodWePortfolio` | agrupa estabelecimentos/plantas sob responsabilidade comercial | CRM/ChargeGrid |
| `ExpansionOpportunity` | registra oportunidade comercial explicável no estabelecimento/planta | CRM/ChargeGrid |

```text
Conta SEMS+
└── acessos técnicos por propriedade/compartilhamento

Estabelecimento
└── contratos (um por planta)
    └── PlantCommercialLink → Plant SEMS+
        └── perfil comercial → carregadores elegíveis/publicados

Usuário
└── CommercialPlantMembership por planta
```

Não criar `GoodWePlant`, `GoodWeDevice` ou cópias equivalentes. IDs externos SEMS+ permanecem referências; a verdade técnica continua na GoodWe.

Essas entidades vêm dos contratos vigentes do produto. Não são alegações sobre o modelo interno do SEMS+.
