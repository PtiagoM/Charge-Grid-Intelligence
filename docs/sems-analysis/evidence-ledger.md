# Evidence ledger

## Convenção

Cada registro usa classificação permitida, confiança, papel/contexto, viewport/tema, ação, resultado, referência visual e sensibilidade. Rotas têm query strings removidas e identificadores são substituídos por placeholders.

| ID | Classificação | Confiança | Papel/contexto | Viewport/tema | Ação | Resultado | Referência visual | Sensibilidade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEMS-CONTEXT-001 | `OBSERVED` | alta | repositório local | n/a | leitura integral dos sete documentos obrigatórios na ordem definida | precedência, fronteiras e regras ChargeGrid consolidadas | nenhuma | normal |
| SEMS-AUTH-001 | `OBSERVED` | alta | conta A autenticada | 1266×712, escuro | autenticar e abrir o menu da conta | papel efetivo exibido: `Distribuidor/Instalador`; organização visível no menu | SEMS-SHELL-002 | anonimizar conta |
| SEMS-AUTH-002 | `OBSERVED` | alta | conta B autenticada manualmente pelo usuário | 1210×1024, escuro | retomar a aba já autenticada e abrir o menu da conta | papel efetivo exibido: `Proprietário` | SEMS-SHELL-003 | anonimizar conta |
| SEMS-SHELL-001 | `OBSERVED` | alta | pré-autenticação | 1266×712, claro | abrir a URL base | formulário de login e aviso de cookies visíveis | SEMS-SHELL-001 | normal; campos vazios |
| SEMS-SHELL-002 | `OBSERVED` | alta | ambos os papéis | múltiplos, escuro | inventariar sidebar e header | sete entradas-raiz iguais, escopo no header, busca, alarmes, idioma e conta | SEMS-SHELL-002; SEMS-SHELL-003 | normal |
| SEMS-DASH-001 | `OBSERVED` | alta | Distribuidor/Instalador | 1266×712, escuro | abrir `#/` | dashboard com mapa, cartões de capacidade/potência/alarmes, economia, energia e ambiente | SEMS-SHELL-002 | normal |
| SEMS-DASH-002 | `OBSERVED` | alta | Proprietário | 1210×1024, escuro | abrir `#/` | dashboard com duas plantas, capacidade agregada e métricas zeradas | SEMS-SHELL-003 | normal |
| SEMS-PLANT-001 | `OBSERVED` | alta | Distribuidor/Instalador | 1266×712, escuro | abrir `#/station_monitor` | três plantas: duas próprias em construção e uma compartilhada em operação | nenhuma; lista continha dados de localização | não capturar |
| SEMS-PLANT-002 | `OBSERVED` | alta | Proprietário | 1210×1024, escuro | abrir `#/station_monitor` | duas plantas de teste, ambas em construção, potência atual e geração zeradas; botão `Nova usina` visível | nenhuma | anonimizar nomes |
| SEMS-PLANT-003 | `OBSERVED` | alta | Distribuidor/Instalador, planta própria de teste | 1266×712, escuro | abrir `#/station_monitor/station_detail?<redacted>` | painel vazio; abas Painel, Dispositivos, Alarmes e Atualização do dispositivo; ação de adicionar dispositivo visível | nenhuma | anonimizar ID |
| SEMS-PLANT-004 | `OBSERVED` | alta | Distribuidor/Instalador, planta compartilhada | 1266×712, escuro | abrir detalhe seguro da planta | planta em operação; abas Painel, Dispositivos e Alarmes; sem aba de atualização; monitoramento energético e de EV visíveis | SEMS-ENERGY-001 | anonimizar planta e IDs |
| SEMS-DEVICE-001 | `OBSERVED` | alta | Distribuidor/Instalador | 1266×712, escuro | abrir `#/device_monitor` | categorias Inversor, Dongle, Carregador veicular e Inversor de terceiros; um inversor operacional e um carregador inativo | nenhuma; números de série presentes | não capturar |
| SEMS-DEVICE-002 | `OBSERVED` | alta | Proprietário | 1210×1024, escuro | abrir `#/device_monitor` | estado global `Sem dados`; nenhum dispositivo acessível | nenhuma | normal |
| SEMS-DEVICE-003 | `OBSERVED` | média | Distribuidor/Instalador, carregador da planta compartilhada | 1266×712, escuro | abrir `#/station_monitor/station_detail/device_detail?<redacted>` | detalhe com estado inativo, conectividade e dados da última carga; abas operacional e de carga | nenhuma; identificadores presentes | não capturar |
| SEMS-ALARM-001 | `OBSERVED` | alta | Distribuidor/Instalador | 1266×712, escuro | abrir `#/alarm_center` | 80 alarmes resolvidos, nenhum em ocorrência; filtros e tabela detalhada | nenhuma | normal |
| SEMS-ALARM-002 | `OBSERVED` | alta | Proprietário | 1210×1024, escuro | abrir `#/alarm_center` | zero alarmes em todas as categorias; estado vazio | nenhuma | normal |
| SEMS-REPORT-001 | `OBSERVED` | alta | ambos os papéis | múltiplos, escuro | abrir `#/report_center` | relatórios de planta e inversor, comparação múltipla, área `Meus relatórios` e assinatura | nenhuma | normal |
| SEMS-ANALYSIS-001 | `OBSERVED` | alta | ambos os papéis | múltiplos, escuro | abrir as três ferramentas analíticas | Diagnóstico IV, Comparação de dados e Consistência da bateria acessíveis; resultados dependem de seleção e ativos | nenhuma | normal |
| SEMS-ORG-001 | `OBSERVED` | alta | Distribuidor/Instalador | 1266×712, escuro | abrir app de configuração | Gestão da organização, lista de usuários e gerenciamento de logs disponíveis | nenhuma; dados pessoais visíveis | não capturar |
| SEMS-ORG-002 | `OBSERVED` | média | Proprietário | 1210×1024, escuro | abrir app de configuração e rota segura de organização | conteúdo exibido permaneceu em assinaturas de alarmes/relatórios; gestão organizacional não foi apresentada como na conta A | nenhuma | normal |
| SEMS-PERM-001 | `INFERRED` | média | comparação de plantas | múltiplos, escuro | comparar detalhe próprio e compartilhado | ausência da aba de atualização na planta compartilhada indica escopo mais restrito, mas não prova negação de ação | nenhuma | normal |
| SEMS-EXT-001 | `NOT TESTED — EXTERNAL IMPACT RISK` | alta | planta compartilhada em operação e seus dispositivos | 1266×712, escuro | avaliar se controles operacionais deveriam ser exercitados | ações não executadas por a UI mostrar recursos conectados/em operação e identificadores técnicos | nenhuma | não capturar |

Na Fase 1 não houve evidência `TESTED IN SANDBOX`. A Fase 2 acrescentou os testes controlados abaixo.

## Evidências da Fase 2

| ID | Classificação | Confiança | Papel/contexto | Viewport/tema | Ação | Resultado | Referência visual | Sensibilidade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEMS-THEME-001 | `TESTED IN SANDBOX` | alta | Proprietário | 1210×1024, escuro→claro→escuro | alternar `Modo de visualização` e restaurar preferência | shell, mapa, cartões e gráficos mudaram de tema sem mudar a rota | SEMS-SHELL-004 | normal |
| SEMS-PLANT-005 | `OBSERVED` | alta | Proprietário, nova planta | 1210×1024, escuro | abrir `Nova usina` | wizard de três etapas: localização; tipo/dados; código de organização | SEMS-PLANT-005 | endereço padrão público; não reutilizar como dado de produto |
| SEMS-PLANT-006 | `TESTED IN SANDBOX` | alta | Proprietário | 1210×1024, escuro | criar `CG_ANALYSIS_20260822_F2` como `Usina C&I`, capacidade fictícia e observação fictícia | validação assíncrona habilitou `Próximo`; página `Usina criada com sucesso` ofereceu adicionar dispositivo | SEMS-PLANT-006 | normal |
| SEMS-PLANT-007 | `OBSERVED` | alta | Proprietário, planta criada | 1210×1024, escuro | abrir detalhe da planta | estado `Em construção`, nenhum dispositivo, tabs Painel/Dispositivos/Alarmes | SEMS-PLANT-007 | normal |
| SEMS-PLANT-008 | `OBSERVED` | alta | Proprietário, planta criada | 1210×1024, escuro | abrir compartilhamento e cancelar | visitante Usuário/Organização; permissão Monitoramento ou Monitoramento + Controle; prazo limitado ou ilimitado | nenhuma | normal |
| SEMS-PLANT-009 | `TESTED IN SANDBOX` | alta | Proprietário, planta criada | 1210×1024, escuro | Excluir → confirmar → recarregar e pesquisar o identificador fictício | toast de sucesso; pesquisa posterior `Todos (0)` e `Sem dados` | nenhuma | normal |
| SEMS-DEVICE-004 | `OBSERVED` | alta | Proprietário, planta criada | 1210×1024, escuro | abrir adição de dispositivo | métodos manual, lote e varredura; tipos Inversor, Datalogger, HomeKit e Carregador veicular; imagem ou SN | nenhuma | normal |
| SEMS-DEVICE-005 | `TESTED IN SANDBOX` | alta | Proprietário, EV fictício inválido | 1210×1024, escuro | preencher SN/código deliberadamente fictícios e enviar | erro `O tipo de equipamento atual não é suportado`; nenhum dispositivo criado | SEMS-DEVICE-004 | normal; valores fictícios |
| SEMS-ENERGY-002 | `OBSERVED` | alta | Distribuidor/Instalador, planta compartilhada | 1210×1024, escuro | aprofundar tabs energéticas em leitura | potência, geração, consumo, carga/descarga, importação/exportação, autoconsumo, tarifa, mapa de calor e fluxo de energia | SEMS-ENERGY-001 | anonimizar planta |
| SEMS-EV-001 | `OBSERVED` | alta | Distribuidor/Instalador, EV compartilhado | 1210×1024, escuro | abrir lista e detalhe sem executar controle | estados de carregamento, métricas acumuladas, última carga, porta, abas operacional/carga e histórico de comandos | nenhuma; IDs e operadores presentes | não capturar |
| SEMS-EV-002 | `OBSERVED` | alta | histórico de controle do EV compartilhado | 1210×1024, escuro | abrir somente o log de controle | comandos históricos incluem modo Rápido/FV+Bateria, potência máxima/mínima, SOC, origem Web/App e resultado | nenhuma; operadores presentes | não capturar |
| SEMS-EV-003 | `OBSERVED` | alta | assinatura de alarmes | 1210×1024, escuro | expandir Falha/Alarme/Aviso de Carregador de Veículo Elétrico | taxonomia específica de conectividade, aterramento/GFCI, pistola, rede, corrente/tensão, temperatura, emergência, firmware e memória | nenhuma | normal |
| SEMS-REPORT-002 | `OBSERVED` | alta | Proprietário, planta fictícia | 1210×1024, escuro | selecionar planta em relatório | relatório estatístico mensal com agregação e relatório operacional em intervalo de 5 minutos | nenhuma | normal |
| SEMS-REPORT-003 | `OBSERVED` | média | Distribuidor/Instalador | 1210×1024, escuro | abrir `Tarefa de download` | histórico assíncrono com relatórios/exportações, progresso, estado e data | nenhuma; contas presentes | não capturar |
| SEMS-SUBSCRIPTION-001 | `OBSERVED` | alta | Proprietário | 1210×1024, escuro | abrir nova assinatura de alarmes e cancelar | seleção por planta/tipo, latência 10/30/60 min, canais central/pop-up/e-mail/celular, push e destinatários | nenhuma | normal |
| SEMS-SUBSCRIPTION-002 | `OBSERVED` | alta | Proprietário | 1210×1024, escuro | abrir nova assinatura de relatório e cancelar | relatório de planta/inversor, periodicidade semanal/mensal/anual, fuso, idioma, canais e usuários | nenhuma | normal |
| SEMS-USER-001 | `OBSERVED` | alta | Distribuidor/Instalador, organização | 1210×1024, escuro | abrir lista e modal de novo usuário sem salvar | campos nome, e-mail, contato, função e observação; funções disponíveis `ADMINISTRATOR` e `BROWSER` | nenhuma; dados existentes não capturados | não capturar |
| SEMS-USER-002 | `OBSERVED` | alta | Proprietário, configuração | 1210×1024, escuro | expandir Gestão da organização | submenu efetivo limitado a `Assinatura de mensagens`; Logs permaneceu acessível | nenhuma | normal |
| SEMS-PERM-002 | `INFERRED` | média | EV compartilhado | 1210×1024, escuro | comparar detalhe, lista e ações | edição/exclusão aparecem na lista, mas edição não abriu formulário nem mudou rota; causa pode ser RBAC, estado ou defeito | nenhuma | normal |
| SEMS-EXT-002 | `NOT TESTED — EXTERNAL IMPACT RISK` | alta | planta/EV compartilhados | 1210×1024, escuro | avaliar comandos e exclusão | nenhum comando, alteração ou exclusão foi executado em ativo preexistente | nenhuma | não capturar |

## Evidências de consolidação e planejamento

Estas entradas documentam derivações da análise, não novos comportamentos do SEMS+.

| ID | Classificação | Confiança | Papel/contexto | Viewport/tema | Ação | Resultado | Referência visual | Sensibilidade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEMS-CONS-001 | `OBSERVED` | alta | repositório + ledger | n/a | normalizar páginas, entidades, componentes, estados, permissões e referências | duplicações removidas; observação, inferência e desconhecido permaneceram separados | manifest completo | normal |
| CG-FIT-001 | `INFERRED` | alta | SEMS-CONTEXT-001 + evidências Fases 1–2 | n/a | cruzar 14 capacidades ChargeGrid com equivalentes observados | matriz define reuso, adaptação, nova função, impactos e decisão pendente | nenhuma | normal |
| CG-SCOPE-001 | `INFERRED` | alta | produto vigente + SEMS observado | n/a | classificar páginas/capacidades | escopo `MUST`, `SHOULD`, `REFERENCE` e `OUT` fechado para planejamento | nenhuma | normal |
| CG-JOURNEY-001 | `INFERRED` | alta | escopo + fluxos observados + regras vigentes | n/a | compor jornadas administrativas | sete jornadas com papel, ação, resultado, permissão, falhas e perguntas | nenhuma | normal |
| CG-ARCH-001 | `INFERRED` | alta | arquitetura vigente + análise visual/funcional | n/a | comparar oito estratégias de implementação | abordagem híbrida escolhida: contratos mínimos, shell-first, vertical slices e mocks substituíveis | nenhuma | normal |
| CG-PLAN-001 | `INFERRED` | alta | escopo + arquitetura | n/a | decompor trabalho futuro | dez milestones independentes/testáveis e plano de validação visual definidos | nenhuma | normal |

## Decisões de produto posteriores à auditoria — 23/08/2026

Estas entradas registram decisões explícitas do produto. Não são promovidas a comportamento observado do SEMS+.

| ID | Classificação | Confiança | Contexto | Decisão | Consequência |
| --- | --- | --- | --- | --- | --- |
| CG-PRODUCT-002 | `VIGENTE` | alta | identidade SEMS+ | preservar `Proprietário` e `Distribuidor/Instalador`; conta profissional exige aprovação/código | ChargeGrid não cria terceiro tipo público de login |
| CG-PRODUCT-003 | `VIGENTE` | alta | fronteira de produto | ChargeGrid é camada aditiva e não remove/troca funções ou shell SEMS+ | integração por contexto, abas e páginas coerentes no mesmo shell |
| CG-PRODUCT-004 | `VIGENTE` | alta | escopo comercial | contrato e acesso comercial são por planta; conta pode misturar plantas técnicas e comerciais | `Usuário comercial` é estado derivado, não tipo permanente |
| CG-PRODUCT-005 | `VIGENTE` | alta | ativação | estabelecimento contrata; consultor autoriza código; resgate inicia onboarding; publicação depende de prontidão | ativação deixa de ser solicitação irrestrita de qualquer usuário |
| CG-PRODUCT-006 | `VIGENTE` | alta | autorização | compartilhamento SEMS+ não concede dados ou ações comerciais | memberships ChargeGrid são explícitas e aplicadas no backend |
| CG-PRODUCT-007 | `VIGENTE` | alta | GoodWe | usuários internos atuam por carteira/região/parceiro; visão nacional é capacidade estratégica adicional | `GOODWE_ADMIN` único fica superado como persona de produto |
