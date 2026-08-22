# Catálogo consolidado de páginas observadas

| Página/área | Rota segura | Propósito aparente | Entidade principal | Entrada/ações principais | Evidência | Confiança |
| --- | --- | --- | --- | --- | --- | --- |
| Login | `#/login` | autenticação | conta | credenciais, consentimento de cookies | SEMS-SHELL-001 | alta |
| Painel | `#/` | visão agregada técnico-energética | portfólio de plantas | período, mapa, cartões e gráficos | SEMS-DASH-001/002 | alta |
| Lista de usinas | `#/station_monitor` | localizar e administrar plantas | planta | filtros, tabs de status, `Nova usina`, abrir contexto | SEMS-PLANT-001/002 | alta |
| Detalhe da usina | `#/station_monitor/station_detail?<redacted>` | monitoramento contextual | planta | tabs, gráficos, dispositivos, alarmes e atualização quando permitida | SEMS-PLANT-003/004 | alta |
| Lista de dispositivos | `#/device_monitor` | inventário transversal | dispositivo | filtros, tabs por tipo, operação por linha | SEMS-DEVICE-001/002 | alta |
| Detalhe do dispositivo | `#/station_monitor/station_detail/device_detail?<redacted>` | telemetria e histórico do ativo | dispositivo/EV Charger | monitoramento operacional e de carga | SEMS-DEVICE-003 | média |
| Central de alarmes | `#/alarm_center` | triagem e histórico de alarmes | alarme | filtros, tabs, confirmação quando aplicável | SEMS-ALARM-001/002 | alta |
| Central de relatórios | `#/report_center` | relatórios recorrentes e sob demanda | relatório | assinatura, meus relatórios e quatro modelos | SEMS-REPORT-001 | alta |
| Diagnóstico IV | `#/iv_diagnosis` | análise de cabeamento/módulos | inversor/módulo | tabs, filtros e tabela | SEMS-ANALYSIS-001 | alta |
| Comparação de dados | `#/data_comparison` | comparar plantas ou dispositivos | planta/dispositivo/métrica | seleção em árvore e geração de resultados | SEMS-ANALYSIS-001 | alta |
| Consistência da bateria | `#/battery_consistency` | análise de ativos de bateria | bateria/dispositivo | escolher planta e dispositivo, iniciar análise | SEMS-ANALYSIS-001 | alta |
| Centro de serviço | `#/sevices` | suporte e conteúdo GoodWe | serviço/conteúdo | anúncios, suporte, garantia, manual e feedback | SEMS-SHELL-002 | alta |
| Gestão da organização | `/configure/#/organization_management` | administrar organização e usuários | organização/usuário | árvore, informações, lista e novo usuário | SEMS-ORG-001/002 | média |
| Gerenciamento de Logs | `/configure/#/log_management` | auditoria de operações | log | filtros por operador/data e tabela | SEMS-ORG-001 | alta |
| Assinaturas | `/configure/#/` | configurar notificações | assinatura/relatório/alarme | ativar, filtrar, adicionar e alternar tabs | SEMS-ORG-002 | média |

Nenhuma página entrou no inventário apenas por ser citada nos documentos do produto.

## Fluxos contextuais aprofundados

### Nova usina

`#/station_monitor/station_create` — `TESTED IN SANDBOX`, confiança alta.

1. Localização: endereço pesquisável, coordenadas, detalhe, país/região e fuso derivados, mapa.
2. Dados: quatro tipos de planta, nome, potência nominal automática/manual, capacidade solar, inclinação, início de operação, observação e imagem.
3. Vínculo: código de organização opcional e conclusão.

O botão da etapa 2 depende de validação assíncrona. O sucesso tem rota própria e CTA para adicionar dispositivo.

### Adicionar dispositivo

`#/station_monitor/station_detail/station_device_add?<redacted>` — confiança alta.

- métodos: manual, importação em lote e varredura com um clique;
- tipos: inversor, datalogger, HomeKit e carregador veicular;
- identificação: upload da imagem do equipamento ou SN + código de verificação;
- falha controlada confirmada para identificador fictício incompatível.

### Compartilhar planta

Modal sobre a lista: destinatário usuário ou organização, permissão de monitoramento ou monitoramento + controle e prazo limitado ou ilimitado. Nenhum compartilhamento foi salvo.

### Relatório da usina

Seleção em árvore, tab estatística com agregação mensal e métricas energéticas, tab operacional com intervalo de cinco minutos e ação de download. A central de tarefas apresenta processamento assíncrono e histórico de exportações.

### Assinaturas

- Alarmes: seleção de planta e taxonomia por componente, pontualidade, canais e destinatários.
- Relatórios: planta/inversor, recorrência semanal/mensal/anual, fuso, idioma e destinatários.
