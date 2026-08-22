# Componentes observáveis — catálogo consolidado

| Padrão | Ocorrência observada | Reuso potencial |
| --- | --- | --- |
| sidebar recolhível com ícones | shell principal | navegação administrativa |
| header de escopo e conta | todas as páginas principais | organização, busca, alertas, idioma e papel |
| popover de conta | header | tema, preferências, downloads e logout |
| barra de filtros | plantas, dispositivos, alarmes, logs | pesquisa e refinamento transversal |
| tabs com contadores | plantas, alarmes, dispositivos | estados operacionais e segmentação |
| tabela responsiva com coluna de operação | listas e logs | inventário e administração |
| cartão de KPI | dashboard e detalhe de planta | capacidade, energia, receita e ambiente |
| mapa com cluster | dashboard | distribuição geográfica de plantas |
| gráfico temporal com seletor de período | dashboard e planta | energia, potência e carregamento |
| árvore de seleção | comparação de dados e organização | hierarquia de plantas, métricas e usuários |
| status chip/badge | plantas, dispositivos e alarmes | construção, operação, inatividade e severidade |
| empty state | dispositivos, alarmes, diagnóstico e bateria | ausência de dados/ativos |
| ação desabilitada | comparação e consistência de bateria | pré-condição não satisfeita |
| modal/drawer | compartilhamento, confirmação, criação de usuário | ações contextuais e formulários |

## Componentes confirmados no aprofundamento

| Padrão | Comportamento observado |
| --- | --- |
| wizard em três etapas | progresso numerado, anterior/próximo, validação assíncrona e sucesso dedicado |
| upload por clique/arraste | imagem de planta e leitura de SN, com formato e limite de tamanho |
| modal de confirmação | exclusão de planta com Cancelar/Confirmar e toast de sucesso |
| modal aninhado | lista de compartilhamentos seguida de criação do compartilhamento |
| permission radio group | monitoramento versus monitoramento + controle |
| task center | tabela de exportações com progresso e status |
| árvore com checkbox | seleção de plantas em relatórios/comparação |
| accordion de taxonomia | grupos Falha/Alarme/Aviso com itens selecionáveis |
| formulário longo por domínio | assinatura combina tabs, radios, checkboxes, selects, usuários e canais |
| alternância de tema | preferência no popover da conta, aplicada ao shell inteiro |

O catálogo orienta a reconstrução futura, mas não é uma cópia de componentes proprietários nem substitui o design system vigente. Padrões novos do ChargeGrid devem reutilizar tokens e densidade observados sem inventar equivalência funcional no SEMS+.
