# ChargeGrid Intelligence — Contratos e Enums Compartilhados v1.0

**Status:** baseline funcional para SDD  
**Público:** desenvolvimento Admin Web, Driver PWA, ChargeGrid API, QA e demonstração  
**Data:** 19 de agosto de 2026  
**Precedência:** este documento operacionaliza o Documento Final de Produto v1.0. Em conflito, prevalecem: (1) Produto, (2) Stack e Arquitetura MVP, (3) este contrato.

> **Natureza deste artefato.** Esta é a especificação da linguagem comum do MVP, e não código, banco de dados ou contrato HTTP. Ela deve ser convertida posteriormente em enums, tipos, DTOs, fixtures e validações compartilhadas, sem reinterpretar regras de negócio.

## 1. Objetivo e escopo

O ChargeGrid possui duas experiências independentes — Admin Web e Driver PWA — e uma futura API que concentra as regras críticas. Os três consumidores precisam interpretar exatamente da mesma maneira o estado de uma sessão, uma cobrança, um carregador, uma fila e a condição energética da planta. Este documento evita que cada tela ou mock crie seu próprio significado para termos idênticos.

### 1.1 Camadas que dependem do contrato

| Camada | Uso do contrato | Não é responsabilidade desta camada |
|---|---|---|
| `packages/shared` futuro | Enums, tipos públicos, DTOs, constantes e erros sem segredo | Regra executável, acesso a banco ou credenciais |
| ChargeGrid API | Valida entrada/saída, produz estados e aplica regras | Expor payload bruto de fornecedor |
| Admin Web | Renderiza operação, financeiro, incidentes e configuração permitida | Decidir estados comerciais por conta própria |
| Driver PWA | Renderiza descoberta, fila, pagamento e somente a própria sessão | Ver dados administrativos ou de terceiros |
| Mock/fixtures | Produz dados tipados e coerentes para demo e testes | Fingir capacidade não documentada da GoodWe |
| QA/SDD | Define expectativas verificáveis de transição e visibilidade | Escolher tecnologia, endpoint ou schema SQL |

### 1.2 O que é compartilhado

- Vocabulário de domínio, valores de enum, labels de referência e relações entre entidades.
- DTOs de leitura e comando em nível de produto, com obrigatoriedade, origem e consumidor.
- Estados e transições permitidas de sessão, pagamento, fila, disponibilidade e demanda.
- Taxonomia de eventos e falhas que possam modificar a interface.
- Regras de compatibilidade e evolução de versão.

### 1.3 O que não é compartilhado

- Implementação TypeScript, componentes React, layout, Design System ou rotas de página.
- Endpoints REST, status HTTP definitivos, autenticação de transporte, JWT, RLS, SQL ou migrations.
- Credenciais GoodWe/gateway, payload externo bruto, segredos e detalhes internos dos adapters.
- Algoritmo de previsão, modelo de IA, cálculo interno de limiares ou mecanismo de polling.

### 1.4 Contrato público versus implementação interna

Um **contrato público** é estável e consumível por Admin, PWA ou fixture: por exemplo, `CommercialSession.status`, `Charger.technicalStatus` e `Payment.status`. Uma **implementação interna** é como a API obtém, persiste, deriva ou valida esse valor: por exemplo, a consulta a `vehConnectStatus`, uma tabela de eventos, uma retentativa de captura ou a regra que calcula a estimativa de espera. A implementação pode mudar sem alterar o contrato se preservar significado, campos obrigatórios e semântica.

## 2. Convenções transversais

### 2.1 Convenções de representação

- Valores de enum usam `UPPER_SNAKE_CASE`; labels de interface podem ser localizados e não são identificadores.
- IDs são opacos, estáveis e não carregam dados pessoais. Em demonstração, usam prefixos legíveis, como `sess_demo_001`.
- Todos os instantes usam ISO 8601 com offset da planta; o cenário de referência usa `America/Sao_Paulo` (`-03:00`).
- Valores monetários carregam moeda `BRL` e precisão de dois decimais no contrato de exibição. A regra de arredondamento e precisão interna ficam para SDD.
- Energia é expressa em `kWh`; potência, em `kW`; duração, em segundos nos dados de transporte e em minutos quando apresentada ao usuário.
- `null` significa desconhecido/não recebido; `0` significa medido ou calculado como zero. A PWA não deve transformar ausência de telemetria em consumo zero confirmado.

### 2.2 Marcação de origem

Cada campo relevante usa uma das origens abaixo. A origem descreve a fonte de verdade, não a tecnologia que transportou o valor.

| Origem | Significado | Exemplo |
|---|---|---|
| `GOODWE` | Telemetria, dispositivo, planta, alarme ou resultado técnico vindo/derivado da GoodWe | potência EV, conexão do veículo, último update técnico |
| `CHARGEGRID` | Política, estado comercial, fila, sessão, disponibilidade ou auditoria do produto | tarifa aceita, posição na fila, motivo de bloqueio |
| `PAYMENT_PROVIDER` | Confirmação de autorização, captura, Pix, devolução ou disputa | id externo, estado da transação |
| `AI` | Previsão ou recomendação não determinística | espera prevista, oportunidade de expansão |
| `DERIVED` | Cálculo explícito a partir de fontes conhecidas | custo acumulado, disponibilidade agregada |
| `DEMO_ONLY` | Valor sintético de protótipo sem integração produtiva | botão de cenário, falha simulada |

## 3. Vocabulário oficial

| Termo oficial | Definição operacional | Termos a evitar quando significarem a mesma entidade |
|---|---|---|
| **Estabelecimento** | Entidade comercial que oferece recarga, define políticas permitidas e opera uma ou mais plantas habilitadas. | loja, local, posto, cliente |
| **Planta** | Unidade energética/operacional GoodWe associada a dispositivos e telemetria. | site técnico, usina, instalação, quando usados como sinônimo comercial |
| **Carregador** | Dispositivo de recarga EV publicado para operação comercial. No demo, HCA G2 de referência de 7 kW. | estação, eletroposto, ponto, posto, conector |
| **Vaga** | Identificação física/operacional associada ao carregador para orientação do motorista. | spot, slot |
| **Sessão energética** | Intervalo em que há entrega de energia confirmada ao veículo. | recarga, consumo, quando se referir ao ciclo completo |
| **Sessão comercial** | Ciclo de intenção, garantia de pagamento, energia, ociosidade, cálculo e liquidação. Pode existir antes/depois da energia. | transação, recarga, pedido |
| **Tarifa** | Preço comercial de recarga definido pelo estabelecimento e aceito antes da sessão; não é a tarifa da distribuidora. | preço da energia, tarifa GoodWe |
| **Segmento tarifário** | Faixa temporal previamente informada que aplica uma tarifa a uma parcela da sessão. | preço dinâmico instantâneo |
| **Limite financeiro** | Valor máximo garantido pelo motorista para energia, ociosidade e demais itens permitidos. | saldo, teto, pré-pagamento, sem qualificação |
| **Pagamento** | Registro da garantia e/ou liquidação pelo meio escolhido. Uma sessão pode ter mais de uma tentativa/ação de pagamento. | cobrança, transação, sem distinguir estado |
| **Liquidação** | Consolidação financeira após custo final, captura ou devolução conforme meio. | pagamento final, settlement, sem contexto |
| **Fila** | Ordem de espera por estabelecimento para o primeiro carregador compatível; não é reserva antecipada. | reserva, agendamento |
| **Ociosidade** | Tempo após fim energético confirmado em que o veículo continua conectado, sujeito à tolerância e possível taxa. | multa, estacionamento, sem regra |
| **Disponibilidade técnica** | Condição de conectividade/uso/falha do equipamento derivada da fonte técnica. | disponibilidade comercial |
| **Disponibilidade comercial** | Possibilidade de iniciar uma nova sessão considerando técnica, horário, política, demanda, acesso e fila. | status do carregador, sem qualificação |
| **Estado energético da planta** | Sinal comercial `NORMAL`, `ALERT` ou `CRITICAL` que orienta admissão e preservação de sessões. | proteção elétrica, comando físico |
| **Incidente** | Registro rastreável de uma condição anormal técnica ou comercial que exige observação, ação ou reconciliação. | erro solto, alerta genérico |
| **Comando GoodWe** | Intenção ChargeGrid de executar uma ação técnica documentada via adapter, como `START_CHARGE` ou `STOP_CHARGE`. | ação instantânea confirmada |
| **Telemetria** | Observações técnicas com instante de atualização, sem inferir valores não recebidos. | dado comercial |
| **Recomendação** | Sugestão explicável para motorista, estabelecimento ou GoodWe; nunca substitui regra determinística. | decisão automática crítica |

## 4. Papéis de usuário

### 4.1 Enum `UserRole`

`GOODWE_ADMIN | ESTABLISHMENT_ADMIN | ESTABLISHMENT_OPERATOR | DRIVER | GUEST`

| Papel | Propósito e escopo de visualização | Ações permitidas | Limitações |
|---|---|---|---|
| `GOODWE_ADMIN` | Administração agregada da rede ChargeGrid: todas as plantas habilitadas, indicadores, comissão, incidentes e sinais de expansão. | Habilitar, suspender ou reativar planta; consultar rede; ajustar parâmetros globais autorizados; acessar suporte. | Não substitui configuração técnica do SEMS+/SolarGo; não executa rotina local sem justificativa/auditoria. |
| `ESTABLISHMENT_ADMIN` | Administração integral das próprias plantas e operação comercial. | Configurar tarifa, horários, ociosidade e políticas permitidas; publicar/retirar carregador; ver financeiro, relatórios, fila e operadores; solicitar comandos permitidos. | Não vê outras organizações nem altera comissão/política global GoodWe. |
| `ESTABLISHMENT_OPERATOR` | Operação local diária das plantas às quais foi atribuído. | Acompanhar estados, sessões, fila e incidentes; iniciar/parar somente quando política permitir; retirar equipamento de serviço. | Não altera tarifa, comissão, gateway, política financeira sensível ou acesso de administradores. |
| `DRIVER` | Motorista autenticado, com perfil, veículos e histórico próprios. | Ver mapa comercial, entrar na fila, iniciar sua sessão após garantia, acompanhar custo, fazer top-up, ver comprovantes e receber notificações. | Não vê dados administrativos, demais sessões nem transforma prioridade em reserva. |
| `GUEST` | Motorista sem conta persistente, identificado apenas pelo contexto temporário da sessão/QR. | Ver condições, definir limite, pagar e acompanhar a própria sessão pontual. | Não tem favoritos, veículo salvo, histórico persistente completo ou prioridade de fila. |

> **Nota de produto:** integrador/instalador continua importante no onboarding técnico, porém não recebe `UserRole` próprio nem aplicação ChargeGrid na v1.0.

## 5. Estados de carregador e disponibilidade

### 5.1 Enum técnico `ChargerTechnicalStatus`

Esse enum descreve o que a API publica após o GoodWe Adapter normalizar a fonte técnica. Ele não é o payload bruto externo. A relação com `vehConnectStatus` é um mapeamento de referência: `0` desconectado, `1` veículo conectado/aguardando e `2` carregando, quando esse campo estiver disponível para o dispositivo. Ausência de telemetria, alarme e resultado de comando podem prevalecer sobre essa inferência.

| Valor | Significado | Entrada típica | Saída típica | Relação de referência com `vehConnectStatus` |
|---|---|---|---|---|
| `AVAILABLE` | Online, sem veículo conectado e sem falha conhecida; tecnicamente apto a iniciar. | leitura disponível e conexão desconectada | veículo conecta, comando inicia, falha/offline | `0` |
| `CONNECTED` | Veículo conectado, mas sem entrega confirmada de energia. Pode corresponder a espera, início, fim energético ou ociosidade. | conexão do veículo confirmada | início de carga, desconexão, falha/offline | `1` |
| `STARTING` | Início foi solicitado e ainda aguarda confirmação técnica. | `START_CHARGE` aceito pelo fluxo comercial | `CHARGING`, `AVAILABLE`, `CONNECTED`, `FAULT` ou `OFFLINE` | não deve ser inferido somente de `vehConnectStatus` |
| `CHARGING` | Há entrega/estado de carga confirmado pela fonte técnica. | conexão/carga confirmada | fim energético, stop, falha, offline | `2` |
| `UNAVAILABLE` | Equipamento conhecido, mas retirado de serviço técnico ou sem condição declarada de operação. | manutenção técnica ou condição reportada | volta a leitura elegível ou falha/offline | não depender apenas do campo |
| `FAULT` | Falha/alarme técnico impede ou torna insegura a operação comercial. | alarme, resultado de comando ou estado técnico de falha | recuperação técnica confirmada ou offline | não depender apenas do campo |
| `OFFLINE` | Sem conectividade/telemetria confiável dentro da política de frescor definida pelo SDD. | timeout técnico ou fonte indisponível | nova leitura válida | indeterminado |

**Regra de segurança:** `STARTING` é uma representação de operação assíncrona; não afirma que a energia já começou. `OFFLINE` não autoriza inferir desconexão, energia zero ou fim de sessão.

### 5.2 Enum comercial por carregador `ChargerCommercialStatus`

O estado comercial interpreta a elegibilidade para uma nova sessão naquele carregador. É produzido pelo ChargeGrid a partir de estado técnico, sessão, horário, política de demanda e publicação. Não substitui o estado técnico.

`AVAILABLE_TO_START | OCCUPIED | RESTRICTED_BY_ENERGY | MAINTENANCE | FAULTED | CLOSED | UNKNOWN`

| Valor | Quando usar | Exemplos |
|---|---|---|
| `AVAILABLE_TO_START` | Está publicado, aberto, tecnicamente disponível e permitido iniciar nova sessão. | `AVAILABLE` técnico em planta `NORMAL`. |
| `OCCUPIED` | Há sessão em andamento, veículo conectado ou fase de ociosidade. | `CHARGING` ou `CONNECTED` com sessão ativa. |
| `RESTRICTED_BY_ENERGY` | A regra comercial bloqueia novos inícios, apesar de o carregador poder estar online. | Planta em `ALERT`/`CRITICAL`; limite EV atingido. |
| `MAINTENANCE` | Retirado da oferta por manutenção comercial programada. | Equipamento tecnicamente online, mas não publicado. |
| `FAULTED` | Falha técnica relevante impede oferta. | `FAULT` ou `OFFLINE` técnico. |
| `CLOSED` | Estabelecimento fechado, acesso restrito ou publicação suspensa. | Horário encerrado com carregador online. |
| `UNKNOWN` | Não há dados suficientes para afirmar disponibilidade comercial. | Telemetria crítica indisponível antes de iniciar. |

### 5.3 Enum agregado `CommercialAvailability`

A disponibilidade comercial é publicada principalmente para o **estabelecimento** no mapa e na listagem; pode também ser derivada para uma planta quando houver relação 1:1. Não deve ser usada como sinônimo de `ChargerTechnicalStatus`.

`OPEN_AVAILABLE | OPEN_PARTIAL | FULL_QUEUE | CLOSED | MAINTENANCE | FAULT`

| Valor | Critério de produto | Comportamento de interface |
|---|---|---|
| `OPEN_AVAILABLE` | Aberto e pelo menos um carregador comercialmente apto, sem necessidade imediata de fila. | Convida a iniciar ou navegar até o local. |
| `OPEN_PARTIAL` | Aberto com oferta reduzida: há ao menos um caminho de atendimento, mas capacidade limitada, ocupação ou restrição. | Mostra capacidade parcial e contexto de espera. |
| `FULL_QUEUE` | Aberto, sem vaga apta no momento e fila ativa/necessária. | Permite entrar na fila se elegível; não promete vaga. |
| `CLOSED` | Não aceita novas sessões por horário, acesso, suspensão ou política comercial. | Permanece visível quando aplicável, com motivo. |
| `MAINTENANCE` | Operação comercial temporariamente removida por manutenção planejada. | Não autoriza sessão; comunica previsão se houver. |
| `FAULT` | Não existe rota comercial segura no momento devido a falha/offline relevante. | Não inicia; comunica indisponibilidade e incidente quando autorizado. |

**Exemplo obrigatório:** um HCA G2 pode estar tecnicamente `AVAILABLE`, mas comercialmente `MAINTENANCE` ou `CLOSED`; portanto, estar online não significa estar vendável. Inversamente, `FULL_QUEUE` pode ocorrer com todos os equipamentos tecnicamente saudáveis.

## 6. Sessão comercial

### 6.1 Enum `CommercialSessionStatus`

```text
SESSION_CREATED -> AWAITING_PAYMENT -> AUTHORIZED -> WAITING_START
-> STARTING -> CHARGING -> ENERGY_FINISHED -> IDLE_GRACE_PERIOD
-> IDLE_FEE -> SETTLING -> COMPLETED
```

Estados de exceção podem ser alcançados conforme a tabela abaixo. `COMPLETED`, `CANCELLED` e `FAULTED` encerram a progressão normal de energia; `SETTLEMENT_PENDING`, `DISPUTED` e `OUTSTANDING_BALANCE` preservam uma obrigação comercial aberta até resolução.

| Estado | Tipo | Significado e origem | Próximos permitidos | Visível para | Admin | PWA | Label de referência |
|---|---|---|---|---|---|---|---|
| `SESSION_CREATED` | transitório | Intenção validada e contexto de carregador/motorista criado pelo ChargeGrid; ainda sem garantia. | `AWAITING_PAYMENT`, `CANCELLED` | administrador e motorista originador | sim | própria | Sessão criada |
| `AWAITING_PAYMENT` | ativo | Limite, meio e condições são apresentados; aguarda garantia do gateway. | `AUTHORIZED`, `PAYMENT_FAILED`, `CANCELLED` | motorista originador e operação | sim | própria | Aguardando pagamento |
| `AUTHORIZED` | transitório | Cartão pré-autorizado ou Pix pré-pago confirmado; energia ainda não foi liberada. | `WAITING_START`, `START_FAILED`, `CANCELLED` | motorista originador e operação | sim | própria | Pagamento garantido |
| `WAITING_START` | ativo | Garantia válida; admissão comercial e/ou compatibilidade aguardam início. | `STARTING`, `SUSPENDED_BY_DEMAND`, `CANCELLED`, `START_FAILED` | motorista originador e operação | sim | própria | Aguardando início |
| `STARTING` | transitório | ChargeGrid solicitou `StartCharge`; aguarda resultado assíncrono da fonte técnica. | `CHARGING`, `START_FAILED`, `FAULTED`, `CANCELLED` | motorista originador e operação | sim | própria | Iniciando recarga |
| `CHARGING` | ativo | Entrega de energia confirmada pela telemetria/estado técnico. | `SUSPENDED_BY_DEMAND`, `ENERGY_FINISHED`, `FAULTED`, `OUTSTANDING_BALANCE` | motorista originador e operação | sim | própria | Carregando |
| `SUSPENDED_BY_DEMAND` | ativo/exceção controlada | Estado **comercial** de sessão afetada pela política de demanda. Na v1, não significa `PauseCharge`: a ação física permitida é `StopCharge`; o retorno exige novo `StartCharge` após validação. | `WAITING_START`, `STARTING`, `ENERGY_FINISHED`, `FAULTED`, `CANCELLED`, `OUTSTANDING_BALANCE` | motorista originador e operação | sim | própria | Pausada por demanda |
| `ENERGY_FINISHED` | transitório | Entrega cessou de modo confirmado por limite, veículo, motorista, stop por demanda ou operador. | `IDLE_GRACE_PERIOD`, `SETTLING`, `FAULTED` | motorista originador e operação | sim | própria | Energia finalizada |
| `IDLE_GRACE_PERIOD` | ativo | Veículo ainda conectado após fim energético; tolerância gratuita está correndo. | `IDLE_FEE`, `SETTLING`, `FAULTED`, `OUTSTANDING_BALANCE` | motorista originador e operação | sim | própria | Retire o veículo — tolerância |
| `IDLE_FEE` | ativo | Veículo continua conectado após tolerância e cobra-se tempo conforme política. | `SETTLING`, `OUTSTANDING_BALANCE`, `FAULTED` | motorista originador e operação | sim | própria | Cobrança de ociosidade |
| `SETTLING` | transitório | Valor final calculado; captura, devolução ou liberação está em curso. | `COMPLETED`, `SETTLEMENT_PENDING`, `DISPUTED`, `OUTSTANDING_BALANCE` | motorista originador e operação | sim | própria | Finalizando pagamento |
| `COMPLETED` | terminal | Sessão e liquidação concluídas ou devolução confirmada quando aplicável. | `DISPUTED` somente por evento posterior | motorista originador e operação | sim | própria/histórico | Concluída |
| `PAYMENT_FAILED` | exceção terminal pré-energia | A garantia falhou ou expirou; nenhuma energia é liberada. | nova sessão, não transição interna | motorista originador e operação | sim | própria | Pagamento não aprovado |
| `START_FAILED` | exceção terminal pré-energia | Comando não foi confirmado e a garantia deve ser liberada/devolvida conforme meio. | nova sessão, não transição interna | motorista originador e operação | sim | própria | Não foi possível iniciar |
| `FAULTED` | exceção terminal de energia | Falha técnica antes/durante operação; cobra somente consumo confirmado, sem iniciar ociosidade pela falha. | `SETTLING`, `SETTLEMENT_PENDING`, `COMPLETED` conforme financeiro | motorista originador e operação | sim | própria | Encerrada por falha |
| `CANCELLED` | terminal | Cancelamento antes da energia ou encerramento autorizado registrado. | `SETTLING` se houver valor confirmado; caso contrário, fim | motorista originador e operação | sim | própria | Cancelada |
| `SETTLEMENT_PENDING` | exceção ativa | Valor final conhecido, mas gateway não confirmou captura/devolução/liquidação. | `SETTLING`, `COMPLETED`, `DISPUTED`, `OUTSTANDING_BALANCE` | motorista originador e operação | sim | própria | Pagamento em processamento |
| `DISPUTED` | exceção ativa | Contestação posterior reabre a transação; auditoria é preservada. | `COMPLETED`, `OUTSTANDING_BALANCE` ou resolução definida no SDD | operação e motorista afetado | sim | própria | Em contestação |
| `OUTSTANDING_BALANCE` | exceção ativa | Valor devido excede garantia disponível ou não foi recuperado. Bloqueia nova sessão do motorista cadastrado até regularização. | `SETTLING`, `COMPLETED`, `DISPUTED` | operação e motorista afetado | sim | própria | Saldo pendente |

### 6.2 Regras de transição e encerramento

- `SUSPENDED_BY_DEMAND` não representa uma capacidade nativa de pausa. A interface deve informar que a recarga foi interrompida por proteção comercial de demanda e aguarda nova admissão.
- `ENERGY_FINISHED` só ocorre após evidência técnica de cessação da entrega ou encerramento confirmado. O ChargeGrid não cria consumo durante perda de comunicação.
- Ociosidade só começa após `ENERGY_FINISHED` confirmado e veículo ainda conectado. Falha, perda de telemetria e suspensão por demanda sem fim energético confirmado não iniciam cobrança.
- Uma sessão não volta de `COMPLETED` para `CHARGING`; uma nova recarga é uma nova sessão comercial, ainda que use o mesmo veículo/carregador.

## 7. Pagamento e liquidação

### 7.1 Enum `PaymentStatus`

`PENDING | AUTHORIZED | PAID | REFUND_PENDING | REFUNDED | FAILED | SETTLEMENT_PENDING | DISPUTED | OUTSTANDING_BALANCE`

| Estado | Significado | Cartão | Pix | Relação típica com sessão |
|---|---|---|---|---|
| `PENDING` | Meio escolhido, aguardando confirmação do gateway. | autorização em processamento | pagamento ainda não confirmado | `AWAITING_PAYMENT` |
| `AUTHORIZED` | Limite garantido sem captura final. | pré-autorização válida | não usar para Pix pré-pago confirmado | `AUTHORIZED`, `WAITING_START`, `CHARGING` |
| `PAID` | Valor capturado/pago e confirmado. | captura final confirmada | Pix recebido e, se não houver saldo a devolver, consolidado | `SETTLING` ou `COMPLETED` |
| `REFUND_PENDING` | Devolução de saldo/valor foi solicitada e aguarda confirmação. | estorno quando aplicável | devolução de saldo não usado | `SETTLING` |
| `REFUNDED` | Devolução confirmada. | estorno integral/parcial confirmado | saldo Pix devolvido confirmado | `COMPLETED` ou resolução de exceção |
| `FAILED` | Autorização, captura ou Pix não confirmou. | falha de pré-autorização/captura | Pix expirado/não pago | `PAYMENT_FAILED` ou `SETTLEMENT_PENDING` |
| `SETTLEMENT_PENDING` | Valor final existe, mas reconciliação/captura/devolução permanece pendente. | captura assíncrona/retentativa | devolução ou conciliação pendente | `SETTLEMENT_PENDING` |
| `DISPUTED` | Contestação/chargeback em análise. | contestação do cartão | disputa tratada pelo processo definido | `DISPUTED` |
| `OUTSTANDING_BALANCE` | Parte devida não está coberta/confirmada. | limite insuficiente ou captura parcial | saldo pago insuficiente | `OUTSTANDING_BALANCE` |

### 7.2 Conceitos obrigatórios

- **Cartão:** `AUTHORIZED` representa pré-autorização do limite; a captura ocorre sobre o devido confirmado; o saldo não capturado é liberado. O suporte exato do gateway é pendência de SDD.
- **Pix:** é pré-pagamento do limite. O valor não consumido segue para `REFUND_PENDING` e `REFUNDED` quando houver devolução confirmada.
- **Pagamento não é igual a liquidação:** `PAID` pode existir enquanto a sessão ainda calcula o valor final; `COMPLETED` exige o desfecho comercial coerente.
- **Top-up:** adiciona/renova garantia válida; não altera retroativamente tarifa nem energia já medida.

## 8. Fila

### 8.1 Enum `QueueStatus`

`WAITING | CALLED | ASSIGNED | EXPIRED | LEFT | COMPLETED`

| Estado | Significado | Próximos permitidos | Interface |
|---|---|---|---|
| `WAITING` | Entrada ativa, aguardando carregador compatível. | `CALLED`, `LEFT`, `EXPIRED` | posição, estimativa e classe; PWA vê só a própria entrada |
| `CALLED` | Usuário foi chamado e tem 10 minutos para comparecer/iniciar fluxo. | `ASSIGNED`, `EXPIRED`, `LEFT` | prazo absoluto, lembrete aos 5 min restantes |
| `ASSIGNED` | Carregador compatível foi associado para continuidade do pagamento/início. | `COMPLETED`, `LEFT`, `EXPIRED` | identifica carregador/vaga quando permitido |
| `EXPIRED` | Prazo de chamada acabou; perde a vez. | fim; nova entrada começa ao fim da fila | motivo e ação “entrar novamente” |
| `LEFT` | Usuário saiu voluntariamente antes de atendimento. | fim | confirmação de saída |
| `COMPLETED` | A entrada resultou em sessão iniciada ou atendimento concluído pelo fluxo. | fim | histórico simples para motorista; auditoria no admin |

### 8.2 Regras imutáveis de negócio

- A fila é por **estabelecimento**, atendida pelo primeiro carregador compatível; não é reserva de conector.
- Ordem de prioridade: `DRIVER` cadastrado antes de `GUEST`; dentro da mesma classe, FIFO pelo `joinedAt`.
- Um motorista possui no máximo uma entrada ativa (`WAITING`, `CALLED` ou `ASSIGNED`) em toda a operação ChargeGrid.
- O chamado possui janela de 10 minutos. Expiração perde a vez e nova entrada vai ao fim da classe correspondente.
- Uma nova chegada não ultrapassa quem já está `CALLED`.
- A estimativa é determinística na v1 e rotulada como previsão; uma IA futura pode enriquecê-la, nunca garanti-la.

## 9. Estado energético da planta

### 9.1 Enum `PlantEnergyStatus`

`NORMAL | ALERT | CRITICAL`

| Estado | Significado comercial | Novas sessões | Sessões existentes | Limite de responsabilidade ChargeGrid |
|---|---|---|---|---|
| `NORMAL` | Envelope energético permite admissão conforme regras usuais. | Podem iniciar após pagamento e elegibilidade. | Seguem normalmente. | Observa/deriva sinais e registra decisão; não controla proteção elétrica. |
| `ALERT` | Há pressão de demanda ou redução de margem que exige cautela comercial. | Restringir novos inícios conforme política local. | Preservar as existentes sempre que possível. | Não promete limitar potência individual nem resposta instantânea. |
| `CRITICAL` | Não há margem comercial segura para novos inícios; pode exigir redução de carga. | Bloquear novos inícios. | Se necessário, escolher sessões para `StopCharge` pela prioridade definida e registrar `SUSPENDED_BY_DEMAND`. | A infraestrutura elétrica/GoodWe mantém proteções físicas, controles estruturais e confirmação técnica. |

### 9.2 Prioridade de redução de carga

Em `CRITICAL`, a regra comercial candidata primeiro sessões de visitante e, dentro dessa classe, a mais recente; depois sessões de cadastrados, também da mais recente para a mais antiga. O comando continua assíncrono e pode falhar. A UI não pode exibir uma interrupção como concluída antes da confirmação técnica.

## 10. Entidades e DTOs mínimos

As descrições abaixo definem formato lógico. “Obrigatório” significa necessário quando a entidade é emitida; campos podem ser omitidos de uma projeção resumida definida no SDD.

| Entidade | Finalidade e consumidor principal | Campos obrigatórios | Opcionais relevantes | Origem dominante / observações |
|---|---|---|---|---|
| `UserProfile` | Identidade e autorização para Admin/API. | `id`, `role`, `displayName`, `organizationId`, `status` | `avatarUrl`, `lastLoginAt` | `CHARGEGRID`; nunca incluir segredo ou dados de pagamento. |
| `DriverProfile` | Preferências e elegibilidade do motorista; PWA. | `userId`, `accountStatus`, `queuePriorityClass` | `defaultVehicleId`, `blockedReason`, `notificationPreferences` | `CHARGEGRID`; visitante não exige perfil persistente. |
| `Vehicle` | Veículo associado a motorista; PWA. | `id`, `ownerDriverId`, `displayName` | `batteryCapacityKwh`, `currentSocPercent`, `connectorInfo` | `CHARGEGRID`; SOC é informado/simulado, não telemetria GoodWe. |
| `Establishment` | Oferta comercial, políticas e localização; Admin/PWA. | `id`, `name`, `plantIds`, `timezone`, `publicAccess`, `openingHours`, `commercialAvailability` | endereço público, contato, imagem, regras de acesso | `CHARGEGRID` + `DERIVED`; não expor endereço privado a público não autorizado. |
| `EstablishmentSummary` | Card de mapa/listagem PWA. | `id`, `name`, `commercialAvailability`, `availableChargerCount`, `queueSummary` | distância, tarifa a partir de, condição favorável | `DERIVED`; sem financeiro interno. |
| `Plant` | Referência da unidade GoodWe; Admin. | `id`, `establishmentId`, `name`, `energyStatus`, `operationalEvLimitKw` | localização técnica, status de onboarding | `GOODWE` + `CHARGEGRID`; manter distinção de IDs externo/interno no SDD. |
| `PlantEnergySnapshot` | Leitura energética pontual; Admin e sessão. | `plantId`, `observedAt`, `pvKw`, `gridImportKw`, `buildingLoadKw`, `evLoadKw`, `energyStatus` | bateria carga/descarga, exportação, frescor | `GOODWE` + `DERIVED`; não inventar termos ausentes. |
| `Charger` | Detalhe técnico/comercial por carregador; Admin/PWA contextual. | `id`, `plantId`, `commercialName`, `nominalPowerKw`, `technicalStatus`, `commercialStatus`, `lastTechnicalUpdateAt` | `vehicleConnectionStatus`, vaga, falha, sessão ativa | `GOODWE` + `CHARGEGRID`; payload bruto não vaza. |
| `ChargerSummary` | Estado compacto para dashboard/lista. | `id`, `commercialName`, `technicalStatus`, `commercialStatus` | potência atual, vaga, sessão resumida | `DERIVED`; não expor motorista de terceiros na PWA. |
| `CommercialSession` | Registro completo do ciclo comercial; API/Admin. | `id`, `driverRef`, `chargerId`, `establishmentId`, `status`, `createdAt`, `acceptedTariffPolicyId`, `financialLimit` | motivo de término, segmentos, auditoria, incidentes | `CHARGEGRID`; compõe medição GoodWe e pagamento. |
| `ActiveSession` | Projeção ao vivo da própria sessão; PWA/Admin. | `sessionId`, `status`, `chargerId`, `energyDeliveredKwh`, `costEstimate`, `updatedAt` | potência atual, tolerância/ociosidade, top-up elegível | `DERIVED`; custo é estimativa até liquidação. |
| `Payment` | Registro de garantia/captura/devolução; Admin e PWA da própria sessão. | `id`, `sessionId`, `method`, `status`, `currency`, `authorizedAmount` | `capturedAmount`, `refundedAmount`, `providerReference`, falha | `PAYMENT_PROVIDER` + `CHARGEGRID`; mascarar identificadores. |
| `PaymentSummary` | Situação financeira legível para sessão. | `paymentStatus`, `financialLimit`, `amountDue`, `amountPaid` | devolução prevista, pendência, próximo passo | `DERIVED`; PWA vê apenas sua sessão. |
| `TariffPolicy` | Política comercial aceita/publicável. | `id`, `establishmentId`, `currency`, `basePricePerKwh`, `effectiveFrom`, `segments` | limites min/máx, condição solar, versão | `CHARGEGRID`; não confundir com tarifa de distribuidora. |
| `TariffSegment` | Faixa temporal de preço previsível. | `id`, `startAt`, `endAt`, `pricePerKwh`, `label` | motivo exibível, condição aplicada | `CHARGEGRID`; só segmentar sessão quando informado antes do aceite. |
| `QueueEntry` | Posição e chamada de uma pessoa. | `id`, `establishmentId`, `driverRef`, `priorityClass`, `status`, `joinedAt` | posição, espera, chamado, expiração, carregador atribuído | `CHARGEGRID` + `DERIVED`; PWA só vê a própria entrada. |
| `QueueSummary` | Fila agregada de estabelecimento; mapa/dashboard. | `establishmentId`, `activeCount`, `commercialAvailability` | espera estimada, por classe, limite | `DERIVED`; não publicar identidade de quem aguarda. |
| `IdlePolicy` | Política de tolerância e taxa. | `establishmentId`, `gracePeriodMinutes`, `feePerMinute`, `maxFeeMinutes`, `enabled` | limites impostos pela plataforma, versão | `CHARGEGRID`. |
| `Notification` | Mensagem rastreável a uma pessoa/papel. | `id`, `recipientRef`, `type`, `title`, `createdAt`, `readStatus` | corpo, deep-link, expiração, prioridade | `CHARGEGRID`; não substitui canal de entrega. |
| `Incident` | Caso operacional para suporte/admin. | `id`, `severity`, `status`, `createdAt`, `scopeType`, `scopeId`, `summary` | última telemetria, sessão afetada, resolução | `CHARGEGRID` + `GOODWE`; suporte técnico continua GoodWe/integrador. |
| `GoodWeCommand` | Solicitação auditável ao adapter. | `id`, `type`, `targetChargerId`, `requestedAt`, `requestedBy`, `status` | motivo, sessão vinculada, correlação externa | `CHARGEGRID`; tipos v1: `START_CHARGE` e `STOP_CHARGE`. A consulta interna de resultado não é um comando de produto. |
| `GoodWeCommandResult` | Resultado normalizado do comando. | `commandId`, `status`, `observedAt` | código/mensagem externa sanitizada, `completedAt` | `GOODWE`; sucesso de transporte não substitui confirmação de carga. |
| `PredictionSummary` | Previsão/recomendação opcional; Admin/PWA quando permitida. | `kind`, `generatedAt`, `confidenceLabel`, `isFallback` | valor previsto, explicação, janela temporal | `AI` ou `DERIVED`; nunca bloqueia operação. |
| `DashboardKpis` | KPIs coerentes com o papel/escopo. | `scope`, `period`, `generatedAt` | sessões, energia, receita, disponibilidade, fila, incidentes | `DERIVED`; campos detalhados por projeção. |
| `GoodWeNetworkKpis` | Visão agregada GoodWe. | `activePlants`, `commercialChargers`, `sessionsCount`, `grossRevenue`, `chargegridCommission` | saturação, oportunidades, indisponibilidade | `DERIVED`; exclusivo `GOODWE_ADMIN`. |
| `EstablishmentKpis` | Visão do operador/administrador local. | `establishmentId`, `period`, `activeSessions`, `energyDeliveredKwh`, `grossRevenue`, `netFinancialAmount` | ticket médio, fila, ociosidade, estado energético | `DERIVED`; não representa lucro sem custo energético/operacional completo. |

## 11. Eventos de domínio relevantes para frontend

Os eventos são nomes conceituais para atualização, auditoria, fixture e testes. A arquitetura MVP não exige Kafka, fila distribuída ou event sourcing.

| Evento | Originador típico | Quem deve refletir | Efeito visual mínimo |
|---|---|---|---|
| `SESSION_CREATED` | ChargeGrid Core | Admin local; PWA originadora | nova sessão em preparação |
| `PAYMENT_AUTHORIZED` | Payment Adapter/Core | Admin local; PWA originadora | garantia confirmada e avanço para início |
| `PAYMENT_FAILED` | Payment Adapter/Core | Admin local; PWA originadora | erro acionável; nenhum início |
| `SESSION_START_REQUESTED` | Core/operador | Admin; PWA originadora | estado `STARTING` e indicador de aguardo |
| `SESSION_STARTED` | GoodWe Adapter + Core | Admin; PWA originadora | `CHARGING`, potência/energia quando disponíveis |
| `SESSION_STOPPED` | GoodWe Adapter/Core | Admin; PWA originadora | fim energético ou suspensão com motivo |
| `SESSION_COMPLETED` | Core/Payment Adapter | Admin; PWA originadora/histórico | comprovante e total consolidado |
| `ENERGY_STATE_CHANGED` | regra Core a partir de telemetria | Admin local; PWA afetada | `NORMAL`/`ALERT`/`CRITICAL` com impacto explicado |
| `CHARGER_STATUS_CHANGED` | GoodWe Adapter | Admin; PWA contextual | status técnico/comercial atualizado |
| `CHARGER_FAULTED` | GoodWe Adapter/Core | Admin; PWA afetada e descoberta | indisponibilidade, incidente e tratamento financeiro |
| `QUEUE_JOINED` | Core | Admin local; PWA originadora | posição e estimativa |
| `QUEUE_CALLED` | Core | Admin local; PWA originadora | janela de 10 minutos e lembrete |
| `QUEUE_EXPIRED` | Core | Admin local; PWA originadora | perda de vez e opção de reentrada |
| `IDLE_STARTED` | Core após fim energético confirmado | Admin; PWA originadora | início de tolerância/contador |
| `IDLE_FEE_STARTED` | Core | Admin; PWA originadora | valor/minuto e tempo cobrado |
| `SETTLEMENT_PENDING` | Payment Adapter/Core | Admin; PWA originadora | pendência, sem afirmar cobrança concluída |
| `PAYMENT_REFUNDED` | Payment Adapter | Admin; PWA originadora | devolução confirmada |
| `INCIDENT_CREATED` | Core/adapter/operador | Admin conforme escopo | severidade, contexto e próximo responsável |

## 12. Erros e estados de falha compartilhados

`DomainErrorCode` descreve a causa estável para interface e testes. A API poderá mapeá-lo a HTTP no SDD sem alterar o significado.

| Código | Uso | Resposta visual recomendada |
|---|---|---|
| `VALIDATION_ERROR` | Dados incompletos/inválidos ou transição não permitida. | Corrigir campo e preservar contexto. |
| `UNAUTHORIZED` | Não há identidade/sessão válida. | Solicitar autenticação quando aplicável. |
| `FORBIDDEN` | Identidade válida sem permissão para recurso/ação. | Informar limite sem expor dado restrito. |
| `CHARGER_UNAVAILABLE` | Carregador não pode iniciar comercialmente. | Mostrar motivo e alternativa/fila quando houver. |
| `PAYMENT_REQUIRED` | Não há garantia válida antes da energia. | Voltar ao limite/meio de pagamento. |
| `PAYMENT_FAILED` | Gateway recusou/expirou garantia ou operação. | Permitir nova tentativa; não iniciar. |
| `START_FAILED` | StartCharge não confirmou sucesso. | Comunicar falha e tratamento da garantia. |
| `GOODWE_UNAVAILABLE` | Adapter/fonte GoodWe indisponível para ação crítica. | Bloquear novo início e explicar monitoramento. |
| `TELEMETRY_UNAVAILABLE` | Não há dado fresco para medir/decidir. | Exibir indisponibilidade; não inventar consumo. |
| `SESSION_NOT_FOUND` | Sessão inexistente ou fora do escopo. | Encaminhar a estado seguro/lista. |
| `QUEUE_EXPIRED` | A chamada venceu. | Exibir reentrada ao fim da fila. |
| `INTERNAL_ERROR` | Falha não classificável sem expor detalhe interno. | Mensagem segura e incidente/log. |

## 13. Versionamento e evolução no SDD

1. A linha `v1.0` é compatível enquanto campos obrigatórios e valores de enum existentes preservarem significado.
2. Adicionar campo opcional é alteração menor; Admin/PWA devem ignorar campos desconhecidos de modo seguro.
3. Adicionar valor de enum exige fallback visual `UNKNOWN`/“Estado não disponível” antes de ser usado em produção/demo.
4. Remover, renomear, tornar obrigatório ou alterar semântica exige versão maior, plano de migração e atualização coordenada dos dois frontends.
5. Labels podem evoluir; identificadores de enum não. Nunca persistir label de UI como fonte de verdade.
6. Mock, API e fixtures devem declarar a mesma versão de contrato em metadado simples (`contractVersion`).
7. Qualquer campo reclassificado de `DEMO_ONLY` para `GOODWE` ou `PAYMENT_PROVIDER` requer evidência de integração e atualização explícita da matriz de capacidades.

## 14. Fora deste documento

- Código TypeScript, pacotes reais, cliente HTTP e implementação de mocks.
- Endpoints, schema SQL, RLS, migrations, persistência, idempotência detalhada e observabilidade interna.
- Componentes, tela, navegação, Design System GoodWe e conteúdo visual.
- Contrato de inferência, algoritmo, features, treinamento ou governança da IA.
- Escolha de gateway, regras fiscais, LGPD, antifraude, chargeback e contratos financeiros produtivos.
- Qualquer capacidade GoodWe não documentada: `SetPowerLimit`, `PauseCharge`, `ResumeCharge`, balanceamento fino, OCPP ou integração multi-fabricante.

## 15. Decisões mínimas registradas e pendências para SDD

### Decisão mínima adicionada

Para evitar sobrecarga de `ChargerTechnicalStatus`, este contrato introduz `ChargerCommercialStatus` como projeção ChargeGrid por carregador. `CommercialAvailability` permanece a projeção agregada para estabelecimento/planta. A decisão não altera o produto; apenas torna implementável a separação já definida entre disponibilidade técnica e comercial.

### Pendências que o SDD deve especificar

- Formato exato de identificadores, paginação, filtros, HTTP e autenticação de transporte.
- Limiar numérico/frescor que transforma telemetria em `OFFLINE`, `ALERT` ou `CRITICAL`.
- Precisão monetária, impostos, arredondamento, top-up, retentativa e política de reconciliação.
- Compatibilidade por conector/veículo, limite financeiro min/max e políticas por estabelecimento.
- Projeções exatas de dados por papel e política de retenção/LGPD.

## Apêndice A — Tabela consolidada de enums

| Enum | Valores |
|---|---|
| `UserRole` | `GOODWE_ADMIN`, `ESTABLISHMENT_ADMIN`, `ESTABLISHMENT_OPERATOR`, `DRIVER`, `GUEST` |
| `ChargerTechnicalStatus` | `AVAILABLE`, `CONNECTED`, `STARTING`, `CHARGING`, `UNAVAILABLE`, `FAULT`, `OFFLINE` |
| `ChargerCommercialStatus` | `AVAILABLE_TO_START`, `OCCUPIED`, `RESTRICTED_BY_ENERGY`, `MAINTENANCE`, `FAULTED`, `CLOSED`, `UNKNOWN` |
| `CommercialAvailability` | `OPEN_AVAILABLE`, `OPEN_PARTIAL`, `FULL_QUEUE`, `CLOSED`, `MAINTENANCE`, `FAULT` |
| `CommercialSessionStatus` | `SESSION_CREATED`, `AWAITING_PAYMENT`, `AUTHORIZED`, `WAITING_START`, `STARTING`, `CHARGING`, `SUSPENDED_BY_DEMAND`, `ENERGY_FINISHED`, `IDLE_GRACE_PERIOD`, `IDLE_FEE`, `SETTLING`, `COMPLETED`, `PAYMENT_FAILED`, `START_FAILED`, `FAULTED`, `CANCELLED`, `SETTLEMENT_PENDING`, `DISPUTED`, `OUTSTANDING_BALANCE` |
| `PaymentStatus` | `PENDING`, `AUTHORIZED`, `PAID`, `REFUND_PENDING`, `REFUNDED`, `FAILED`, `SETTLEMENT_PENDING`, `DISPUTED`, `OUTSTANDING_BALANCE` |
| `QueueStatus` | `WAITING`, `CALLED`, `ASSIGNED`, `EXPIRED`, `LEFT`, `COMPLETED` |
| `PlantEnergyStatus` | `NORMAL`, `ALERT`, `CRITICAL` |
| `DomainErrorCode` | `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `CHARGER_UNAVAILABLE`, `PAYMENT_REQUIRED`, `PAYMENT_FAILED`, `START_FAILED`, `GOODWE_UNAVAILABLE`, `TELEMETRY_UNAVAILABLE`, `SESSION_NOT_FOUND`, `QUEUE_EXPIRED`, `INTERNAL_ERROR` |

## Apêndice B — Entidades, fonte e consumidor

| Grupo | Entidades | Frontend que consome | Backend que produz |
|---|---|---|---|
| Identidade | `UserProfile`, `DriverProfile`, `Vehicle` | Admin conforme papel; PWA própria | Auth/Core |
| Oferta | `Establishment`, `EstablishmentSummary`, `Plant`, `Charger`, `ChargerSummary` | Admin e PWA em projeções diferentes | GoodWe Adapter + Core |
| Energia | `PlantEnergySnapshot`, `PredictionSummary` | Admin; PWA apenas contexto permitido | GoodWe Adapter, regras, IA opcional |
| Operação | `CommercialSession`, `ActiveSession`, `QueueEntry`, `QueueSummary`, `IdlePolicy`, `Incident`, `Notification` | Admin; PWA somente recursos próprios | Core |
| Financeiro | `Payment`, `PaymentSummary`, `TariffPolicy`, `TariffSegment` | Admin; PWA própria sessão/condições | Core + Payment Adapter |
| Gestão | `DashboardKpis`, `GoodWeNetworkKpis`, `EstablishmentKpis`, `GoodWeCommand`, `GoodWeCommandResult` | Admin por escopo | Core + Adapter |

## Apêndice C — Matriz “frontend consome / backend produz”

| Informação | GoodWe Admin | Estabelecimento Admin/Operador | Driver PWA | Origem final |
|---|---:|---:|---:|---|
| Telemetria detalhada da planta | vê | vê própria planta | não vê, salvo contexto da própria sessão | `GOODWE` |
| Estado técnico de carregador | vê | vê própria planta | vê somente contexto público/da sessão | `GOODWE`/`DERIVED` |
| Disponibilidade comercial | vê | vê própria planta | vê estabelecimentos públicos | `CHARGEGRID`/`DERIVED` |
| Sessões | vê rede conforme permissão | vê próprias plantas | vê apenas próprias | `CHARGEGRID` |
| Pagamento e comprovante | vê agregados/auditoria autorizada | vê próprias sessões | vê apenas próprios | `PAYMENT_PROVIDER`/`CHARGEGRID` |
| Fila | vê agregada | vê operação local | vê somente própria posição/estado | `CHARGEGRID`/`DERIVED` |
| KPIs e comissão | vê rede e comissão | vê financeiro local, sem parâmetros globais | não vê | `DERIVED` |
| Recomendação/IA | vê agregada quando habilitada | vê própria operação | vê recomendação de escolha, sem dados internos | `AI`/`DERIVED` |
