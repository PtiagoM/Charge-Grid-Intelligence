# Guia de referência — Painel geral organizacional

**Status:** direção aprovada para a próxima implementação do Painel; não constitui baseline visual automatizado.

## Escopo do painel

O Painel é a leitura consolidada das plantas técnicas acessíveis à organização ou carteira do usuário. Ele não muda para um dashboard de uma planta comercial quando existe ChargeGrid.

- métricas técnicas são agregadas por todas as plantas no escopo;
- a camada ChargeGrid também é agregada e só aparece quando há vínculo comercial e capacidade de leitura correspondente;
- Central e consultor GoodWe recebem qualidade, ativações, disponibilidade e indicadores comerciais agregados do próprio escopo, nunca uma central de operação local de sessões ou fila;
- instalador SEMS+ sem vínculo comercial mantém apenas a leitura técnica;
- o proprietário comercial pode enxergar o consolidado das próprias plantas e acessar a operação local pela entrada `ChargeGrid`, não pelo Painel.

Valores, nomes de plantas, datas, moedas e quantidades presentes nas capturas são ilustrativos. A implementação deve preservar a hierarquia, densidade e estados, usando dados do escopo ativo.

## Mapa e resumo de usinas

Referências: `SEMS-DASHBOARD-MAP_OPERATOR_1634x754_COMMERCIAL-PLANT-PREVIEW.png` e `SEMS-DASHBOARD-MAP_OPERATOR_1520x784_STATION-SUMMARY-EXPANDED.png`.

1. O mapa ocupa o primeiro bloco do Painel; o resumo flutuante mostra total de usinas, capacidade FV e armazenamento agregados.
2. O controle de total de usinas expande uma distribuição compacta por estado técnico: em operação, aguardando, offline, falha e em construção. A distribuição é filtro/estado de leitura, não um segundo painel lateral.
3. Clicar em um marcador abre uma prévia contextual da planta, com estado técnico, potência nominal, armazenamento, potência FV e energias diárias.
4. Quando a planta for comercial, a prévia recebe uma seção ChargeGrid curta e aditiva: estado de publicação, quantidade de carregadores publicados, disponibilidade agregada e carregadores em recarga/indisponíveis. Ela não exibe lista de sessões, fila de motoristas, lucro ou controles locais.
5. A prévia deve oferecer somente navegação contextual, como abrir a planta ou a lista filtrada; autorização continua independente da URL.

## Economia e camada ChargeGrid

Referência: `SEMS-DASHBOARD-ECONOMY_OPERATOR_784x197_CHARGEGRID-SUMMARY.png`.

1. Manter a composição SEMS+: título, período, seletor de granularidade e seis métricas energéticas compactas em duas linhas.
2. Acrescentar abaixo uma faixa discreta `Operação ChargeGrid`, somente quando o escopo tiver plantas comerciais visíveis.
3. A faixa apresenta indicadores agregados do período: receita autorizada quando a capacidade permitir, sessões, disponibilidade e quantidade de carregadores publicados. O quarto indicador substitui a referência de fila; fila não é KPI do Painel geral.
4. Para Central/consultor, receita só aparece quando houver capacidade financeira explícita. Sem essa capacidade, usar qualidade comercial, plantas comerciais e carregadores publicados.
5. Nenhuma métrica do card pode derivar de uma única planta por conveniência de fixture.

## Monitoramento de energia

Referências: `SEMS-DASHBOARD-ENERGY-MONITOR_OPERATOR_1097x804_TOOLTIP.png` e `SEMS-DASHBOARD-ENERGY-MONITOR_OPERATOR_1052x788_MODE-SWITCH.png`.

1. A captura orienta somente a composição visual, a alternância no mesmo espaço, a densidade, a legenda e o tooltip. Ela não redefine as informações técnicas já existentes no monitoramento SEMS+.
2. O modo padrão permanece `Monitoramento de energia`, com as mesmas séries técnicas agregadas das plantas no escopo (geração, carga/consumo, energia carregada, descarregada, importada ou exportada quando houver evidência).
3. As alternâncias ChargeGrid usam esse mesmo palco e não criam uma nova seção de cards: `Receita ChargeGrid`, `Demanda ChargeGrid` e `Utilização ChargeGrid`. Utilização é o único modo adicional recomendado além de receita e demanda, pois relaciona sessões, carregadores ativos e disponibilidade sem virar operação local.
4. O período e a granularidade ficam no cabeçalho do gráfico; os indicadores-resumo ficam imediatamente acima da área plotada, no modo que os utiliza.
5. A legenda acompanha o modo ativo e pode ter paginação horizontal quando houver mais séries do que a largura comporta.
6. Hover/foco em um ponto deve mostrar linha-guia, data/hora e valores numéricos exatos de todas as séries ativas. Sem telemetria, o tooltip declara ausência em vez de inventar zero.
7. O gráfico sempre consolida as plantas do escopo. Selecionar uma planta no mapa não troca silenciosamente o escopo do painel; essa ação abre a jornada da planta.

## Limites desta rodada

- Não criar snapshots, baselines ou matriz visual.
- Não transformar o Painel em tela de operação local, CRM ou fila comercial.
- O refinamento visual continua dependente das próximas referências de estados e controles fornecidas pelo produto.
