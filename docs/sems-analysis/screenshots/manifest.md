# Manifest de screenshots

## Convenção

Nome: `SEMS-<DOMÍNIO>-NNN_<papel>_<viewport>_<tema>_<estado>.jpg`.

Todas as capturas foram revisadas visualmente. Nenhuma mostra senha, token, cookie, e-mail completo, telefone, endereço cadastral, número de série ou query string contextual.

| ID | Arquivo | Data | Papel/contexto | Rota segura | Viewport | Tema/estado | Evidência | Redações | Sensibilidade |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SEMS-SHELL-001 | `shell/SEMS-SHELL-001_pre-auth_1266x712_light_login.jpg` | 2026-08-22 | pré-autenticação | `#/login` | 1266×712 | claro/login vazio | SEMS-SHELL-001 | nenhuma; campos vazios | normal |
| SEMS-SHELL-002 | `shell/SEMS-SHELL-002_distributor-installer_1266x712_dark_dashboard.jpg` | 2026-08-22 | Distribuidor/Instalador | `#/` | 1266×712 | escuro/populado | SEMS-AUTH-001, SEMS-DASH-001 | nenhuma necessária | normal |
| SEMS-SHELL-003 | `shell/SEMS-SHELL-003_owner_1210x1024_dark_dashboard.jpg` | 2026-08-22 | Proprietário | `#/` | 1210×1024 | escuro/populado | SEMS-AUTH-002, SEMS-DASH-002 | menu de conta fechado | normal |
| SEMS-ENERGY-001 | `energy-alerts/SEMS-ENERGY-001_distributor-installer_1266x712_dark_ev-monitoring.jpg` | 2026-08-22 | Distribuidor/Instalador, planta compartilhada anonimizada | `#/station_monitor/station_detail?<redacted>` | 1266×712 | escuro/monitoramento EV | SEMS-PLANT-004 | IDs e dispositivo fora da captura | anonimizar contexto |
| SEMS-SHELL-004 | `shell/SEMS-SHELL-004_owner_1210x1024_light_dashboard.jpg` | 2026-08-22 | Proprietário | `#/` | 1210×1024 | claro/populado | SEMS-THEME-001 | menu da conta fechado | normal |
| SEMS-PLANT-005 | `plants/SEMS-PLANT-005_owner_1210x1024_dark_create-step1-default.jpg` | 2026-08-22 | Proprietário, criação controlada | `#/station_monitor/station_create` | 1210×1024 | escuro/etapa 1 | SEMS-PLANT-005 | nenhum dado pessoal; localização padrão do produto | normal |
| SEMS-PLANT-006 | `plants/SEMS-PLANT-006_owner_1210x1024_dark_create-success.jpg` | 2026-08-22 | Proprietário, planta fictícia | `#/station_monitor/station_create/station_create_success?<redacted>` | 1210×1024 | escuro/sucesso | SEMS-PLANT-006 | identificador contextual fora da rota | normal |
| SEMS-PLANT-007 | `plant-details/SEMS-PLANT-007_owner_1210x1024_dark_empty-detail.jpg` | 2026-08-22 | Proprietário, planta fictícia | `#/station_monitor/station_detail?<redacted>` | 1210×1024 | escuro/vazio | SEMS-PLANT-007 | apenas nome fictício | normal |
| SEMS-DEVICE-004 | `devices/SEMS-DEVICE-004_owner_1210x1024_dark_ev-invalid-error.jpg` | 2026-08-22 | Proprietário, EV fictício inválido | `#/station_monitor/station_detail/station_device_add?<redacted>` | 1210×1024 | escuro/erro | SEMS-DEVICE-005 | SN, código e nome deliberadamente fictícios | normal |

Não foram capturadas listas com endereços pessoais, usuários, e-mails, números de série reais, logs de operador ou detalhes de dispositivo preexistente.
