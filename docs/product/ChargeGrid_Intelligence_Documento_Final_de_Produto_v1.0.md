# GOODWE | CHARGEGRID INTELLIGENCE

## Documento Final de Produto

### ChargeGrid Intelligence v1.0

*Definição funcional e de negócio para uma operação comercial de recarga integrada ao ecossistema GoodWe*

- **Status:** Baseline funcional aprovada para especificação
- **Versão:** 1.0
- **Data:** 19 de agosto de 2026
- **Idioma:** Português (Brasil)

### Equipe

- Tiago Pimentel Muniz - RM 574148
- Gustavo Curis de Francisco - RM 569704
- Caio César Portela França - RM 573127
- Lourenço Borges da Silva - RM 569515
- Davi Teodoro Novais - RM 571022

---

## Controle do documento

| **Campo**         | **Definição**                                                                                                 |
|-------------------|---------------------------------------------------------------------------------------------------------------|
| Finalidade        | Consolidar as decisões funcionais e de negócio que definem o ChargeGrid Intelligence v1.0.                    |
| Público           | GoodWe, equipe do projeto, produto, arquitetura, engenharia, design e stakeholders de negócio.                |
| Uso               | Fonte de verdade para a etapa seguinte de especificação e desenvolvimento orientado por specs.                |
| Regra de leitura  | O documento distingue capacidade GoodWe documentada, comportamento simulado e capacidade futura/não validada. |
| Fora do propósito | Não é contrato comercial, documentação jurídica, especificação de API nem compromisso de produção da GoodWe.  |

### Como interpretar a maturidade

| **Selo**              | **Significado**                                                                  | **Tratamento no v1.0**                                                                                       |
|-----------------------|----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------|
| REAL / DOCUMENTADO    | Capacidade observada no ecossistema GoodWe ou descrita na OpenAPI de referência. | Pode orientar a arquitetura; o uso real ainda depende de credenciais, permissões e validação no equipamento. |
| SIMULADO NO PROTÓTIPO | Comportamento reproduzido com dados, estados e fluxos sintéticos coerentes.      | Deve ser apresentado como demonstração, sem alegar conexão operacional com a nuvem ou o HCA G2.              |
| FUTURO / NÃO VALIDADO | Capacidade desejada de produto, sem suporte confirmado nas fontes disponíveis.   | Permanece no roadmap e não pode ser atribuída à OpenAPI atual.                                               |

**Princípio de segurança documental.** Nenhum endpoint, comando ou capacidade de hardware é presumido. Onde a documentação não comprova uma ação, o documento a classifica como simulação ou evolução futura.

## Sumário

- [Controle do documento](#controle-do-documento)
  - [Como interpretar a maturidade](#como-interpretar-a-maturidade)
- [1. Resumo executivo](#1-resumo-executivo)
  - [1.1 Decisões executivas congeladas](#11-decisões-executivas-congeladas)
- [2. Visão do produto e contexto GoodWe](#2-visão-do-produto-e-contexto-goodwe)
  - [2.1 O desafio](#21-o-desafio)
  - [2.2 Posicionamento](#22-posicionamento)
  - [2.3 Princípios do produto](#23-princípios-do-produto)
- [3. Ecossistema, arquitetura e fronteiras](#3-ecossistema-arquitetura-e-fronteiras)
  - [3.1 Papel de SEMS+, SolarGo e HCA G2](#31-papel-de-sems-solargo-e-hca-g2)
  - [3.2 Arquitetura conceitual](#32-arquitetura-conceitual)
  - [3.3 Fontes da verdade](#33-fontes-da-verdade)
  - [3.4 Matriz de capacidades](#34-matriz-de-capacidades)
- [4. Modelo de negócio](#4-modelo-de-negócio)
  - [4.1 Cadeia de valor](#41-cadeia-de-valor)
  - [4.2 Hipótese de monetização v1.0](#42-hipótese-de-monetização-v10)
  - [4.3 Responsabilidades comerciais](#43-responsabilidades-comerciais)
- [5. Atores, papéis e permissões](#5-atores-papéis-e-permissões)
- [6. Escopo funcional e superfícies](#6-escopo-funcional-e-superfícies)
  - [6.1 Web administrativa](#61-web-administrativa)
  - [6.2 PWA do motorista](#62-pwa-do-motorista)
  - [6.3 ChargeGrid Core](#63-chargegrid-core)
- [7. Jornadas principais](#7-jornadas-principais)
  - [7.1 Visitante: recarga de oportunidade](#71-visitante-recarga-de-oportunidade)
  - [7.2 Motorista cadastrado](#72-motorista-cadastrado)
  - [7.3 Estabelecimento](#73-estabelecimento)
  - [7.4 GoodWe](#74-goodwe)
- [8. Sessão comercial](#8-sessão-comercial)
  - [8.1 Máquina de estados](#81-máquina-de-estados)
  - [8.2 Estados de exceção](#82-estados-de-exceção)
  - [8.3 Motivos de encerramento energético](#83-motivos-de-encerramento-energético)
  - [8.4 Regras de medição](#84-regras-de-medição)
- [9. Pagamentos e liquidação](#9-pagamentos-e-liquidação)
  - [9.1 Princípio](#91-princípio)
  - [9.2 Cartão](#92-cartão)
  - [9.3 Pix](#93-pix)
  - [9.4 Limite e top-up](#94-limite-e-top-up)
  - [9.5 Exceções](#95-exceções)
- [10. Tarifação dinâmica](#10-tarifação-dinâmica)
  - [10.1 Perfil energético-tarifário](#101-perfil-energético-tarifário)
  - [10.2 Fatores](#102-fatores)
  - [10.3 Mudança durante a sessão](#103-mudança-durante-a-sessão)
- [11. Controle de demanda](#11-controle-de-demanda)
  - [11.1 Escopo v1](#111-escopo-v1)
  - [11.2 Prioridade](#112-prioridade)
  - [11.3 Segurança e responsabilidade](#113-segurança-e-responsabilidade)
- [12. Fila, prioridade e ausência de reserva](#12-fila-prioridade-e-ausência-de-reserva)
- [13. Ociosidade](#13-ociosidade)
- [14. Mapa: descoberta PWA e operação administrativa](#14-mapa-descoberta-pwa-e-operação-administrativa)
  - [14.1 Descoberta](#141-descoberta)
  - [14.2 Recomendação](#142-recomendação)
- [15. Onboarding de uma planta](#15-onboarding-de-uma-planta)
  - [15.1 Fluxo](#151-fluxo)
  - [15.2 Estados](#152-estados)
- [16. Falhas e suporte](#16-falhas-e-suporte)
  - [16.1 Comportamentos](#161-comportamentos)
  - [16.2 Modelo de suporte](#162-modelo-de-suporte)
- [17. KPIs, relatórios e notificações](#17-kpis-relatórios-e-notificações)
  - [17.1 KPIs GoodWe](#171-kpis-goodwe)
  - [17.2 KPIs do estabelecimento](#172-kpis-do-estabelecimento)
  - [17.3 Famílias de relatórios](#173-famílias-de-relatórios)
  - [17.4 Notificações](#174-notificações)
- [18. Inteligência artificial em nível de produto](#18-inteligência-artificial-em-nível-de-produto)
- [19. Hardware demonstrativo](#19-hardware-demonstrativo)
- [20. Não-escopo e roadmap](#20-não-escopo-e-roadmap)
  - [20.1 Fora da v1.0](#201-fora-da-v10)
  - [20.2 Roadmap possível](#202-roadmap-possível)
- [21. Critérios de conclusão do produto v1.0](#21-critérios-de-conclusão-do-produto-v10)
  - [21.1 Critérios transversais](#211-critérios-transversais)
- [22. Dependências e parâmetros para as specs](#22-dependências-e-parâmetros-para-as-specs)
- [Apêndice A. Registro consolidado de decisões](#apêndice-a-registro-consolidado-de-decisões)
- [Apêndice B. Glossário](#apêndice-b-glossário)
- [Apêndice C. Base de referência e ressalvas](#apêndice-c-base-de-referência-e-ressalvas)

## 1. Resumo executivo

**ChargeGrid Intelligence** é uma plataforma comercial de recarga pertencente ao ecossistema GoodWe, separada do SEMS+, que utiliza dados energéticos e operacionais da infraestrutura GoodWe para viabilizar sessões, tarifação, pagamento, fila, ociosidade, gestão comercial e experiência do motorista.

**Proposta de valor.** O ChargeGrid transforma a infraestrutura de recarga em uma operação gerenciável, sustentável e monetizável.

A versão v1.0 combina quatro perspectivas complementares:

- **GoodWe:** visão agregada da rede comercial, comissão, desempenho e oportunidades de expansão

- **Estabelecimento:** gestão operacional, energética, comercial e financeira da própria planta

- **Motorista cadastrado:** descoberta, fila, pagamento, sessão, histórico e conveniência recorrente

- **Visitante:** recarga de oportunidade por QR Code, sem cadastro obrigatório

A implementação demonstrativa deve preservar a arquitetura de produto mesmo quando a integração real não estiver disponível. Nesse caso, um GoodWe Adapter consome uma Mock OpenAPI coerente com o contrato documentado, enquanto o núcleo comercial permanece desacoplado da fonte técnica.

### 1.1 Decisões executivas congeladas

- Plataforma administrativa única, com visões por papel para GoodWe e estabelecimento, além de PWA para motoristas.

- SEMS+ permanece como plataforma de monitoramento energético; SolarGo permanece como ferramenta de configuração/comissionamento local.

- OpenAPI fornece a fronteira técnica; ChargeGrid mantém a verdade comercial.

- Comissão demonstrativa parametrizável de 5% sobre a receita bruta liquidada da sessão.

- Pagamento garantido antes da liberação da recarga.

- Controle de demanda v1 por admissão, StartCharge e StopCharge; sem prometer ajuste contínuo de potência.

- Sem reserva antecipada; fila por estabelecimento, prioridade para cadastrados e FIFO dentro de cada classe.

- IA recomenda e prevê; motor de regras valida; a interface comunica.

## 2. Visão do produto e contexto GoodWe

### 2.1 O desafio

O desafio é transformar uma solução de recarga de origem residencial em uma operação comercial inteligente, gerenciável, sustentável e monetizável. O contexto comercial adiciona múltiplos usuários, garantia de pagamento, maior pressão de demanda, necessidade de gestão operacional, informação em tempo real e integração com o conjunto energético da planta.

Os quatro pilares considerados são controle de demanda, protocolos abertos, tarifação e pagamento, e inteligência artificial aplicada. Eles são diretrizes técnicas do desafio e não devem ser apresentados como falhas da GoodWe.

### 2.2 Posicionamento

**Definição oficial de produto.** ChargeGrid Intelligence é a camada comercial e operacional de recarga do ecossistema GoodWe. Não é uma empresa independente, um CPO autônomo, uma substituição do SEMS+ ou um substituto do SolarGo.

A GoodWe deve ser apresentada como empresa de energia inteligente, com geração solar, inversores, baterias, medição, carregadores, monitoramento e gestão. O ChargeGrid amplia esse ecossistema na direção da operação comercial de EVs.

### 2.3 Princípios do produto

- **Recarga de oportunidade:** o QR Code adquire o usuário; a conta fideliza

- **Transparência:** preço e regras relevantes aparecem antes da autorização

- **Segurança financeira:** energia só é liberada após garantia válida

- **Sustentabilidade operacional:** solar, bateria, rede e pico informam decisões, sem reduzir sustentabilidade ao uso do veículo elétrico

- **Automação limitada:** decisões automáticas respeitam limites e comandos documentados

- **Separação de verdades:** GoodWe é fonte técnica; ChargeGrid é fonte comercial

## 3. Ecossistema, arquitetura e fronteiras

### 3.1 Papel de SEMS+, SolarGo e HCA G2

- **SEMS+:** fonte prática de observação de plantas, dispositivos, energia, alarmes e histórico técnico; não é recriado pelo ChargeGrid

- **SolarGo:** configuração e comissionamento local; o ChargeGrid não assume esse papel

- **GoodWe HCA G2 / GW7K-HCA-20:** equipamento AC de referência, nominalmente 7 kW, monitorável no ecossistema GoodWe; não deve ser descrito como eletroposto comercial completo

- **RFID:** mecanismo local de autorização, não solução completa de pagamento comercial

### 3.2 Arquitetura conceitual

```text
GOODWE CLOUD / SEMS+ / GOODWE OPENAPI
|
GOODWE ADAPTER
|
CHARGEGRID CORE
/ \\
ADMINISTRATIVE WEB DRIVER PWA
GoodWe + estabelecimento visitante + cadastrado
```

No protótipo, o GoodWe Adapter aponta para uma Mock OpenAPI. Em produção, apontaria para a OpenAPI real, mediante acesso, homologação e compatibilidade confirmada. A lógica de sessão, tarifa, pagamento e fila não deve depender diretamente da implementação do mock.

### 3.3 Fontes da verdade

| **Domínio**          | **Fonte de verdade** | **Exemplos**                                                                                                                            |
|----------------------|----------------------|-----------------------------------------------------------------------------------------------------------------------------------------|
| Técnico e energético | GoodWe               | Planta, dispositivo, telemetria, potência, energia, solar, bateria, rede, alarmes, conexão/estado do EV Charger e histórico disponível. |
| Comercial            | ChargeGrid           | Estabelecimento, motorista, sessão comercial, tarifa, pagamento, fila, ociosidade, comissão, disponibilidade comercial e recomendação.  |
| Financeiro           | Gateway + ChargeGrid | Autorização, captura, pré-pagamento, devolução, liquidação, pendência e disputa.                                                        |

### 3.4 Matriz de capacidades

| **Capacidade**                                                     | **Classificação**     | **Limite de afirmação**                                                                          |
|--------------------------------------------------------------------|-----------------------|--------------------------------------------------------------------------------------------------|
| Consulta de plantas, dispositivos, telemetria, histórico e alarmes | REAL / DOCUMENTADO    | Tratar como domínio da OpenAPI de referência; uso efetivo depende de autorização e credenciais.  |
| StartCharge e StopCharge para EV Charger                           | REAL / DOCUMENTADO    | Ações documentadas; execução no HCA G2 específico ainda requer validação e resposta assíncrona.  |
| Campos de estado, potência, energia e duração de carga             | REAL / DOCUMENTADO    | Podem estruturar o mock; disponibilidade por modelo/planta deve ser validada.                    |
| Mock OpenAPI e dados de cenário                                    | SIMULADO NO PROTÓTIPO | Valores e eventos são sintéticos; contrato e nomenclatura devem seguir a referência.             |
| Pagamentos, tarifa, fila, ociosidade e comissão                    | SIMULADO NO PROTÓTIPO | São capacidades do ChargeGrid, não da OpenAPI GoodWe.                                            |
| SetPowerLimit, PauseCharge, ResumeCharge ou balanceamento fino     | FUTURO / NÃO VALIDADO | Não atribuir à OpenAPI atual; demonstrar separadamente apenas como conceito de produto/hardware. |
| OCPP no HCA G2 de referência                                       | FUTURO / NÃO VALIDADO | Não assumir suporte. Interoperabilidade multi-fabricante fica fora da v1.                        |
| Operação financeira real e split                                   | FUTURO / NÃO VALIDADO | Depende de gateway, contratos, fiscalidade, risco e homologação.                                 |

## 4. Modelo de negócio

### 4.1 Cadeia de valor

```text
GOODWE -> DISTRIBUIDOR / INTEGRADOR -> ESTABELECIMENTO -> MOTORISTA
tecnologia venda/instalacao operacao consumo
```

O ChargeGrid pertence ao portfólio GoodWe e é levado ao estabelecimento dentro da cadeia comercial existente. O integrador participa de dimensionamento, instalação, cadastro e comissionamento, mas não opera a recarga comercial por padrão.

### 4.2 Hipótese de monetização v1.0

**Hipótese demonstrativa.** A GoodWe recebe uma taxa de plataforma parametrizável equivalente a 5% da receita bruta liquidada das sessões. O percentual demonstra recorrência ligada ao uso, mas não constitui compromisso comercial definitivo.

```text
energia + ociosidade - descontos - devolucoes = receita bruta liquidada
comissao ChargeGrid = 5% x receita bruta liquidada
liquido financeiro = receita bruta liquidada - comissao - taxas do pagamento
resultado estimado = liquido financeiro - custo energetico - custos operacionais considerados
```

A tarifa ao motorista é o preço final do serviço definido pelo estabelecimento. A participação GoodWe é B2B e não aparece como sobretaxa separada ao consumidor. Taxas financeiras, custo energético e custo operacional são exibidos separadamente para não confundir liquidação com rentabilidade.

### 4.3 Responsabilidades comerciais

- **Estabelecimento:** define preço dentro das políticas, opera localmente, arca com energia e custos locais e recebe a maior parcela

- **GoodWe / ChargeGrid:** fornece ecossistema tecnológico, plataforma, integrações, inteligência e visão agregada

- **Gateway:** garante e liquida o pagamento segundo suas capacidades; não é escolhido neste documento

- **Integrador:** implanta e apoia o ciclo técnico, sem interface ChargeGrid própria na v1

## 5. Atores, papéis e permissões

| **Papel**                         | **Pode**                                                                                                                                                     | **Não pode / limite**                                                                             |
|-----------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| GoodWe / Administrador ChargeGrid | Ver rede, plantas, sessões, volume, comissão, indicadores, incidentes; habilitar/suspender planta; parametrizar comissão global; acessar suporte e expansão. | Não substitui a configuração técnica do SEMS+/SolarGo e não opera a rotina local sem necessidade. |
| Administrador do estabelecimento  | Gerir suas plantas, tarifa, horários, ociosidade, políticas, carregadores, pagamentos, receita, fila, relatórios, operadores e comandos permitidos.          | Não acessa outras plantas nem parâmetros globais GoodWe.                                          |
| Operador do estabelecimento       | Ver operação, sessões, fila, carregadores e incidentes; iniciar/parar quando autorizado; retirar equipamento de serviço.                                     | Não altera tarifa, comissão, gateway ou política financeira sensível.                             |
| Integrador / instalador           | Dimensionar, instalar, cadastrar/comissionar e apoiar habilitação/suporte quando autorizado.                                                                 | Não possui aplicação ChargeGrid própria nem papel de operador comercial na v1.                    |
| Motorista cadastrado              | Perfil, veículos, pagamentos, mapa, fila, sessão própria, top-up, histórico e comprovantes.                                                                  | Não acessa administração; prioridade não equivale a reserva.                                      |
| Visitante                         | QR, condições, limite, pagamento, sessão própria e comprovante pontual.                                                                                      | Sem histórico persistente completo, veículo salvo, favoritos ou prioridade de fila.               |

## 6. Escopo funcional e superfícies

### 6.1 Web administrativa

Uma única aplicação web oferece experiências por papel.

- **Visão GoodWe:** rede comercial, plantas habilitadas, carregadores, sessões, energia, volume financeiro, comissão, disponibilidade, incidentes, saturação e expansão

- **Visão estabelecimento:** dashboard, carregadores, sessões, operação comercial, energia e sustentabilidade, tarifa, fila, pagamentos, relatórios e recomendações

### 6.2 PWA do motorista

- Acesso por QR sem instalação e sem conta obrigatória.

- Conta opcional para recorrência, pagamentos salvos, veículos, mapa, fila, favoritos, histórico e notificações.

- Mapa de estabelecimentos, não de conectores individuais.

- Acompanhamento de tarifa, limite, energia, custo, estado e avisos da sessão.

### 6.3 ChargeGrid Core

- Sessões e máquina de estados comercial.

- Tarifação e segmentação temporal de preço.

- Orquestração de pagamento e liquidação.

- Fila, ociosidade e disponibilidade comercial.

- Motor de regras e integração com recomendações preditivas.

- Auditoria, notificações, relatórios e conciliação.

- GoodWe Adapter desacoplado da lógica comercial.

## 7. Jornadas principais

### 7.1 Visitante: recarga de oportunidade

```text
encontra carregador -> escaneia QR -> ve preco/potencia/fila
-> define limite -> escolhe Pix/cartao -> garantia confirmada
-> regras operacionais -> StartCharge -> acompanha -> encerra
-> tolerancia/ociosidade se aplicavel -> liquidacao -> comprovante
```

### 7.2 Motorista cadastrado

```text
PWA -> mapa -> estabelecimento -> recomendacao/disponibilidade
-> fila se necessario -> pagamento salvo ou novo -> recarga
-> notificacoes -> liquidacao -> historico/comprovante
```

### 7.3 Estabelecimento

```text
dashboard -> acompanha energia, demanda e operacao
-> configura envelope comercial/energetico -> ChargeGrid admite ou bloqueia
-> acompanha sessoes/falhas/fila -> recebe resultado financeiro e relatorios
```

### 7.4 GoodWe

```text
rede comercial -> plantas -> utilizacao/disponibilidade
-> volume/comissao -> incidentes -> saturacao -> oportunidade de expansao
```

## 8. Sessão comercial

### 8.1 Máquina de estados

```text
SESSION_CREATED -> AWAITING_PAYMENT -> AUTHORIZED -> WAITING_START
-> STARTING -> CHARGING -> ENERGY_FINISHED -> IDLE_GRACE_PERIOD
-> IDLE_FEE (se aplicavel) -> SETTLING -> COMPLETED
```

Durante CHARGING, o estado comercial SUSPENDED_BY_DEMAND pode ocorrer. Ele não representa um comando PauseCharge. Na v1, a execução física correspondente é StopCharge e, quando as condições voltarem e o veículo continuar conectado, um novo StartCharge.

### 8.2 Estados de exceção

- PAYMENT_FAILED: garantia não confirmada; a sessão não inicia.

- START_FAILED: comando não confirmado; pagamento é liberado/devolvido conforme o meio.

- FAULTED: falha técnica antes ou durante a energia.

- CANCELLED: cancelamento antes do início ou encerramento autorizado.

- SETTLEMENT_PENDING: valor final definido, mas liquidação ainda não confirmada.

- DISPUTED: contestação posterior reabre a transação.

- OUTSTANDING_BALANCE: valor devido excede a garantia disponível.

### 8.3 Motivos de encerramento energético

- Limite financeiro atingido.

- Veículo deixa de aceitar energia ou a entrega cessa de forma confirmada.

- Motorista encerra a própria sessão.

- Controle de demanda executa StopCharge.

- Falha técnica exige interrupção.

- Operador autorizado encerra por exceção registrada.

### 8.4 Regras de medição

O custo acumulado utiliza somente energia/tempo confirmados pela fonte técnica e os segmentos tarifários aceitos. O ChargeGrid não inventa consumo durante perda de comunicação. O encerramento energético e o encerramento comercial são distintos: após a energia terminar, a sessão pode continuar aberta para tolerância e ociosidade.

## 9. Pagamentos e liquidação

### 9.1 Princípio

**Regra central.** Identificar -> garantir pagamento -> liberar energia -> medir -> calcular -> liquidar. A cobrança nunca depende de reter fisicamente o veículo.

### 9.2 Cartão

- Pré-autorização do limite escolhido pelo motorista, conforme suporte do gateway.

- Captura posterior do valor efetivamente devido.

- Liberação do saldo não capturado.

- Falha de captura gera SETTLEMENT_PENDING e tentativas idempotentes antes de revisão manual.

### 9.3 Pix

- Pré-pagamento do limite financeiro.

- Consumo e ociosidade são deduzidos do saldo garantido.

- Saldo não utilizado é devolvido após a conclusão comercial.

- A sessão só é liquidada após confirmação da devolução, quando houver.

### 9.4 Limite e top-up

Limites mínimo e máximo são configuráveis. Ao se aproximar do saldo, o motorista é notificado e pode ampliar a autorização ou realizar top-up. Se não houver extensão, a energia é encerrada antes de ultrapassar o limite, considerando margem técnica e confirmação assíncrona.

### 9.5 Exceções

- Falha antes do início: nenhuma energia é liberada; cartão é liberado e Pix devolvido integralmente.

- Falha durante a recarga: cobrar apenas consumo confirmado; sem ociosidade.

- Gateway indisponível antes da sessão: não iniciar.

- Disputa posterior: preservar auditoria e reabrir a transação como DISPUTED.

## 10. Tarifação dinâmica

### 10.1 Perfil energético-tarifário

Cada planta possui um perfil configurado no onboarding: mercado cativo ou livre, distribuidora, grupo/subgrupo, modalidade, postos horários, custo energético de referência, demanda contratada ou limite operacional, bandeira quando aplicável e limites comerciais mínimo/máximo.

**Regra de negócio.** O ChargeGrid não repassa automaticamente a tarifa da distribuidora. O estabelecimento define um preço comercial de recarga; o custo de energia é um dos sinais usados para formá-lo.

### 10.2 Fatores

- Tarifa base comercial definida pelo estabelecimento.

- Custo energético por posto horário ou condição contratual equivalente.

- Estado de demanda da planta para novas sessões.

- Condição energética local, como excedente solar favorável.

- Bandeira tarifária quando aplicável.

- Limites mínimo e máximo configurados.

Fila e lotação não elevam o preço. Esses sinais influenciam recomendação, capacidade e tempo de espera, evitando surge pricing por escassez.

### 10.3 Mudança durante a sessão

O modelo é híbrido e previsível: mudanças programadas de posto tarifário podem criar segmentos durante a sessão, desde que exibidas antes do aceite. Mudanças instantâneas de demanda ou solar afetam apenas ofertas para novas sessões, não alteram silenciosamente uma sessão já iniciada.

```text
17:30-17:59 -> tarifa A aceita
18:00-18:42 -> tarifa B previamente informada
```

## 11. Controle de demanda

### 11.1 Escopo v1

A v1 usa admissão e interrupção de sessões com StartCharge e StopCharge. Não promete ajuste contínuo de potência individual, resposta elétrica instantânea, proteção de rede ou um comando nativo de pausa/retomada.

```text
NORMAL: novas sessoes podem iniciar
ALERTA: restringir novos inicios e preservar sessoes existentes
CRITICO: bloquear novos inicios e, se necessario, aplicar StopCharge
```

### 11.2 Prioridade

Para admissão: cadastrados antes de visitantes; dentro da classe, FIFO. Para redução de carga: interromper primeiro visitantes e, dentro da classe, a sessão mais recente; depois cadastrados, também da mais recente para a mais antiga. O objetivo é preservar quem já recebeu serviço por mais tempo.

### 11.3 Segurança e responsabilidade

- Proteções físicas e controles estruturais permanecem na infraestrutura elétrica/GoodWe.

- O despacho é tratado como assíncrono; a interface mostra pedido, confirmação ou falha.

- Reinício após demanda depende de veículo conectado, sessão válida, garantia financeira e condição segura.

- Toda interrupção automática gera motivo, auditoria e notificação.

## 12. Fila, prioridade e ausência de reserva

- Fila por estabelecimento, atendida pelo primeiro carregador compatível disponível.

- Prioridade: motorista cadastrado; depois visitante; FIFO dentro de cada classe.

- Uma única fila ChargeGrid ativa por motorista.

- Janela de 10 minutos quando chamado, com aviso imediato e lembrete aos 5 minutos restantes.

- Ausência após 10 minutos perde a vez; o motorista pode voltar ao fim da fila.

- Quem já foi chamado não é ultrapassado por nova chegada.

- Não existe reserva antecipada na v1.

A previsão inicial de espera é determinística, baseada em sessões ativas, duração média, energia/tempo atual, quantidade de carregadores e posição. A IA pode melhorar a estimativa no futuro, sempre como previsão e nunca como garantia.

## 13. Ociosidade

```text
energia confirmadamente encerrada -> 15 min gratuitos -> avisos
-> veiculo ainda conectado -> taxa por minuto -> desconexao -> liquidacao
```

- Tolerância padrão de 15 minutos, configurável dentro de limites da plataforma.

- Referência demonstrativa de R$ 0,50/minuto.

- Limite padrão de cobrança de 60 minutos.

- O estabelecimento pode desativar a cobrança.

- Interrupção por demanda, falha técnica ou comunicação incerta não inicia ociosidade.

- Desconexão encerra imediatamente a ociosidade.

- Saldo insuficiente pode gerar OUTSTANDING_BALANCE; cadastrado fica bloqueado para novas sessões até regularização.

## 14. Mapa: descoberta PWA e operação administrativa

### 14.1 Descoberta

O mapa de descoberta é exclusivo da experiência do motorista. Ele se inspira na lógica de navegação do SEMS+ mobile, mas responde a uma pergunta comercial: qual é a melhor opção para carregar agora?

O Admin Web também possui mapa operacional próprio para plantas comerciais vinculadas à conta. A GoodWe visualiza a rede autorizada; o estabelecimento visualiza as próprias plantas. Essa superfície não duplica telemetria bruta nem a jornada de descoberta do motorista: consolida escopo comercial, disponibilidade, alertas e oportunidade de expansão.

- Marcador por estabelecimento/planta comercial, com clusters em zoom afastado.

- Estados visuais: disponível, parcialmente ocupado, lotado/com fila, indisponível e falha.

- Locais temporariamente indisponíveis permanecem visíveis com motivo; desativados ou privados podem ser ocultados.

- Bottom sheet com nome, distância, disponibilidade, potência nominal, tarifa, fila, espera e horário.

- Potência nominal aparece como 'até 7 kW'; potência real somente durante a sessão.

### 14.2 Recomendação

A ordenação privilegia locais abertos e disponíveis. Entre alternativas equivalentes, considera fila, espera, distância, potência, tarifa e condição energética favorável. Previsões são identificadas como estimativas.

**Separação essencial.** SEMS+ mostra onde estão os ativos. ChargeGrid mostra onde faz sentido carregar. Um carregador pode estar tecnicamente online e comercialmente fechado.

## 15. Onboarding de uma planta

### 15.1 Fluxo

```text
planta GoodWe existente -> autorizar acesso -> validar planta
-> detectar EV Chargers -> criar perfil comercial -> configurar operacao
-> validar integracao -> publicar no mapa/PWA
```

1.  Vincular uma planta GoodWe acessível e obter identificação, nome, localização, timezone, dispositivos e EV Chargers.

2.  Validar elegibilidade: acesso, carregador detectado, estado operacional, localização e permissões.

3.  Criar perfil comercial: nome, endereço público, horário, contato, acesso público/restrito e equipamentos publicados.

4.  Definir política energética: limite EV/planta, estados normal/alerta/crítico e admissão.

5.  Configurar perfil tarifário: mercado, distribuidora/contrato, modalidade, períodos, custo, tarifa base e limites.

6.  Configurar operação comercial: gateway, meios de pagamento, comissão de 5%, fila, ociosidade e regras locais.

7.  Identificar carregadores: nome comercial, vaga, QR, potência nominal e disponibilidade pública.

8.  Validar leitura, estado, telemetria, ações permitidas e fluxo comercial.

9.  Publicar a planta como ACTIVE.

### 15.2 Estados

```text
DRAFT -> VALIDATING -> READY -> ACTIVE -> SUSPENDED
```

ChargeGrid não recadastra tecnicamente a planta nem substitui o comissionamento. Ele adiciona o perfil comercial a uma planta GoodWe existente e autorizada.

## 16. Falhas e suporte

### 16.1 Comportamentos

| **Cenário**                    | **Comportamento do ChargeGrid**                                                                 | **Efeito financeiro**                                  |
|--------------------------------|-------------------------------------------------------------------------------------------------|--------------------------------------------------------|
| FAULT/OFFLINE antes da recarga | Indisponibilizar; bloquear nova sessão; informar motorista e gestor.                            | Liberar pré-autorização ou devolver Pix integralmente. |
| Falha durante CHARGING         | Interromper; usar último consumo confirmado; indisponibilizar equipamento; registrar incidente. | Cobrar só consumo válido; sem ociosidade.              |
| Perda de OpenAPI/telemetria    | Não iniciar novas sessões; mostrar monitoramento indisponível; aguardar reconciliação.          | Não inventar consumo nem iniciar ociosidade.           |
| Gateway indisponível           | Antes: não iniciar. Depois: manter estado financeiro pendente e repetir com idempotência.       | SETTLEMENT_PENDING até confirmação.                    |
| Estabelecimento fechado        | commercialAvailability=CLOSED mesmo com equipamento online.                                     | Não autorizar nova sessão.                             |

### 16.2 Modelo de suporte

O ChargeGrid organiza o incidente comercialmente e exibe equipamento, planta, horário, erro, última telemetria, sessão afetada e status. O atendimento técnico continua nos canais GoodWe/integrador. A v1 não cria um help desk completo, RMA, CRM ou substituto do centro de serviço existente.

## 17. KPIs, relatórios e notificações

### 17.1 KPIs GoodWe

- Plantas e carregadores comerciais ativos/indisponíveis.

- Sessões, energia entregue e volume financeiro processado.

- Comissão ChargeGrid gerada.

- Utilização média e disponibilidade comercial.

- Fila recorrente, sessões não atendidas e saturação.

- Incidentes relevantes e oportunidades de expansão.

### 17.2 KPIs do estabelecimento

- Sessões ativas; carregadores disponíveis/ocupados; energia do dia.

- Receita bruta, comissão, taxas, líquido previsto, tarifa média e ticket médio.

- Fila atual, espera média, utilização e receita de ociosidade.

- Demanda atual e estado energético normal/alerta/crítico.

- Sessões interrompidas, falhas e recomendação operacional.

### 17.3 Famílias de relatórios

| **Relatório**          | **Conteúdo mínimo**                                                                                  |
|------------------------|------------------------------------------------------------------------------------------------------|
| Sessões                | Período, carregador, identidade permitida, início/fim, kWh, duração, tarifa, valor, estado e motivo. |
| Financeiro             | Receita, descontos/devoluções, ociosidade, comissão, taxas, líquido, pendências e disputas.          |
| Carregadores           | Utilização, sessões, energia, receita, tempo ocupado, falhas e indisponibilidade.                    |
| Operacional/energético | Demanda, EV, solar, bateria, rede, períodos críticos e sessões restringidas/interrompidas.           |
| Fila/capacidade        | Fila média/máxima, espera, não atendidos, picos, utilização e sinais de saturação.                   |

### 17.4 Notificações

| **Público**     | **Eventos relevantes**                                                                                                                                                         |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Motorista       | Pagamento aprovado/recusado; fila; vez e prazo; início/interrupção/reinício; limite/top-up; término; tolerância/ociosidade; falha; liquidação; devolução; pendência/disputa.   |
| Estabelecimento | FAULT/offline; perda prolongada; estado crítico; interrupção por demanda; fila acima do limite; falha financeira acionável; mudança de disponibilidade; incidente persistente. |
| GoodWe          | Incidente persistente; planta suspensa; degradação de disponibilidade; saturação/expansão; anomalia financeira agregada.                                                       |

## 18. Inteligência artificial em nível de produto

**Propósito.** A IA preditiva utiliza históricos energéticos, operacionais e comerciais para antecipar demanda, ocupação, tempo de espera e saturação, gerando recomendações para motorista, estabelecimento e GoodWe.

```text
dados confirmados -> IA preve/recomenda -> motor de regras valida
-> ChargeGrid comunica -> acao permitida ou decisao humana
```

- Não toma decisões críticas sem validação determinística.

- Não substitui proteção elétrica, BMS, controles físicos ou operador.

- Pode apoiar estimativa de espera, condição de demanda, recomendação tarifária e oportunidade de expansão.

- Modelo, algoritmo, dataset, features finais, treinamento e métricas ficam para uma especificação própria.

- Indisponibilidade da IA não bloqueia a operação: regras e estimativas determinísticas permanecem como fallback.

## 19. Hardware demonstrativo

O hardware da apresentação é uma prova de conceito visual e não uma alegação de integração produtiva com o HCA G2. Seu objetivo é tornar observável o ciclo de decisão do ChargeGrid.

```text
cenario de demanda muda -> telemetria simulada chega ao core
-> regra/IA recomenda -> regra valida -> comando permitido e enviado
-> carga demonstrativa inicia, para e reinicia -> interfaces atualizam
```

- Demonstrar admissão, StartCharge, StopCharge, falha e recuperação.

- Se houver variação física de potência no protótipo, rotulá-la como simulação de comportamento futuro, não como comando da OpenAPI atual.

- MODBUS, RS-485 ou outro arranjo da bancada pertencem à conectividade da demonstração; não devem ser atribuídos automaticamente ao fluxo produtivo.

- Nenhum equipamento de baixa tensão representa proteção elétrica real ou homologação comercial.

## 20. Não-escopo e roadmap

### 20.1 Fora da v1.0

- Reserva antecipada de carregador.

- OCPP atribuído ao HCA G2, roaming ou interoperabilidade nacional entre CPOs.

- Suporte multi-fabricante e operação de carregadores de terceiros.

- SetPowerLimit, PauseCharge/ResumeCharge nativos ou balanceamento contínuo garantido.

- Proteção elétrica instantânea, VPP, mercado de energia ou operação de rede.

- CRM, ERP, gestão de vendedores, contratos completos, faturamento fiscal e RMA.

- Integração com estacionamento, placa, ticket, fidelidade ou créditos corporativos como fluxo padrão.

- Chatbot ChargeGrid próprio; o assistente GoodWe existente pode ser integrado futuramente.

- Aplicação própria para integrador.

- Substituição do SEMS+ ou SolarGo.

- Operação financeira produtiva sem gateway, contratos e homologação.

### 20.2 Roadmap possível

- Validação real de credenciais, permissões e comandos na GoodWe OpenAPI/HCA G2.

- Pagamento gerenciado, conciliação e serviços financeiros avançados.

- Controle de potência confirmado e balanceamento dinâmico.

- IA treinada e monitorada com dados reais.

- Multi-fabricante, se alinhado à estratégia GoodWe.

- Integrações locais com estacionamento e benefícios.

- Reserva apenas após evidência de valor e política antifraude/no-show.

## 21. Critérios de conclusão do produto v1.0

O produto é funcionalmente concluído quando as quatro jornadas abaixo puderem ser demonstradas de ponta a ponta com estados, exceções, auditoria e separação explícita entre real e simulado.

| **Jornada**     | **Critério de aceite**                                                                                                                                       |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Visitante       | QR -> condições -> limite -> garantia -> StartCharge -> acompanhamento -> encerramento -> ociosidade quando aplicável -> liquidação -> comprovante. |
| Cadastrado      | Mapa -> escolha/recomendação -> fila -> pagamento -> recarga -> notificações -> histórico.                                                             |
| Estabelecimento | Dashboard -> envelope energético/comercial -> decisão de admissão/interrupção -> sessão -> incidente -> resultado financeiro/relatório.                 |
| GoodWe          | Rede -> planta -> utilização/disponibilidade -> volume/comissão -> incidente -> saturação/oportunidade de expansão.                                     |

### 21.1 Critérios transversais

- Nenhuma energia comercial é liberada sem garantia financeira válida.

- Nenhum consumo é calculado além da última medição confirmada.

- Estados e comandos assíncronos são auditáveis e visíveis.

- Simulação e capacidade futura são rotuladas em todas as interfaces de demonstração relevantes.

- A operação continua de forma segura sem IA, usando regras determinísticas.

- Permissões impedem que atores alterem parâmetros fora de sua responsabilidade.

- Tarifa aceita e transições previstas são transparentes para o motorista.

- Falhas não geram ociosidade indevida e são conciliadas após recuperação de comunicação.

## 22. Dependências e parâmetros para as specs

As decisões de produto estão fechadas. Os itens abaixo permanecem configuráveis ou dependem de especificação técnica; não reabrem a proposta de valor.

- Gateway de pagamento, métodos habilitados e comportamento exato de pré-autorização/devolução.

- Limites monetários mínimo/máximo e margem de encerramento.

- Faixas permitidas de tolerância e taxa de ociosidade.

- Limiares numéricos de normal, alerta e crítico por planta.

## Adendo de direção aprovado — 20 de agosto de 2026

Este adendo substitui, onde houver conflito, orientações anteriores sobre a identidade visual do Admin e sobre a ausência de mapa administrativo. As demais decisões de produto v1.0 permanecem inalteradas.

### ChargeGrid como extensão comercial do SEMS+

O ChargeGrid passa a ser apresentado como uma extensão comercial e operacional nativa do ecossistema SEMS+, e não apenas como uma interface inspirada nele. A planta energética cadastrada no SEMS+ é a origem da informação técnica; o ChargeGrid a habilita comercialmente e acrescenta somente dados que o SEMS+ não cobre: disponibilidade comercial, tarifas, sessões, pagamentos, fila, ociosidade, comissão e indicadores comerciais.

### Conta de estabelecimento e múltiplas plantas

Não há um tipo de conta distinto para redes. Uma mesma conta de estabelecimento pode ter uma ou várias plantas SEMS+ vinculadas. A diferença entre uma unidade e uma rede é apenas a cardinalidade de plantas visíveis no mesmo dashboard, filtros, KPIs e mapa. As permissões e a visão comercial continuam sendo as da conta autenticada.

### Mapa administrativo de plantas comerciais

Além do mapa de descoberta da PWA, o Admin Web passa a ter um mapa operacional real do Google Maps. Ele mostra as plantas vinculadas ao escopo da conta: a GoodWe visualiza a rede autorizada e o estabelecimento visualiza apenas suas próprias plantas. Marcadores e clusters comunicam disponibilidade comercial, alertas, falhas, saturação e oportunidade de expansão; o mapa administrativo não substitui a descoberta do motorista.

O mapa usa uma chave de API de demonstração somente por variável de ambiente local. A ausência da chave deve produzir uma experiência de fallback clara; nenhuma chave é versionada, exposta em documentação ou tratada como integração GoodWe.

- Contrato detalhado do GoodWe Adapter e mapeamento de campos do mock.

- Política de idempotência, retentativas, reconciliação e auditoria.

- Regras de privacidade, retenção, LGPD, antifraude, fiscalidade e chargeback.

- Modelo de IA, dados, avaliação, monitoramento e governança.

## Apêndice A. Registro consolidado de decisões

| **ID** | **Tema**   | **Decisão**                                                                | **Status** |
|--------|------------|----------------------------------------------------------------------------|------------|
| D01    | Produto    | Camada comercial nativa do ecossistema SEMS+, sem substituir SEMS+ ou SolarGo. | ATUALIZADO |
| D02    | Integração | GoodWe Adapter com mock compatível agora e OpenAPI real futuramente.       | FECHADO    |
| D03    | Negócio    | Comissão demonstrativa parametrizável de 5% sobre receita bruta liquidada. | FECHADO    |
| D04    | Aquisição  | Visitante usa QR sem conta; conta melhora recorrência.                     | FECHADO    |
| D05    | Pagamento  | Garantia anterior à energia; cartão captura uso; Pix devolve saldo.        | FECHADO    |
| D06    | Tarifa     | Preço comercial dinâmico e previsível; postos podem segmentar sessão.      | FECHADO    |
| D07    | Demanda    | Admissão + StartCharge/StopCharge; sem limite contínuo presumido.          | FECHADO    |
| D08    | Fila       | Por estabelecimento; cadastrado antes; FIFO; janela de 10 min.             | FECHADO    |
| D09    | Reserva    | Fora da v1.                                                                | FECHADO    |
| D10    | Ociosidade | 15 min; R$ 0,50/min demonstrativo; teto de 60 min.                        | FECHADO    |
| D11    | Mapa       | PWA para descoberta do motorista; Admin para operação das plantas autorizadas. | ATUALIZADO |
| D12    | Suporte    | ChargeGrid organiza incidente; atendimento segue GoodWe/integrador.        | FECHADO    |
| D13    | Onboarding | Habilitação comercial de planta GoodWe já existente.                       | FECHADO    |
| D14    | IA         | Prevê/recomenda; regras validam; não bloqueia documento.                   | FECHADO    |
| D15    | Integrador | Sem interface própria na v1.                                               | FECHADO    |
| D16    | Hardware   | Demonstra ciclo de decisão; não prova integração produtiva.                | FECHADO    |

## Apêndice B. Glossário

| **Termo**                 | **Definição no documento**                                                                     |
|---------------------------|------------------------------------------------------------------------------------------------|
| Planta                    | Unidade energética/operacional GoodWe à qual dispositivos e dados estão vinculados.            |
| Estabelecimento           | Entidade comercial que apresenta a recarga ao motorista e opera a planta habilitada.           |
| Sessão energética         | Período em que há entrega de energia confirmada ao veículo.                                    |
| Sessão comercial          | Ciclo completo de autorização, energia, ociosidade, cálculo e liquidação.                      |
| Disponibilidade técnica   | Estado derivado do equipamento e da conectividade GoodWe.                                      |
| Disponibilidade comercial | Estado ChargeGrid que também considera horário, política, fila, pagamento e acesso.            |
| Receita bruta liquidada   | Energia + ociosidade - descontos - devoluções, após consolidação da sessão.                    |
| SEMS+                     | Plataforma GoodWe de monitoramento e gestão energética considerada como fonte técnica prática. |
| SolarGo                   | Ferramenta GoodWe de configuração e comissionamento local.                                     |
| GoodWe Adapter            | Camada de integração que isola o ChargeGrid dos detalhes da fonte OpenAPI/mock.                |

## Apêndice C. Base de referência e ressalvas

- Contexto consolidado do projeto GOODWE / ChargeGrid Intelligence, arquivo sincronizado no diretório sources do projeto.

- Conversa de definição de produto 'ChargeGrid Inteligente Análise e Soluções', utilizada como registro das decisões funcionais e de negócio.

- Documentação GoodWe OpenAPI disponibilizada pelo projeto em repositório de referência, organizada por consulta básica, monitoramento, despacho remoto, alarmes e apêndices.

- Observações do SEMS+, SolarGo e planta/laboratório usadas como evidência de contexto, sem transformar inferências de interface em contrato técnico.

**Ressalva final.** Este documento define o produto v1.0. Implementação real exige validação de acesso, permissões, compatibilidade do equipamento, gateway de pagamento, requisitos regulatórios, segurança, privacidade e operação assistida.
