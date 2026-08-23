# Manifesto de referencias visuais do SEMS+

As capturas deste manifesto ficam somente no ambiente local, dentro de `inbox/`, e nao devem ser publicadas sem sanitizacao. Elas orientam composicao, hierarquia, densidade e estados de interface; nao sao baselines automatizados.

| Referencia local | Perfil | Tela | Uso na reconstrucao |
| --- | --- | --- | --- |
| `catalogued/SEMS-AUTH-LOGIN_PUBLIC_1873x925_POPULATED.png` | Publico | Login | Divisao foto/formulario, utilitarios, campos e rodape |
| `catalogued/SEMS-AUTH-CREATE-ACCOUNT_OPERATOR_1870x931_ACCOUNT-TYPE.png` | Operador | Criar conta - tipo | Trilho lateral de etapas e selecao do tipo de conta |
| `catalogued/SEMS-AUTH-CREATE-ACCOUNT_OPERATOR_1867x924_DETAILS.png` | Operador | Criar conta - dados | Densidade, largura e agrupamento do formulario |
| `catalogued/SEMS-DASHBOARD-PANEL_OPERATOR_1867x923_TOP.png` | Operador | Painel - topo | Shell, mapa, resumo das usinas e inicio dos indicadores |
| `catalogued/SEMS-DASHBOARD-PANEL_OPERATOR_1862x922_SCROLLED.png` | Operador | Painel - continuacao | Potencia, alarmes, contribuicao ambiental, economia e monitoramento |
| `catalogued/SEMS-DASHBOARD-ENERGY-MONITOR_OPERATOR_1119x497_TOOLTIP.png` | Operador | Painel - grafico | Escalas, legenda e tooltip do monitoramento de energia |
| `catalogued/SEMS-PLANTS-LIST_OPERATOR_1863x1045_POPULATED.png` | Operador | Lista de usinas | Filtros, status, tabela, paginacao e acao de cadastro |
| `catalogued/SEMS-PLANTS-CREATE_OPERATOR_1865x1046_STEP-ADDRESS.png` | Operador | Nova usina - endereco | Composicao do assistente em tres etapas e mapa lateral |
| `catalogued/SEMS-DEVICES-LIST_OPERATOR_1872x1043_INVERTERS.png` | Operador | Lista de dispositivos | Abas por tipo, filtros, status e tabela agrupada |
| `catalogued/SEMS-ALARMS-CENTER_OPERATOR_1872x1047_RESOLVED.png` | Operador | Central de alarmes | Filtros, estados e tabela de ocorrencias resolvidas |
| `catalogued/SEMS-REPORTS-CENTER_OPERATOR_1874x1046_LANDING.png` | Operador | Central de relatorios | Entrada por relatorio de usina ou de dispositivo |
| `catalogued/SEMS-ANALYSIS-IV_OPERATOR_1874x1051_EMPTY.png` | Operador | Diagnostico IV | Subnavegacao, filtros, tabela e estado vazio |
| `catalogued/SEMS-ANALYSIS-COMPARISON_OPERATOR_1873x1042_EMPTY.png` | Operador | Comparacao de dados | Selecao de usinas, metricas e painel de resultados |
| `catalogued/SEMS-ANALYSIS-BATTERY_OPERATOR_1866x1040_EMPTY.png` | Operador | Consistencia da bateria | Seletor de usina, dispositivos e acao de analise |
| `catalogued/SEMS-SERVICE-CENTER_OPERATOR_1873x1049_LANDING.png` | Operador | Centro de servico | Comunicados, noticias, garantia, suporte e atalhos |

## Assets identificados

Os assets do Painel foram normalizados como `SEMS-ASSET-DASHBOARD-<FUNCAO>_<DIMENSAO>.png`. As copias utilizadas pela aplicacao ficam versionadas em `apps/admin-web/public/assets/sems/dashboard/`; os downloads originais permanecem apenas no `inbox/catalogued/`.

Foram identificados os grupos de potencia, alarmes, curva e monitoramento de energia, CO2, arvore, energia de carga/geracao/descarga, autoconsumo e receita. `SEMS-ASSET-DASHBOARD-INCOME-DARK_UNKNOWN.png` ainda nao foi publicado porque seu encoding nao foi reconhecido como PNG valido.

## Observacoes de seguranca

A captura de login recebida contem um e-mail completo visivel. Ela pode ser consultada localmente, mas deve ser recortada ou anonimizada antes de qualquer commit. O diretorio `inbox/` esta protegido no `.gitignore` para evitar publicacao acidental das imagens brutas.

## Ordem de implementacao

1. Login e shell autenticado.
2. Painel do operador.
3. Lista de usinas, lista de dispositivos e detalhes.
4. Alarmes, relatorios, analise e servicos, conforme novas capturas forem adicionadas.
