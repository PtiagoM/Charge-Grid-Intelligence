# ChargeGrid Intelligence — Cenário Compartilhado de Demonstração v1.0

**Status:** fonte das fixtures D0–D15 para Admin/testes e referência de domínio para a Driver PWA  
**Contrato relacionado:** Contratos e Enums Compartilhados v1.0  
**Data-base do replay:** 19 de agosto de 2026, `America/Sao_Paulo` (`-03:00`)  
**Natureza:** dados e eventos simulados; não são operação, cobrança ou telemetria produtiva.

> **Aplicabilidade atual — 21/08/2026:** este documento continua sendo a fonte das fixtures D0–D15 do Admin e dos testes compartilhados. A Driver PWA possui um catálogo comercial próprio com seis plantas e usa Stripe real em modo teste. A natureza de fixture deve permanecer em documentação/código e não deve ser exibida como aviso na interface do usuário.

> **Regra central histórica:** o cenário preserva coerência de domínio entre Admin, contratos e testes. Ele não obriga o catálogo atual da Driver PWA a reproduzir cada registro D0. O Mock GoodWe continua sendo a fonte técnica de referência; pagamentos da PWA usam Stripe sandbox.

## 1. Objetivo, limites e modo de uso

Este documento define uma única fotografia inicial (`D0`) e uma biblioteca de transições controladas (`D1` a `D15`). Ele permite criar mocks tipados, seeds e um futuro controlador de demonstração sem construir backend real, Supabase ou integração externa nesta etapa.

- Os dados devem ser coerentes entre si, mas todos os IDs, nomes, endereços e transações são fictícios.
- A telemetria de planta e carregadores é **simulada no protótipo**, ainda que sua estrutura siga o domínio documentado da GoodWe.
- `StartCharge` e `StopCharge` são as únicas intenções técnicas demonstráveis como capacidades GoodWe documentadas; no cenário, os resultados e delays são simulados.
- As tabelas deste cenário para pagamento, fila, tarifação, ociosidade, comissão, liquidação e disponibilidade são fixtures de referência. A Driver PWA chama Stripe em modo teste; fila, tarifa e sessão ainda usam estado local.
- Nenhum cenário representa `PauseCharge`, `ResumeCharge`, ajuste contínuo de potência ou `SetPowerLimit` como recurso existente da GoodWe.

## 2. Estabelecimento principal

| Campo | Valor demonstrativo |
|---|---|
| Nome comercial | **Hub Solar Aurora** |
| `establishmentId` | `est_demo_aurora_001` |
| Natureza | estabelecimento comercial fictício com recarga pública de oportunidade |
| Endereço exibível | Avenida das Energias, 700 — Distrito Solar, São Paulo — SP (fictício) |
| Timezone | `America/Sao_Paulo` |
| Horário público | segunda a sábado, 08:00–22:00 |
| Acesso | público; QR por carregador; sem reserva antecipada |
| Planta associada | `plant_demo_aurora_001` |
| Carregadores publicados | 6 HCA G2 de referência, 7 kW nominais cada |
| Disponibilidade em D0 | `OPEN_PARTIAL` |
| Motivo da parcialidade | 2 carregando, 1 em ociosidade/tolerância, 1 disponível, 1 em falha e 1 em manutenção comercial |

## 3. Planta GoodWe de referência

### 3.1 Perfil da planta

| Campo | Valor demonstrativo | Origem no demo |
|---|---:|---|
| `plantId` | `plant_demo_aurora_001` | `DEMO_ONLY` com formato GoodWe compatível |
| Tipo | C&I, solar + bateria + rede + carga predial + recarga EV | contexto de produto |
| Limite operacional EV | 28,0 kW | `CHARGEGRID` configurado no onboarding |
| Potência instalada dos carregadores | 42,0 kW (6 × 7 kW) | equipamento de referência |
| Estado energético inicial | `NORMAL` | `DERIVED` no demo |
| Momento inicial | 2026-08-19T17:45:00-03:00 | `DEMO_ONLY` |

### 3.2 Snapshot energético D0 — balanço obrigatório

| Termo | Valor (kW) | Observação |
|---|---:|---|
| PV | 36,0 | geração local simulada |
| Importação da rede | 18,0 | rede supre o restante necessário |
| Descarga da bateria | 0,0 | não há descarga neste snapshot |
| **Oferta total** | **54,0** | `36,0 + 18,0 + 0,0` |
| Carga do prédio | 42,0 | consumo predial simulado |
| Carga EV | 12,0 | 6,2 kW no CG-01 + 5,8 kW no CG-02 |
| Carga da bateria | 0,0 | não há carga neste snapshot |
| Exportação para rede | 0,0 | não há excedente exportado |
| **Demanda total** | **54,0** | `42,0 + 12,0 + 0,0 + 0,0` |

```text
PV (36,0) + Grid Import (18,0) + Battery Discharge (0,0)
= Building Load (42,0) + EV Load (12,0) + Battery Charge (0,0) + Grid Export (0,0)
= 54,0 kW = 54,0 kW
```

**Leitura de produto:** o limite EV de 28,0 kW é uma regra comercial/operacional demonstrativa, não uma alegação de proteção elétrica, limite nativo do HCA G2 ou capacidade de ajuste contínuo da GoodWe.

## 4. Perfil tarifário demonstrativo

### 4.1 Política `tariff_demo_aurora_v1`

| Elemento | Regra demonstrativa |
|---|---|
| Moeda | `BRL` |
| Tarifa-base comercial | R$ 2,00/kWh |
| Condição favorável solar | R$ 1,90/kWh entre 08:00 e 17:59, quando a oferta comercial estiver ativa |
| Condição de pico programada | R$ 2,30/kWh entre 18:00 e 21:59 |
| Próxima mudança em D0 | 18:00: R$ 1,90/kWh → R$ 2,30/kWh |
| Transparência | segmentos são exibidos antes do aceite; mudança solar/demanda após início não reprifica energia já iniciada sem segmento aceito |
| Não permitido | fila, lotação ou prioridade não criam surge pricing |

### 4.2 Segmentos publicados no momento D0

| Segmento | Início | Fim | Preço | Uso no demo |
|---|---|---|---:|---|
| `SOLAR_FAVORAVEL` | 08:00 | 17:59 | R$ 1,90/kWh | sessões D0 e exemplos históricos diurnos |
| `PICO_PROGRAMADO` | 18:00 | 21:59 | R$ 2,30/kWh | sessão D1 atravessa este marco, se permanecer ativa |
| `FORA_DE_PICO` | 22:00 | 07:59 | R$ 2,00/kWh | referência, não usada na sequência principal |

## 5. Carregadores — estado inicial D0

Todos são carregadores de referência HCA G2 / 7 kW nominais. `technicalStatus` representa telemetria técnica normalizada; `commercialStatus` e disponibilidade são ChargeGrid.

| ID | Nome/vaga | Nominal | `technicalStatus` | `vehConnectStatus` ref. | `commercialStatus` | Sessão D0 | Falha/manutenção | Última atualização |
|---|---|---:|---|---:|---|---|---|---|
| `charger_demo_01` | Aurora 01 / A01 | 7,0 kW | `CHARGING` | 2 | `OCCUPIED` | `sess_demo_001` | — | 17:45:00 |
| `charger_demo_02` | Aurora 02 / A02 | 7,0 kW | `CHARGING` | 2 | `OCCUPIED` | `sess_demo_002` | — | 17:45:00 |
| `charger_demo_03` | Aurora 03 / A03 | 7,0 kW | `CONNECTED` | 1 | `OCCUPIED` | `sess_demo_003` | tolerância em curso, não é falha | 17:45:00 |
| `charger_demo_04` | Aurora 04 / A04 | 7,0 kW | `AVAILABLE` | 0 | `AVAILABLE_TO_START` | — | — | 17:45:00 |
| `charger_demo_05` | Aurora 05 / A05 | 7,0 kW | `FAULT` | — | `FAULTED` | — | falha simulada `EV_COMMUNICATION_FAULT` | 17:44:52 |
| `charger_demo_06` | Aurora 06 / A06 | 7,0 kW | `AVAILABLE` | 0 | `MAINTENANCE` | — | manutenção comercial programada | 17:45:00 |

**Coerência D0:** apenas CG-01 e CG-02 entregam energia: `6,2 + 5,8 = 12,0 kW`. CG-03 está conectado após fim energético e não adiciona carga EV. CG-04 é a única vaga comercialmente apta. CG-06 prova que um carregador técnico online pode estar comercialmente indisponível.

## 6. Pessoas e veículos fictícios

| Referência | Tipo | Perfil/veículo | Bateria / SOC | Classe de fila | Estado relevante em D0 |
|---|---|---|---|---|---|
| `driver_demo_ana` | cadastrado (`DRIVER`) | Ana / **Lumen E2** | 54 kWh / 42% informado | `REGISTERED` | sessão ativa no Aurora 01 |
| `driver_demo_bruno` | cadastrado (`DRIVER`) | Bruno / **Vento LX** | 60 kWh / 58% informado | `REGISTERED` | sessão em tolerância no Aurora 03 |
| `guest_demo_7f3a` | visitante (`GUEST`) | veículo não persistido | não informado | `GUEST` | sessão ativa no Aurora 02 |
| `guest_demo_c91b` | visitante (`GUEST`) | veículo não persistido | não informado | `GUEST` | disponível para fluxo QR/D1 |
| `driver_demo_caio` | cadastrado (`DRIVER`) | Caio / **Orbita S** | 50 kWh / 31% informado | `REGISTERED` | entra na fila em D2/D3 |
| `driver_demo_dina` | cadastrado (`DRIVER`) | Dina / **Sereno EV** | 45 kWh / 67% informado | `REGISTERED` | segunda posição cadastrada em D2 |

`SOC` e capacidade são dados informados/simulados no PWA. Não são telemetria GoodWe. Os nomes são exclusivamente demonstrativos e não representam pessoas reais.

## 7. Sessões e pagamentos de referência

### 7.1 Tabela de sessões

Valores exibidos com duas casas decimais. Energia é calculada antes do arredondamento de moeda.

| Sessão | Motorista | Carregador | Início / duração | Potência média | Energia | Tarifa/itens | Limite e meio | Estado D0 / motivo |
|---|---|---|---|---:|---:|---|---|---|
| `sess_demo_001` | Ana, cadastrada | 01 | 17:25 / 20 min | 6,20 kW | 2,07 kWh | 2,07 × 1,90 = **R$ 3,93** estimados | cartão, limite R$ 40,00 | `CHARGING` |
| `sess_demo_002` | visitante 7f3a | 02 | 17:10 / 35 min | 5,80 kW | 3,38 kWh | 3,38 × 1,90 = **R$ 6,42** estimados | Pix pré-pago R$ 30,00 | `CHARGING` |
| `sess_demo_003` | Bruno, cadastrado | 03 | 15:05 / 160 min energéticos | 6,75 kW | 18,00 kWh | 18,00 × 2,00 = **R$ 36,00**; sem ociosidade em D0 | cartão, limite R$ 55,00 | `IDLE_GRACE_PERIOD`, fim energético 17:39 |
| `sess_demo_004` | visitante histórico | 04 | 14:00 / 120 min | 6,20 kW | 12,40 kWh | 12,40 × 1,90 = **R$ 23,56** | cartão | `COMPLETED`, término normal |
| `sess_demo_005` | Ana, cadastrada | 05 | 13:20 / 42 min | 6,00 kW | 4,20 kWh | 4,20 × 2,00 = **R$ 8,40** | cartão | `FAULTED`, comunicação EV; sem ociosidade |
| `sess_demo_006` | visitante histórico | 06 | 11:00 / 80 min | 6,00 kW | 8,00 kWh | 8,00 × 1,90 = R$ 15,20; Pix pré-pago R$ 25,00, devolução R$ 9,80 | Pix | `COMPLETED`, cancelada pelo motorista após entrega confirmada |

### 7.2 Tabela financeira de referência

`Receita bruta liquidada = energia + ociosidade - descontos - devoluções comerciais.`  
`Comissão ChargeGrid = 5% × receita bruta liquidada.`  
`Líquido financeiro = receita bruta liquidada − comissão − taxa de pagamento.`

| Sessão | Receita energia | Ociosidade | Desconto/devolução comercial | Receita bruta liquidada | Comissão 5% | Taxa de pagamento demo | Líquido financeiro | Situação de pagamento |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `sess_demo_001` | R$ 3,93 estimados | R$ 0,00 | R$ 0,00 | pendente | pendente | pendente | pendente | cartão `AUTHORIZED` |
| `sess_demo_002` | R$ 6,42 estimados | R$ 0,00 | R$ 0,00 | pendente | pendente | pendente | pendente | Pix `PAID` (saldo pré-pago) |
| `sess_demo_003` | R$ 36,00 estimados | R$ 0,00 em D0 | R$ 0,00 | pendente | pendente | pendente | pendente | cartão `AUTHORIZED` |
| `sess_demo_004` | R$ 23,56 | R$ 0,00 | R$ 0,00 | **R$ 23,56** | R$ 1,18 | R$ 0,94 | **R$ 21,44** | cartão `PAID` |
| `sess_demo_005` | R$ 8,40 | R$ 0,00 | R$ 0,00 | **R$ 8,40** | R$ 0,42 | R$ 0,34 | **R$ 7,64** | cartão `PAID`; falha técnica documentada |
| `sess_demo_006` | R$ 15,20 | R$ 0,00 | R$ 0,00 | **R$ 15,20** | R$ 0,76 | R$ 0,61 | **R$ 13,83** | Pix `REFUNDED` de R$ 9,80 |

### 7.3 Verificação matemática inicial

| Checagem | Cálculo | Resultado |
|---|---|---|
| Sessão 001 | 6,20 kW × 20/60 h = 2,0667 kWh | 2,07 kWh |
| Sessão 002 | 5,80 kW × 35/60 h = 3,3833 kWh | 3,38 kWh |
| Sessão 003 | 6,75 kW × 160/60 h = 18,00 kWh | 18,00 kWh |
| Sessão 004 | 12,40 × R$ 1,90 | R$ 23,56 |
| Sessão 005 | 4,20 × R$ 2,00 | R$ 8,40 |
| Sessão 006 | 8,00 × R$ 1,90 = R$ 15,20; R$ 25,00 − R$ 15,20 | devolução Pix R$ 9,80 |
| Sessão 004 líquido | R$ 23,56 − R$ 1,18 − R$ 0,94 | R$ 21,44 |
| Sessão 005 líquido | R$ 8,40 − R$ 0,42 − R$ 0,34 | R$ 7,64 |
| Sessão 006 líquido | R$ 15,20 − R$ 0,76 − R$ 0,61 | R$ 13,83 |

## 8. Políticas de fila e ociosidade

### 8.1 Fila

- Uma fila ativa por motorista para todo o ChargeGrid.
- Prioridade: `REGISTERED` antes de `GUEST`; FIFO por `joinedAt` dentro da classe.
- Ao ser chamado, o motorista possui 10 minutos. Notificação imediata e lembrete após 5 minutos restantes.
- `CALLED` não é reserva antecipada: é uma janela operacional para um carregador compatível que se tornou disponível.

**Fila inicial D0:** vazia, pois Aurora 04 aceita uma nova sessão imediatamente.  
**Fila cheia D2:** apresentada na seção de cenários; ela existe porque nenhuma vaga comercial está disponível.

### 8.2 Ociosidade `idle_policy_demo_aurora_v1`

| Parâmetro | Valor |
|---|---:|
| Tolerância gratuita | 15 minutos |
| Taxa de referência | R$ 0,50/minuto |
| Teto de cobrança | 60 minutos (máximo R$ 30,00) |
| Condição de entrada | energia finalizada confirmada + veículo conectado |
| Não inicia por | falha técnica, perda de telemetria, recarga ainda em curso, suspensão por demanda sem fim confirmado |
| Encerramento | desconexão, atingir teto, falha técnica ou resolução comercial |

**Exemplos cobertos:** D0 mostra Bruno dentro da tolerância; D11 mostra cobrança ativa; S005 mostra que falha não gera ociosidade; D9/D10/D12 mostram término, tolerância e liquidação.

## 9. Biblioteca oficial de cenários acionáveis

Os cenários são transições de referência. `D13` e `D14` são ramos financeiros deliberados; não precisam ocorrer na mesma execução cronológica de D0–D12. Cada cenário deve alterar uma única store compartilhada, de modo que ambos os frontends sejam atualizados pela mesma fonte.

### D0 — Estado inicial / operação normal

- **A. Estado anterior:** reset completo.
- **B. Evento:** `RESET_DEMO` carrega a fotografia de 17:45.
- **C. Alterações:** estado definido nas seções 2–7; planta `NORMAL`, oferta `OPEN_PARTIAL`, CG-04 disponível.
- **D. Admin:** mostra 2 sessões carregando, 1 em tolerância, 1 vaga, 1 falha e 1 manutenção; carga EV 12,0 kW.
- **E. PWA:** mapa mostra Hub Solar Aurora como parcialmente disponível; visitante pode escanear CG-04.
- **F. Notificação:** nenhuma nova; sessão 003 conserva alerta de tolerância iniciado às 17:39.
- **G. Financeiro:** apenas valores estimados nas sessões ativas; históricos permanecem liquidados.
- **H. Próximo:** `D1`, `D4`, `D7` ou `D15`.

### D1 — Início de recarga de visitante

- **A. Estado anterior:** D0, CG-04 `AVAILABLE_TO_START`.
- **B. Evento:** visitante `guest_demo_c91b` lê QR, aceita segmentos, escolhe limite Pix R$ 25,00; `PAYMENT_AUTHORIZED` seguido de `START_CHARGE` simulado.
- **C. Alterações:** cria `sess_demo_007`: `SESSION_CREATED → AWAITING_PAYMENT → AUTHORIZED → WAITING_START → STARTING → CHARGING`; CG-04 fica técnico `CHARGING`, potência 6,0 kW, comercial `OCCUPIED`; Pix `PAID` R$ 25,00. Carga EV passa de 12,0 para 18,0 kW; a planta continua `NORMAL`.
- **D. Admin:** nova sessão de visitante, comando assíncrono concluído e ocupação 3/6 com CG-03 ainda conectado.
- **E. PWA:** visitante vê “Pagamento garantido”, depois “Carregando”, potência até 6,0 kW e custo acumulado a R$ 1,90/kWh; Ana não vê a sessão alheia.
- **F. Notificação:** “Recarga iniciada no Aurora 04”.
- **G. Financeiro:** saldo Pix garantido R$ 25,00; sem receita liquidada enquanto ativa.
- **H. Próximo:** `D2`, `D4`, `D9` ou `D14`.

### D2 — Estabelecimento cheio + fila

- **A. Estado anterior:** D1; CG-01, 02 e 04 carregam, CG-03 ocupado em tolerância, CG-05 falho e CG-06 em manutenção.
- **B. Evento:** `FILL_SITE`; Caio, Dina e um visitante elegível solicitam atendimento quando não há vaga.
- **C. Alterações:** disponibilidade agregada `FULL_QUEUE`; cria fila: (1) Caio `WAITING`, 17:50:00, cadastrado; (2) Dina `WAITING`, 17:50:30, cadastrada; (3) visitante 4aa1 `WAITING`, 17:51:00, guest. Não há alteração de tarifa.
- **D. Admin:** mostra 3 entradas e explica prioridade por classe/FIFO; todos os carregadores estão ocupados, falhos ou em manutenção.
- **E. PWA:** Caio vê posição 1 e estimativa; Dina, posição 2; visitante, posição 3. Nenhum vê identidade dos demais.
- **F. Notificação:** “Você entrou na fila do Hub Solar Aurora”.
- **G. Financeiro:** nenhum valor novo; não há cobrança por fila.
- **H. Próximo:** `D3`, `D4`, `D7` ou saída voluntária de fila.

### D3 — Usuário cadastrado chamado

- **A. Estado anterior:** D2; CG-03 termina a tolerância e Bruno desconecta dentro do prazo, sem taxa.
- **B. Evento:** `VEHICLE_DISCONNECTED` em CG-03 e `QUEUE_CALL_NEXT`.
- **C. Alterações:** sessão 003 segue `IDLE_GRACE_PERIOD → SETTLING`; fila de Caio `WAITING → CALLED`, com `calledAt=17:55:00` e `expiresAt=18:05:00`; CG-03 fica técnico `AVAILABLE`, comercial `AVAILABLE_TO_START`, temporariamente associado a Caio ao avançar para `ASSIGNED`. Dina e visitante mantêm posições relativas.
- **D. Admin:** vê vaga liberada, chamado ativo e relógio de 10 minutos.
- **E. PWA:** Caio recebe carregador/vaga após atribuição e CTA de continuar para pagamento; Dina vê atualização de espera, visitante não é ultrapassado dentro da sua classe, mas permanece atrás dos cadastrados.
- **F. Notificação:** “Sua vez: apresente-se no Aurora 03 até 18:05”.
- **G. Financeiro:** S003 tem valor energético R$ 36,00, sem ociosidade; captura/liquidação pode seguir em D12. Fila não altera preço.
- **H. Próximo:** `D1` aplicado a Caio, `D4`, expiração às 18:05 ou `D12` para S003.

### D4 — Demanda em ALERT

- **A. Estado anterior:** D1 ou D2, planta ainda `NORMAL`.
- **B. Evento:** `SET_ENERGY_ALERT`; snapshot simulado mostra margem operacional reduzida.
- **C. Alterações:** `PlantEnergyStatus NORMAL → ALERT`; novos inícios são restringidos por política. Sessões já em `CHARGING` continuam. CG-04, se livre em outra ramificação, passa para `RESTRICTED_BY_ENERGY`; se carregando, permanece `OCCUPIED`.
- **D. Admin:** banner “Alerta de demanda”; mostra que preservação de sessão é prioridade e bloqueio vale para admissão nova.
- **E. PWA:** novos usuários veem indisponibilidade temporária/possível fila; motoristas em carga veem aviso informativo, sem pânico.
- **F. Notificação:** estabelecimento recebe “Estado energético em alerta; novos inícios restritos”.
- **G. Financeiro:** nenhuma sessão em curso é reprificada; nenhuma taxa é criada.
- **H. Próximo:** `D5`, `SET_ENERGY_NORMAL`, ou término normal de sessão.

### D5 — Demanda em CRITICAL

- **A. Estado anterior:** D4, com pressão persistente.
- **B. Evento:** `SET_ENERGY_CRITICAL`.
- **C. Alterações:** `ALERT → CRITICAL`; bloqueia toda nova admissão. A regra seleciona como primeira candidata uma sessão visitante mais recente (`sess_demo_007`, se D1 ocorreu) antes de sessões cadastradas. O comando ainda não é considerado concluído nesta etapa.
- **D. Admin:** estado crítico, lista de sessões preservadas/candidatas e ação assíncrona pendente com motivo auditável.
- **E. PWA:** novos usuários veem local temporariamente indisponível; motorista candidata vê aviso de que a recarga pode ser interrompida por demanda.
- **F. Notificação:** “Demanda crítica: novos inícios bloqueados”.
- **G. Financeiro:** nenhuma cobrança nova e nenhum preço alterado.
- **H. Próximo:** `D6`, recuperação para `ALERT`/`NORMAL` ou incidente técnico.

### D6 — Sessão suspensa por demanda

- **A. Estado anterior:** D5, `sess_demo_007` de visitante é a candidata mais recente.
- **B. Evento:** `STOP_CHARGE` simulado retorna sucesso e telemetria confirma que energia cessou.
- **C. Alterações:** S007 passa `CHARGING → SUSPENDED_BY_DEMAND`; CG-04 técnico `CHARGING → CONNECTED`, potência EV da sessão 0,0 kW; carga EV da planta reduz 6,0 kW. Não entrar em `IDLE_GRACE_PERIOD`: interrupção por demanda não é ociosidade. Um reinício posterior exige condição segura, pagamento válido, veículo conectado e um novo `START_CHARGE`.
- **D. Admin:** vê motivo “controle de demanda”, comando confirmado, redução de carga e trilha de auditoria.
- **E. PWA:** visitante vê “Recarga interrompida por demanda da planta”, energia e custo confirmados até a última leitura; não vê ação como pausa nativa.
- **F. Notificação:** “Sua recarga foi interrompida para preservar a operação da planta. Avisaremos se puder ser retomada.”
- **G. Financeiro:** cobra somente energia confirmada; sem ociosidade e sem tarifação retroativa. Se não reiniciar, vai a `SETTLING`/devolução do saldo Pix.
- **H. Próximo:** recuperação com `WAITING_START → STARTING → CHARGING`, ou `D12`/`D14`.

### D7 — Falha de carregador

- **A. Estado anterior:** qualquer estado com CG-02 carregando.
- **B. Evento:** `TRIGGER_CHARGER_FAULT` retorna alarme técnico simulado `EV_COMMUNICATION_FAULT`.
- **C. Alterações:** CG-02 `CHARGING → FAULT`, comercial `OCCUPIED → FAULTED`; S002 `CHARGING → FAULTED`; energia é congelada na última medição confirmada. Incidente `inc_demo_002` é criado. Não há ociosidade.
- **D. Admin:** alerta de severidade operacional, sessão afetada, última telemetria e fila/atendimento impactados.
- **E. PWA:** visitante 7f3a vê encerramento por falha, valor apenas da energia confirmada e próximo passo de devolução/encerramento.
- **F. Notificação:** motorista e estabelecimento recebem aviso de falha; GoodWe Admin recebe apenas se persistente/conforme escopo.
- **G. Financeiro:** S002 deve liquidar somente R$ 6,42 confirmados em D0, menos eventual devolução de saldo Pix; taxa de ociosidade é R$ 0,00.
- **H. Próximo:** `D8`, `D12` para financeiro da sessão ou `SETTLEMENT_PENDING` se devolução atrasar.

### D8 — Recuperação de falha

- **A. Estado anterior:** D7, CG-02 em `FAULT`.
- **B. Evento:** `RECOVER_CHARGER`; mock entrega telemetria nova, sem alarme e veículo desconectado.
- **C. Alterações:** CG-02 `FAULT → AVAILABLE`, comercial `FAULTED → AVAILABLE_TO_START`; incidente marcado como resolvido, com horário e última evidência. A sessão S002 não volta a carregar: permanece encerrada/financeiramente tratada.
- **D. Admin:** disponibilidade recuperada e incidente resolvido; histórico de falha preservado.
- **E. PWA:** mapa pode voltar a mostrar capacidade compatível; visitante afetado vê somente seu comprovante/andamento financeiro.
- **F. Notificação:** “Aurora 02 voltou a ficar disponível”.
- **G. Financeiro:** nenhuma energia adicional é atribuída à S002.
- **H. Próximo:** D2/D3 para fila, D1 para nova sessão ou D15.

### D9 — Encerramento normal de energia

- **A. Estado anterior:** S001 está `CHARGING` e Ana encerra a própria sessão ou atinge limite aceito.
- **B. Evento:** `STOP_CHARGE` confirmado e `ENERGY_FINISHED` por telemetria.
- **C. Alterações:** S001 `CHARGING → ENERGY_FINISHED → IDLE_GRACE_PERIOD` porque veículo continua conectado; CG-01 `CHARGING → CONNECTED`, comercial permanece `OCCUPIED`; `idleStartedAt` é registrado. A sessão não é liquidada enquanto há possibilidade de ociosidade.
- **D. Admin:** fim energético confirmado, tolerância de 15 min e vaga ainda não liberada.
- **E. PWA:** Ana vê energia final, custo final de energia, cronômetro gratuito e instrução para retirar o veículo.
- **F. Notificação:** “Recarga concluída. Retire o veículo em até 15 minutos para evitar cobrança de ociosidade.”
- **G. Financeiro:** custo energético é fechado; ociosidade ainda R$ 0,00; cartão continua com garantia até `SETTLING`.
- **H. Próximo:** `D10`, desconexão imediata seguida de `D12`, ou falha sem cobrança de ociosidade.

### D10 — Tolerância de ociosidade

- **A. Estado anterior:** D9, 10 minutos após o fim energético, veículo ainda conectado.
- **B. Evento:** relógio de política atinge `T+10min` desde `idleStartedAt`.
- **C. Alterações:** S001 permanece `IDLE_GRACE_PERIOD`; contador mostra 5 minutos gratuitos restantes. Nenhum valor de ociosidade é calculado ainda.
- **D. Admin:** cartão da sessão indica “em tolerância”; carregador continua ocupado, não disponível para fila.
- **E. PWA:** contador visível e lembrete proativo para Ana; sem cobrança exibida como devida.
- **F. Notificação:** “Restam 5 minutos da sua tolerância gratuita.”
- **G. Financeiro:** receita de ociosidade R$ 0,00.
- **H. Próximo:** desconexão → `D12`; expirar tolerância → `D11`.

### D11 — Cobrança de ociosidade

- **A. Estado anterior:** D10, veículo continua conectado após 15 minutos gratuitos.
- **B. Evento:** `START_IDLE_FEE`.
- **C. Alterações:** S001 `IDLE_GRACE_PERIOD → IDLE_FEE`; contador tarifado inicia a R$ 0,50/min. Após 12 minutos cobrados, `idleFeeAmount = R$ 6,00`; o teto permanece 60 min/R$ 30,00. CG-01 continua `CONNECTED`/`OCCUPIED`.
- **D. Admin:** vê ociosidade ativa, tempo e valor; a vaga ainda não é oferecida à fila.
- **E. PWA:** Ana vê cobrança ativa com taxa, valor acumulado e instrução de retirada.
- **F. Notificação:** “A tolerância terminou: R$ 0,50/min está sendo cobrado enquanto o veículo permanecer conectado.”
- **G. Financeiro:** para S001, exemplo final parcial: energia R$ 3,93 + ociosidade R$ 6,00 = R$ 9,93 de receita bruta projetada; comissão projetada R$ 0,50 (5% arredondado); não liquidar antes de desconexão.
- **H. Próximo:** desconexão → `D12`; saldo insuficiente → `OUTSTANDING_BALANCE`.

### D12 — Liquidação concluída

- **A. Estado anterior:** S001 em D10 ou D11, ou S003 após desconexão dentro da tolerância.
- **B. Evento:** veículo desconecta; `SETTLE_SESSION` confirma captura/liberação ou devolução.
- **C. Alterações:** para a versão D11 de S001: `IDLE_FEE → SETTLING → COMPLETED`; cartão captura R$ 9,93. CG-01 passa `CONNECTED → AVAILABLE`, comercial `OCCUPIED → AVAILABLE_TO_START`. Para S003: captura R$ 36,00, sem taxa de ociosidade.
- **D. Admin:** receita, comissão, taxa e líquido deixam de ser estimados; carregador volta à capacidade da fila/oferta.
- **E. PWA:** Ana recebe comprovante com energia, ociosidade, total e método; Bruno vê comprovante sem ociosidade.
- **F. Notificação:** “Pagamento concluído. Seu comprovante está disponível.”
- **G. Financeiro:** S001: R$ 9,93 − R$ 0,50 comissão − R$ 0,40 taxa cartão demo = **R$ 9,03 líquido**. S003: R$ 36,00 − R$ 1,80 − R$ 1,44 = **R$ 32,76 líquido**.
- **H. Próximo:** `D3` se a fila estiver ativa, `D1` para nova sessão ou `D15` no fechamento.

### D13 — Pagamento pendente

- **A. Estado anterior:** sessão energética concluída com valor final conhecido; use S003 como ramo alternativo antes de D12.
- **B. Evento:** `PAYMENT_CAPTURE_TIMEOUT` simulado no gateway.
- **C. Alterações:** S003 `SETTLING → SETTLEMENT_PENDING`; pagamento cartão `AUTHORIZED → SETTLEMENT_PENDING`; nenhuma energia/ociosidade nova é registrada. Retentativa idempotente fica conceitual.
- **D. Admin:** destaca pendência acionável, valor R$ 36,00, tentativa e estado do gateway; não chama de receita líquida.
- **E. PWA:** Bruno vê “Pagamento em processamento”, sem mensagem de falha de recarga e sem solicitar novo pagamento automaticamente.
- **F. Notificação:** “Sua recarga terminou; estamos finalizando o pagamento.”
- **G. Financeiro:** receita bruta conhecida R$ 36,00, mas comissão/líquido permanecem pendentes de confirmação de liquidação.
- **H. Próximo:** retentativa bem-sucedida → D12; insucesso/garantia insuficiente → `OUTSTANDING_BALANCE`; contestação → `DISPUTED`.

### D14 — Pix com devolução

- **A. Estado anterior:** S007 de visitante iniciou com Pix pré-pago de R$ 25,00 e encerrou após 7,00 kWh no período favorável.
- **B. Evento:** `FINISH_SESSION` seguido de solicitação de devolução.
- **C. Alterações:** custo de energia `7,00 × R$ 1,90 = R$ 13,30`; S007 `ENERGY_FINISHED → SETTLING → COMPLETED`; pagamento Pix `PAID → REFUND_PENDING → REFUNDED` de R$ 11,70. Sem ociosidade se desconectou no prazo.
- **D. Admin:** vê pré-pagamento R$ 25,00, consumo R$ 13,30 e devolução confirmada R$ 11,70, sem misturar devolução de saldo com desconto comercial.
- **E. PWA:** visitante vê comprovante: “Pago R$ 25,00; usado R$ 13,30; devolvido R$ 11,70”.
- **F. Notificação:** “Devolução Pix de R$ 11,70 confirmada.”
- **G. Financeiro:** receita bruta R$ 13,30; comissão R$ 0,67; taxa Pix demo R$ 0,53; líquido **R$ 12,10**.
- **H. Próximo:** fim do ramo ou `D15`.

### D15 — Planta comercialmente fechada, tecnicamente online

- **A. Estado anterior:** qualquer cenário após 22:00, sem necessidade de falha técnica.
- **B. Evento:** `SET_COMMERCIAL_CLOSED` por horário do estabelecimento.
- **C. Alterações:** estabelecimento `OPEN_* / FULL_QUEUE → CLOSED`; CG-04 e CG-06 podem manter técnico `AVAILABLE`, porém comercial `CLOSED`. Novas sessões e entradas na fila não são aceitas; sessões já iniciadas seguem para término seguro e liquidação.
- **D. Admin:** mostra fechamento por horário, sem criar incidente técnico.
- **E. PWA:** mapa mantém o local visível como fechado, informa horário de reabertura e não oferece início/entrada em fila.
- **F. Notificação:** não é necessária para descoberta; motoristas com sessão ativa recebem apenas avisos de término normais.
- **G. Financeiro:** nenhum efeito sobre tarifas/energia já iniciadas; nenhuma sessão nova é autorizada.
- **H. Próximo:** próxima abertura retorna à disponibilidade derivada; `RESET_DEMO` para replay.

## 10. Jornadas orientadas a dados

### 10.1 Jornada do visitante

```text
QR → carregador → condições → limite → pagamento → autorização
→ StartCharge → CHARGING → ENERGY_FINISHED → IDLE_GRACE_PERIOD
→ SETTLING → COMPLETED
```

| Etapa | Dados criados/alterados | Visibilidade |
|---|---|---|
| QR | `guestSessionContext`, `chargerId`, `establishmentId`, estado comercial do carregador | somente visitante; dados públicos |
| Condições | `TariffPolicy`, segmentos, `IdlePolicy`, disponibilidade e potência nominal | visitante vê; Admin não cria sessão ainda |
| Limite | `financialLimit`, método escolhido | visitante e API; Admin só após sessão criada |
| Pagamento | `Payment(PENDING → AUTHORIZED/PAID)` | visitante vê próprio status; Admin vê operação |
| Autorização | `CommercialSession(AUTHORIZED → WAITING_START)` | ambos conforme escopo |
| StartCharge | `GoodWeCommand(START_CHARGE)`, `STARTING → CHARGING` após confirmação | visitante vê progresso; Admin vê comando/auditoria |
| Energia | energia/potência/duração confirmadas; custo estimado por segmento aceito | visitante vê a própria; Admin vê sessão local |
| Fim/ociosidade | `ENERGY_FINISHED`, `IDLE_GRACE_PERIOD` e opcional `IDLE_FEE` | ambos; falha/demanda não iniciam ociosidade |
| Liquidação | `SETTLING → COMPLETED`, captura ou devolução | comprovante ao visitante; financeiro ao Admin |

### 10.2 Jornada do motorista cadastrado

```text
Mapa → estabelecimento → disponibilidade → fila → CALLED → ASSIGNED
→ pagamento → sessão → histórico
```

| Etapa | Alteração de dados | Particularidade |
|---|---|---|
| Mapa | consulta `EstablishmentSummary` | marcador por estabelecimento, não por conector individual |
| Disponibilidade | `CommercialAvailability`, `QueueSummary`, tarifa pública | online não implica aberto comercialmente |
| Fila | cria `QueueEntry(WAITING)` | prioridade cadastrada + FIFO; sem reserva |
| Chamada | `WAITING → CALLED`, 10 min | notificação e expiração rastreáveis |
| Atribuição | `CALLED → ASSIGNED`, `chargerId` compatível | ainda não há energia nem pagamento necessariamente |
| Pagamento/sessão | igual à jornada do visitante, podendo usar preferência salva | perfil não autoriza ver dados de outros |
| Histórico | adiciona projeção de `COMPLETED`, comprovante e veículo | não cria dados GoodWe novos |

### 10.3 Jornada do estabelecimento

```text
Dashboard → estado da planta → sessões → carregadores
→ mudança energética → decisão ChargeGrid → efeito na sessão → financeiro atualizado
```

1. O dashboard consome `PlantEnergySnapshot`, `ChargerSummary`, `ActiveSession`, `QueueSummary` e `EstablishmentKpis`.
2. Uma mudança de telemetria simulada atualiza `PlantEnergyStatus` por regra determinística demonstrável.
3. `ALERT` restringe admissão; `CRITICAL` pode emitir `STOP_CHARGE` e atualizar a sessão para `SUSPENDED_BY_DEMAND` após confirmação.
4. O administrador vê a decisão, o motivo, a confirmação/falha do comando e o impacto financeiro limitado ao consumo confirmado.
5. O financeiro só passa de estimado a liquidado em `COMPLETED`; pendência permanece visível como pendência.

### 10.4 Jornada GoodWe

```text
rede → planta → utilização → receita → comissão → incidente → saturação → oportunidade de expansão
```

| Camada | Projeção demonstrativa | Limite |
|---|---|---|
| Rede | plantas comerciais ativas, disponibilidade, sessões, energia | não substitui SEMS+ técnico |
| Planta | limite EV, estado energético, carregadores e incidentes | telemetria é simulada no MVP |
| Receita/comissão | receita bruta liquidada, comissão 5%, taxas/líquido separados | 5% é hipótese demonstrativa, não contrato comercial |
| Saturação | fila recorrente, ocupação e indisponibilidade | é sinal de oportunidade, não previsão garantida |
| Expansão | `PredictionSummary` opcional ou sinal determinístico | IA não bloqueia nem toma decisão crítica |

## 11. Visibilidade por frontend

| Dado | GoodWe Admin | Admin/Operador do estabelecimento | PWA cadastrada | PWA visitante |
|---|---|---|---|---|
| Estabelecimento, horário, oferta pública | vê | vê/edita conforme papel | vê | vê |
| Telemetria detalhada de planta | vê | vê própria planta | não vê | não vê |
| Carregadores e estado técnico | vê | vê própria planta | vê somente contexto público ou atribuído | vê QR/atribuído |
| Disponibilidade comercial e fila agregada | vê | vê | vê | vê quando pública |
| Identidade de outros motoristas | não precisa ver | apenas quando política operacional autorizar, preferir mascarada | não vê | não vê |
| Própria sessão, energia, custo, comprovante | não se aplica | vê sessão da própria planta | vê apenas a própria | vê apenas a sessão temporária |
| Pagamento sensível | vê auditoria mascarada/autorizada | vê próprio estabelecimento mascarado | vê apenas próprio método/status mascarado | vê somente sessão temporária mascarada |
| Receita, comissão, taxas e líquido | vê rede/agregado | vê própria operação | não vê | não vê |
| Incidentes | vê escopo de rede | vê própria planta | vê apenas impacto na própria sessão | vê apenas impacto na própria sessão |
| IA/recomendação | vê agregada | vê própria operação | vê recomendação de escolha, nunca dados internos | pode ver recomendação pública simples |

## 12. Timeline de replay

O controlador pode manter tempo relativo e não precisa simular relógio real. A sequência principal sugerida abaixo preserva coerência; ramos financeiros D13/D14 podem ser acionados isoladamente.

| Tempo relativo | Horário de referência | Cenário/evento | Resultado observável |
|---|---|---|---|
| `T0` | 17:45:00 | D0 / `RESET_DEMO` | operação parcial normal |
| `T+5s` | 17:45:05 | D1 / autorização e start de visitante | CG-04 carrega |
| `T+30s` | 17:45:30 | D2 / `FILL_SITE` | fila com 3 entradas |
| `T+60s` | 17:46:00 | D4 / `SET_ENERGY_ALERT` | novos inícios restritos |
| `T+90s` | 17:46:30 | D5 / `SET_ENERGY_CRITICAL` | novos inícios bloqueados |
| `T+100s` | 17:46:40 | D6 / StopCharge confirmado | sessão visitante suspensa por demanda |
| `T+2min` | 17:47:00 | D7 / falha CG-02 | incidente e sessão faulted |
| `T+3min` | 17:48:00 | D8 / recuperação CG-02 | disponibilidade recuperada |
| `T+5min` | 17:50:00 | D9 / fim energético S001 | inicia tolerância |
| `T+15min` | 18:00:00 | D10 | lembrete: 5 min de tolerância restantes |
| `T+20min` | 18:05:00 | D11 | ociosidade ativa se veículo continua conectado |
| `T+32min` | 18:17:00 | D12 | desconexão e liquidação S001 |
| ramo | sob demanda | D13 | pagamento pendente de S003 |
| ramo | sob demanda | D14 | devolução Pix de S007 |
| `T+4h15min` | 22:00:00 | D15 | fechamento comercial com equipamento online |

## 13. Demo Controller conceitual

O futuro controlador recebe comandos de demonstração, aplica a transição validada e publica o mesmo snapshot para os dois frontends. Ele não deve simular uma integração de produção nem permitir estado incompatível.

| Comando conceitual | Efeito permitido |
|---|---|
| `RESET_DEMO` | restaura D0, incluindo filas, pagamentos, sessões e relógio |
| `START_SESSION` | executa o caminho D1 para motorista/carregador elegível |
| `FILL_SITE` | cria D2 com ocupação e fila consistentes |
| `CALL_NEXT_QUEUE_ENTRY` | aplica D3 quando uma vaga compatível é liberada |
| `SET_ENERGY_NORMAL` | retorna à política de admissão normal se regras permitirem |
| `SET_ENERGY_ALERT` | aplica D4 |
| `SET_ENERGY_CRITICAL` | aplica D5, sem afirmar que carga já parou |
| `SUSPEND_BY_DEMAND` | aplica D6 somente após resultado simulado de `STOP_CHARGE` |
| `TRIGGER_CHARGER_FAULT` | aplica D7 a um carregador/sessão elegível |
| `RECOVER_CHARGER` | aplica D8 sem ressuscitar sessão encerrada |
| `FINISH_SESSION` | aplica D9 para sessão ativa com fim energético confirmado |
| `ADVANCE_IDLE_CLOCK` | move D9 → D10 → D11 conforme política |
| `SETTLE_SESSION` | aplica D12 se pagamento permitir |
| `SET_PAYMENT_PENDING` | aplica D13 como ramo financeiro |
| `PROCESS_PIX_REFUND` | aplica D14 em sessão Pix elegível |
| `SET_COMMERCIAL_CLOSED` | aplica D15 sem alterar indevidamente estado técnico |

## 14. Validação final de consistência

### 14.1 Checklist lógico e matemático

- [x] O balanço energético D0 fecha em 54,0 kW dos dois lados.
- [x] Carga EV D0 (12,0 kW) é exatamente a soma de CG-01 (6,2) e CG-02 (5,8).
- [x] Nenhuma potência individual excede 7,0 kW nominais.
- [x] Nenhuma sessão ocupa dois carregadores simultaneamente.
- [x] CG-03 conectado pós-energia não adiciona carga EV e não é apresentado como vaga.
- [x] CG-05 `FAULT` e CG-06 online/em manutenção têm razões comerciais distintas.
- [x] Sessões de energia calculam `kWh ≈ potência média × duração`; os exemplos são conferidos na seção 7.3.
- [x] Receita liquidada, comissão de 5% e líquido financeiro fecham nas sessões históricas e exemplos D12/D14.
- [x] O pagamento pré-pago Pix em D14 é R$ 25,00 = R$ 13,30 consumidos + R$ 11,70 devolvidos.
- [x] Nenhuma fila oferece visitante antes de cadastrado; FIFO só é aplicado dentro da classe.
- [x] `SUSPENDED_BY_DEMAND` não é descrito como PauseCharge e não inicia ociosidade.
- [x] Falha técnica D7 congela na última medição e nunca cria ociosidade.
- [x] `SETTLEMENT_PENDING` não é chamado de receita/líquido final.
- [x] Encerramento comercial e energético são distintos; D9–D12 demonstram a diferença.
- [x] Admin e PWA recebem o mesmo estado, com projeções de privacidade definidas na seção 11.

### 14.2 Limites explícitos da demonstração

| Item | Classificação | Como deve aparecer no MVP |
|---|---|---|
| Estrutura de planta, carregador, telemetria e comando Start/Stop | domínio GoodWe documentado, com execução ainda a validar | mock compatível e rótulo de simulação quando não conectado |
| `vehConnectStatus`, potência, energia e duração | referência de telemetria GoodWe | valores sintéticos coerentes no demo |
| Pagamento, Pix, pré-autorização, captura | Stripe sandbox na PWA; fixture D0 no Admin/testes | integração de teste, sem alegar gateway produtivo/live |
| Fila, tarifa, comissão e ociosidade | fixtures e estado local | interface completa; persistência produtiva ainda ausente |
| `SUSPENDED_BY_DEMAND` | estado comercial ChargeGrid | mostra StopCharge assíncrono, não pausa nativa |
| IA/previsão | futura/não validada | recomendação opcional, fallback determinístico |
| Ajuste contínuo de potência, OCPP, multi-fabricante e split real | futuro/não validado | não demonstrar como capacidade atual |

## 15. Decisões mínimas e pendências para SDD

### Decisões mínimas adotadas para o cenário

1. A tarifa favorável de R$ 1,90/kWh e a tarifa de pico de R$ 2,30/kWh são valores exclusivamente demonstrativos; preservam a regra de segmentação previsível sem afirmar tabela oficial de distribuidora.
2. O limite EV de 28,0 kW permite demonstrar admissão e criticidade sem confundir potência instalada (42,0 kW) com capacidade comercial permitida.
3. D0 possui uma única vaga comercial para tornar a transição D1 e a fila D2 compreensíveis; diversidade de estados é mantida por tolerância, falha e manutenção.
4. Taxas de pagamento demo foram escolhidas apenas para fechar a aritmética do líquido; não representam preço de gateway.

### O que o SDD ainda deve tratar

- Thresholds numéricos e fórmula de derivação para `NORMAL`, `ALERT` e `CRITICAL`.
- Precisão monetária interna, arredondamento por segmento, impostos e política de tarifas exibidas.
- Formato dos seeds, fixtures, ids, clock, persistência e reset de cenário.
- Retentativas, idempotência, timeout e reconciliação financeira/técnica reais.
- Critérios de compatibilidade de veículo/conector, acessibilidade, LGPD e antifraude.
- Mapeamento confirmado do modelo/dispositivo GoodWe em ambiente credenciado.

## Apêndice A — Resumo do estado inicial D0

| Domínio | Valor de partida |
|---|---|
| Estabelecimento | Hub Solar Aurora, aberto 08:00–22:00, `OPEN_PARTIAL` |
| Planta | `NORMAL`, PV 36,0 kW, rede 18,0 kW, prédio 42,0 kW, EV 12,0 kW |
| Carregadores | 2 `CHARGING`, 1 `CONNECTED` em tolerância, 1 `AVAILABLE`, 1 `FAULT`, 1 `MAINTENANCE` |
| Sessões ativas | S001 Ana carregando; S002 visitante carregando; S003 Bruno em tolerância |
| Fila | vazia |
| Tarifa atual | R$ 1,90/kWh; próxima mudança programada às 18:00 para R$ 2,30/kWh |
| Ociosidade | 15 min gratuitos; R$ 0,50/min; teto 60 min |
| Comissão | 5% da receita bruta liquidada, hipótese demonstrativa |

## Apêndice B — Índice de cenários

| Cenário | Tema | Principal prova de produto |
|---|---|---|
| D0 | operação normal | uma história comum Admin/PWA |
| D1 | início | QR, garantia e StartCharge assíncrono |
| D2 | lotação | fila sem surge pricing |
| D3 | chamado | prioridade + FIFO + janela de 10 min |
| D4 | alerta | restrição de admissão |
| D5 | crítico | bloqueio e priorização de redução |
| D6 | suspensão | StopCharge, estado comercial e sem ociosidade |
| D7 | falha | última medição confirmada e incidente |
| D8 | recuperação | retorno técnico sem reiniciar sessão antiga |
| D9 | fim energético | energia ≠ fim comercial |
| D10 | tolerância | aviso antes de cobrar |
| D11 | ociosidade | taxa e teto transparentes |
| D12 | liquidação | receita, comissão, taxa e líquido |
| D13 | pendência | pagamento não confirmado não vira receita final |
| D14 | Pix | devolução de saldo não usado |
| D15 | fechado/online | técnica ≠ disponibilidade comercial |
