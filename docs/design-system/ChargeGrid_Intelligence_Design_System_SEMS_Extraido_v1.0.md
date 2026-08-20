# ChargeGrid Intelligence — Design System SEMS+ Extraído v1.0

**Status:** baseline visual extraída do dashboard administrativo anterior  
**Uso:** Admin Web ChargeGrid; baseline desktop complementar ao Design System SEMS+ Mobile Extraído v1.0  
**Base analisada:** `Dashboard_Comercial-ChargeGrid` — código e snapshot visual locais  
**Natureza:** extração de implementação existente; **não é um manual oficial de marca GoodWe nem uma alegação sobre tokens internos do SEMS+**.

> Este documento transforma padrões que já estão aplicados no dashboard anterior em uma fonte de verdade legível. Valores marcados como **extraídos** existem no CSS/projeto analisado. Normalizações marcadas como **propostas** só organizam os mesmos valores para a próxima implementação; não inventam uma identidade visual nova.

## 1. Objetivo e fronteiras

O dashboard comercial anterior já materializa uma linguagem visual inspirada no SEMS+: navegação lateral compacta, superfície clara, acento GoodWe em vermelho-rosa, densidade de ferramenta administrativa e comunicação de estados por badges. Esta especificação permite reproduzir essa linguagem no monorepo do ChargeGrid sem copiar telas ou CSS de forma indiscriminada.

### 1.1 Escopo

- Admin Web desktop-first: shell, páginas operacionais, tabelas, cards, estados, gráficos simples e feedback visual.
- Tokens de cor, tipografia, espaçamento, borda, raio, elevação, breakpoints e ícones observados.
- Componentes visuais reutilizáveis, com responsabilidades e estados esperados.
- Adaptação consciente para o Driver PWA, sem impor a ele a densidade do Admin.

### 1.2 Fora do escopo

- Prova de que esses valores pertencem ao design system oficial/proprietário da GoodWe ou do SEMS+.
- Novos componentes, telas, fluxos de produto, dados, permissões ou regras de negócio.
- Assets não presentes no projeto analisado, fontes licenciadas, animações elaboradas e dark mode completo.
- Código de implementação. As referências a classes servem como evidência da extração, não como prescrição de copiar o projeto anterior.

### 1.3 Fontes inspecionadas

| Fonte local | O que confirmou |
|---|---|
| `src/styles/main.css` | tokens CSS, dimensões, layouts, breakpoints, componentes e estados |
| `src/ui/shell.js` | composição do shell, navegação e topbar |
| `src/pages/plants.js` e `src/pages/chargegrid.js` | padrões reais de conteúdo, cards, tabelas, gráficos e tabs |
| `src/constants/assets.js` | catálogo de logos, ícones e assets SEMS usados |
| `tests/e2e/visual.spec.js-snapshots/lista-plantas-generated-chromium-win32.png` | confirmação visual do shell claro, densidade e hierarquia |

## 2. Princípios visuais extraídos

1. **Administração com baixa ornamentação.** Fundos claros, contornos discretos e informação densa são priorizados sobre grandes blocos promocionais.
2. **Vermelho GoodWe como acento, não preenchimento dominante.** Ele marca seleção, ação, destaque numérico e dado comercial relevante; a maior parte da página continua neutra.
3. **Status semântico precisa ser legível sem depender só da cor.** Badges, label e ícone complementam o tom de sucesso, atenção, perigo ou neutro.
4. **Camadas claras.** Fundo cinza muito leve → superfície branca → agrupamento cinza suave → elemento com acento.
5. **Navegação persistente e contexto local.** Sidebar fixa dá orientação global; cabeçalho e tabs dão contexto da planta/módulo.
6. **Dados primeiro.** KPIs, tabelas e cards têm rótulos curtos, números evidentes e detalhes secundários em cinza.
7. **Uso prudente da cor de alerta.** Amarelo sinaliza decisão/atenção; vermelho de perigo é reservado para falha e risco. Não usar amarelo/vermelho como decoração.

## 3. Tokens fundamentais

### 3.1 Cores

| Papel normalizado | Valor extraído | Uso observado | Status |
|---|---:|---|---|
| `color.brand.primary` | `#FF3049` | seleção, tabs, KPI, ícone ChargeGrid, destaque de título | extraído (`--goodwe-red`) |
| `color.brand.primary-hover` | `#DF1C35` | texto/atalho de ação e tom mais forte | extraído (`--goodwe-red-dark`) |
| `color.canvas` | `#F1F2F3` | fundo geral do Admin | extraído (`--sems-bg`) |
| `color.surface.base` | `#FFFFFF` | sidebar, cards, tabs e tabelas | extraído (`--surface`) |
| `color.text.primary` | `#08111F` | títulos e texto principal | extraído (`--text`) |
| `color.text.muted` | `#7D8696` | rótulos, metadados, informações secundárias | extraído (`--muted`) |
| `color.border.default` | `#E7E9ED` | contorno estrutural | extraído (`--border`) |
| `color.success` | `#42C95A` | disponibilidade, saúde e condição favorável | extraído (`--green`) |
| `color.success.subtle` | `#EFFBF1` | badge/fundo de sucesso | extraído (`--green-bg`) |
| `color.info` | `#2F80FF` | construção/informação de planta | extraído (`--blue`) |
| `color.info.subtle` | `#EAF2FF` | badge de informação | extraído (`--blue-bg`) |
| `color.warning` | `#EBA900` | atenção, fila, decisão energética | extraído (`--yellow`) |
| `color.warning.subtle` | `#FFF7DA` | badge/realce suave | extraído (`--yellow-bg`) |
| `color.danger` | `#FF4D5E` | falha, erro e risco operacional | extraído (`--danger`) |
| `color.danger.subtle` | `#FFF0F2` | badge/fundo de perigo | extraído (`--danger-bg`) |
| `color.neutral.strong` | `#080F1F` | CTA escuro “Nova instalação” | extraído |
| `color.neutral.subtle` | `#F8F9FA` | blocos internos, mini métricas, cards secundários | extraído recorrente |
| `color.neutral.disabled` | `#969DA7` | offline e estados neutros | extraído |

### 3.2 Tons auxiliares extraídos

Estes valores aparecem em usos específicos; mantê-los como aliases e não como novas cores de marca.

| Alias | Valor | Uso observado |
|---|---:|---|
| `color.border.strong` | `#E0E3E8` / `#E1E4E9` | controles e botões outline |
| `color.surface.table-header` | `#F6F6F7` / `#F7F8F9` | cabeçalhos de tabela |
| `color.action.subtle` | `#FFF1F3` / `#FFF7F8` | tab/atalho ChargeGrid ativo |
| `color.warning.panel` | `#FFF4CF`, `#FFF6D9`, `#FFF9E8` | painel de decisão e condição atual |
| `color.chart.grid` | `#EDF0F2` / `#DFE3E8` | trilhas, grades e barras vazias |
| `color.chart.neutral` | `#8291A6` / `#AEB5BF` | dados neutros, rede, indisponibilidade |
| `color.chart.charging` | `#3C83D6` | ponto de carregamento ativo em gráfico |

### 3.3 Regras de uso de cor

- Use `brand.primary` para um foco por área: item de navegação selecionado, CTA contextual, tab ativa **ou** destaque de KPI; evite vários focos vermelhos concorrentes.
- Use `neutral.strong` para CTA estrutural de alto peso (por exemplo, criar/publicar), preservando o vermelho para identidade e contexto ChargeGrid.
- `success`, `warning`, `danger` e `info` são semânticos. Um badge de sessão não deve reutilizar vermelho apenas porque a tela é ChargeGrid.
- Superfícies de alerta precisam combinar ícone/label/motivo. A variação sutil comunica atenção sem fazer a área parecer erro fatal.
- Dados de gráfico devem ser acompanhados por legenda e/ou label. Não codificar informação apenas por cor.

## 4. Tipografia

### 4.1 Família e base

| Token proposto | Valor extraído | Uso |
|---|---|---|
| `font.family.sans` | `"Segoe UI", Arial, Helvetica, sans-serif` | toda a aplicação |
| `font.size.body` | `14px` | base do `body` |
| `font.weight.regular` | 400 | texto comum implícito |
| `font.weight.medium` | 500 | cabeçalhos de tabela e badges |
| `font.weight.semibold` | 600 | navegação ativa, ações, números críticos |
| `font.weight.bold` | 700 | eyebrow, badge de seção e destaques curtos |

### 4.2 Escala observada

| Papel | Tamanho | Peso / detalhes | Onde aparece |
|---|---:|---|---|
| `display.page` | 28px | peso padrão; título tem acento em vermelho | cabeçalho ChargeGrid |
| `heading.page` | 25px | `letter-spacing: -0.6px` | lista de plantas |
| `heading.section` | 18px | margem curta | títulos de card |
| `heading.card` | 14–18px | semibold conforme contexto | recomendação, relatório |
| `metric.primary` | 21px | `letter-spacing: -0.5px` | cards KPI |
| `metric.hero` | 25–42px | vermelho/alerta conforme semântica | resumo e decisão |
| `body` | 14px | cor primária | informação normal |
| `body.compact` | 12px | tabelas, ações e metadados | alta densidade |
| `label` | 9–11px | frequentemente uppercase | rótulos de métricas |
| `eyebrow` | 10px | 700, uppercase, `letter-spacing: 1px`, vermelho | agrupamento de seção |

### 4.3 Regras tipográficas

- Título de página é único por tela e aparece antes das tabs/contexto operacional.
- Cada KPI usa: label em tom muted, métrica forte, detalhe menor muted. Evitar parágrafos longos em KPI.
- Labels de tabela e microcopy permanecem a partir de 10–12px no Admin; no PWA devem respeitar legibilidade mobile, não copiar essa densidade sem teste.
- O vermelho no texto é reservado para destaque de marca, ação ou estado. Não usar em parágrafos informativos comuns.

## 5. Espaçamento, raio, borda e elevação

### 5.1 Escala de espaçamento inferida

O CSS não declara uma escala formal, mas as repetições permitem normalizá-la.

| Token proposto | Valor | Evidência de uso |
|---|---:|---|
| `space.1` | 4px | micro-gap, badges |
| `space.2` | 5–8px | tabs, ações, padding curto |
| `space.3` | 9–12px | grids compactos, controles, rótulos |
| `space.4` | 13–16px | cards internos, células, tabelas |
| `space.5` | 17–20px | conteúdo de cards e separação de seções |
| `space.6` | 22–25px | `content-card`, painéis e blocos maiores |
| `space.7` | 28–30px | painéis de decisão e grids de destaque |

> **Proposta de normalização:** usar 4, 8, 12, 16, 20, 24 e 32px nos componentes novos. Os valores 13, 15, 17, 19, 22 e 25px existem no código anterior e devem ser preservados apenas quando houver motivo visual de compatibilidade.

### 5.2 Raios e contornos

| Papel | Valor extraído | Uso |
|---|---:|---|
| `radius.xs` | 4–6px | barras, badges e sub-blocos |
| `radius.sm` | 7–8px | botões outline, cards internos, tabelas auxiliares |
| `radius.md` | 9–10px | superfícies, cards, tabs e painéis |
| `radius.lg` | 11–12px | controles de filtro e promoção |
| `radius.pill` | 14–26px | badge arredondado, menu lateral, tags |
| `border.default` | 1px `#E7E9ED` | superfícies e cards |
| `border.active` | 2–3px `brand.primary` | indicador de tab/menu/paginação |
| `border.alert` | 3–5px semântico | lado esquerdo de decisão, incidente ou recomendação |

### 5.3 Elevação

| Token proposto | Valor extraído | Uso permitido |
|---|---|---|
| `shadow.navigation-active` | `0 5px 18px #18223518` | item de sidebar selecionado |
| `shadow.card-subtle` | `0 5px 18px #1822350A` | card de exportação/relatório |
| `shadow.floating` | `drop-shadow(0 4px 8px #18223522)` | assistente flutuante |

Sombras são discretas e localizadas. Cards padrão usam contorno, não sombra.

## 6. Layout e responsividade

### 6.1 Shell administrativo

| Elemento | Medida extraída | Comportamento |
|---|---:|---|
| Sidebar recolhida | 61px | fixa à esquerda; ícones e tooltip/`aria-label` |
| Sidebar expandida | 231px | logo e labels aparecem; transição de 0,22s |
| Sidebar em largura média | 210px abaixo de 900px | preserva navegação antes de reduzir |
| Sidebar mobile | 50px abaixo de 680px | apenas ícones; labels ocultas |
| Topbar | 48px | ações à direita; promoção central opcional |
| Logo/sidebar header | 102px | logo centralizado e subtítulo apenas expandido |
| Conteúdo | margem esquerda equivalente à sidebar | transita com abertura/fechamento |
| Padding de página | 18px lateral / 24px inferior | reduz para 8px lateral em mobile |

### 6.2 Grade de conteúdo

| Padrão | Desktop | ≤1300px | ≤900px | ≤680px |
|---|---|---|---|---|
| KPI | 4 colunas, mínimo 170px | 2 colunas | mantém 2 quando aplicável | 1 coluna |
| Carregadores | 3 colunas, mínimo 250px | 2 colunas | 1 coluna | 1 coluna |
| Recomendações | 3 colunas, mínimo 230px | 2 colunas | 1 coluna | 1 coluna |
| Análises comparativas | 1,45fr / 1fr ou 1,4fr / 1fr | ajusta outros grids | 1 coluna | 1 coluna |
| Relatórios | 2 colunas | 2 colunas | 1 coluna | 1 coluna |
| Tabelas | rolagem horizontal | rolagem horizontal | rolagem horizontal | rolagem horizontal |

### 6.3 Regras responsivas

- A prioridade do projeto existente é **preservar a leitura das tabelas**, não comprimir colunas até ficarem ilegíveis. Para dados largos, use contêiner com rolagem horizontal.
- A topbar promocional desaparece abaixo de 900px; status de cabeçalho desaparece abaixo de 680px.
- Grids analíticos empilham antes de reduzir tipografia de modo agressivo.
- O Admin não é uma PWA responsiva disfarçada. Em mobile, a função crítica deve continuar acessível, mas análises densas podem permanecer em rolagem/visão resumida.

## 7. Componentes extraídos

### 7.1 Shell e navegação

| Componente | Anatomia | Estados/regras |
|---|---|---|
| `AppShell` | sidebar fixa + topbar + área de página + assistente opcional | controla largura da sidebar; não deve conter regra de produto |
| `SidebarItem` | ícone 20px, label, possível sufixo, indicador lateral | ativo: texto vermelho, barra esquerda 3px, sombra; recolhido: label não ocupa espaço |
| `Topbar` | promoção central + ações utilitárias + avatar | promoção é contextual e pode ser omitida; ícones são botões 30×30px |
| `PageHeading` | breadcrumb, título, subtítulo operacional e status à direita | título pode usar fragmento vermelho “Intelligence”; status é secundário |
| `SectionTabs` | superfície branca, contorno, links internos | ativa: fundo rosa muito claro, texto vermelho escuro; rolagem horizontal quando necessário |

### 7.2 Superfícies e cards

| Componente | Medidas/padrão | Uso |
|---|---|---|
| `Surface` | branco, 1px de borda, raio 10px | contêiner base de seção |
| `ContentCard` | `Surface` + padding 22px | seção de dashboard, tabela, relatório |
| `KpiCard` | mínimo 112px; padding 19px; borda superior 3px | métrica curta com tom neutro/vermelho/amarelo/verde |
| `MetricTile` | fundo `neutral.subtle`, raio 7px, padding 10–17px | métrica de apoio dentro de cards |
| `DecisionPanel` | faixa esquerda amarela 4–5px; fundo amarelo suave em gradiente | decisão ligada a alerta/estado energético, com motivo e impacto |
| `RecommendationCard` | borda 1px, faixa esquerda 3px, fundo cinza quase branco | recomendação determinística; tom da faixa muda por severidade |
| `ReportExportCard` | padding 22px, raio 10px, sombra sutil | catálogo de relatório; ação outline ao fim |

### 7.3 Controles

| Componente | Padrão extraído | Interação visual |
|---|---|---|
| `OutlineButton` | borda 1px, branco, raio 7px, padding 7×11px | ação secundária; cor de texto cinza forte |
| `PrimaryDarkButton` | fundo/texto `#080F1F`/branco, altura 37px | criação/publicação estrutural |
| `FilterButton` e `SearchField` | altura 37px, contorno `#E0E3E8`, raio 11px | filtros e buscas em listas administrativas |
| `IconButton` | 30px na topbar; 37–42px em filtros/lista | somente ícone, sempre com label acessível |
| `Pagination` | botões 33px, raio 7px | página atual recebe borda/texto vermelho |
| `PillTag` | raio 15px, fundo neutro, texto compacto | pilar, filtro ou classificação curta |

### 7.4 Dados e visualizações

| Componente | Padrão | Observação de uso |
|---|---|---|
| `DataTable` | cabeçalho cinza suave, 12px, linhas com divisor inferior, célula 13×10px | wrapper horizontal obrigatório para tabelas grandes |
| `StatusBadge` | inline, raio 6px, padding 4×8px, label + ícone opcional | representa estado técnico/comercial; ver matriz semântica |
| `BarChart` | barra vermelha em trilha cinza; valores/labels de 11px | gráfico simples para comparação, não para precisão científica |
| `DonutChart` | anel 155px com legenda textual | uso para composição/ocupação, não mais que poucas categorias |
| `ProgressBar` | trilha 5–20px, cantos arredondados | potência, demanda, composição e receita por período |
| `ScatterPlot` | quadrantes claros, pontos com label e legenda | análise de relação; não esconder dado apenas no hover |
| `EventLog` | item cinza suave com borda lateral vermelha | auditoria/integração recente; usar timestamp e causa |

## 8. Matriz de estados semânticos

Esta matriz adapta o padrão visual extraído aos enums do ChargeGrid. Ela preserva o que o código já demonstra: badge com fundo claro, texto de alto contraste e ícone/label quando aplicável.

| Semântica | Token | Uso ChargeGrid recomendado | Rótulo deve complementar a cor |
|---|---|---|---|
| Sucesso / disponível | verde + verde suave | `AVAILABLE`, `OPEN_AVAILABLE`, `NORMAL`, `PAID`, `COMPLETED` | “Disponível”, “Normal”, “Concluída” |
| Informação / em andamento | azul + azul suave | `STARTING`, `CHARGING`, `AUTHORIZED`, `CALLED` | “Iniciando”, “Carregando”, “Chamado” |
| Atenção / capacidade reduzida | amarelo + amarelo suave | `ALERT`, `WAITING`, `IDLE_GRACE_PERIOD`, `SETTLEMENT_PENDING`, `OPEN_PARTIAL` | “Atenção”, “Em espera”, “Em tolerância” |
| Perigo / intervenção | vermelho de perigo + rosa suave | `FAULT`, `PAYMENT_FAILED`, `START_FAILED`, `CRITICAL`, `OUTSTANDING_BALANCE` | “Falha”, “Crítico”, “Saldo pendente” |
| Neutro / indisponível | cinza | `OFFLINE`, `UNAVAILABLE`, `CLOSED`, `MAINTENANCE`, `CANCELLED` | “Offline”, “Fechado”, “Em manutenção” |
| Marca/seleção | vermelho GoodWe | sidebar/tabs selecionadas, CTA contextual, métrica ChargeGrid | não usar como indicador genérico de erro |

### 8.1 Aplicação a estados de carregador e sessão

- `CONNECTED` e `OCCUPIED`: usar atenção/amarelo quando o contexto for vaga bloqueada; usar informação/azul apenas quando a interface comunica progresso de início/recarga.
- `SUSPENDED_BY_DEMAND`: usar atenção ou perigo conforme `PlantEnergyStatus`, sempre com motivo explícito “Interrompida por demanda”; nunca ícone de “pausa” como se fosse capacidade física nativa.
- `ENERGY_FINISHED`, `IDLE_GRACE_PERIOD` e `IDLE_FEE`: priorizar amarelo e contador; a consequência financeira precisa aparecer perto do estado.
- `FAULTED`: vermelho de perigo no card/linha; quando a falha for resolvida, retornar ao estado técnico atual sem apagar o incidente.
- `FULL_QUEUE`: estado do estabelecimento, não do carregador; usar alerta e informar espera/posição, não vermelho de erro.

## 9. Ícones, imagens e assets

### 9.1 Biblioteca efetivamente usada

O projeto anterior utiliza PNGs locais extraídos/organizados em `public/assets/sems/` para logo, navegação, estados e carregador. O catálogo inclui, entre outros:

- Logos GoodWe em versão expandida e compacta.
- Ícones de plantas, dispositivos, alarmes, relatórios, análise, serviços, busca, filtros, idioma, mensagem e configuração.
- Ícones de estado: normal, standby, offline, falha e construção.
- Imagem de carregador, avatar e orb/assistente.

### 9.2 Regras de reutilização

- No Admin, use os assets existentes somente se forem migrados de forma autorizada para o novo projeto; não criar versões “parecidas” com emoji como solução final.
- Ícone de navegação: 20px. Ícone de ação em tabela: 18px. Ícone de badge: 13–15px. Ícone de topbar: até 19px.
- Ícones decorativos devem ter `alt` vazio; ícones de ação precisam de nome acessível. O projeto anterior já aplica `aria-label` na sidebar e topbar — esse padrão deve continuar.
- O raio de imagem de planta observado é 8px; imagem de carregador usa fundo neutro e raio 8px.

## 10. Conteúdo, densidade e acessibilidade

### 10.1 Densidade de informação

- O Admin é desktop-first e pode mostrar tabela ampla, desde que cada coluna tenha propósito e haja scroll horizontal em viewport estreita.
- A cabeça de tabela usa fundo sutil, peso médio e labels curtas. Conteúdo secundário fica abaixo do valor primário, em muted e tamanho menor.
- Cards operacionais mantêm uma seção de recomendação/motivo quando exibem decisão automática; não mostrar só um número ou cor.
- Não usar cards para substituir tabelas com dados repetitivos. Tabelas são o padrão para sessão, financeiro, fila e relatório comparável.

### 10.2 Estados de interação a especificar na implementação

O código extraído define a aparência base e seleção, mas não padroniza integralmente hover, foco, loading, vazio e erro. Para preservar acessibilidade sem inventar uma nova estética, o SDD deve completar:

| Estado | Diretriz mínima coerente |
|---|---|
| Hover | escurecer/realçar contorno de modo discreto, sem alterar a semântica de cor |
| Foco por teclado | outline visível de alto contraste ao redor de link, botão, tab e controle |
| Desabilitado | reduzir contraste e bloquear ação; nunca depender apenas de `cursor` |
| Loading | preservar layout/skeleton neutro; não trocar dado confirmado por zero |
| Vazio | explicar ausência, causa provável e próxima ação; não usar painel de erro vermelho |
| Erro | combinar tom danger, texto de causa e ação de recuperação; detalhes técnicos ficam no Admin autorizado |

### 10.3 Contraste e comunicação

- Em todos os estados, o label é obrigatório. Verde, amarelo, vermelho e cinza não são informação suficiente sozinhos.
- Textos muted em 9–10px são aceitáveis apenas para metadados não críticos no desktop. Conteúdo acionável precisa tamanho/contraste superior.
- Ação de ícone sem texto precisa `aria-label`, tooltip ou ambos. O shell anterior já oferece `aria-label` em pontos relevantes.
- Os gráficos precisam de valores/legendas e não devem depender de interação hover para comunicar o essencial.

## 11. Relação com o Driver PWA

O mesmo sistema visual deve manter a identidade ChargeGrid/SEMS+, mas a PWA não deve replicar a sidebar, a largura de tabelas nem a densidade do Admin.

| Aspecto | Admin Web extraído | Diretriz PWA |
|---|---|---|
| Navegação | sidebar fixa 61/231px + topbar | a referência mobile observada usa barra inferior com quatro destinos e cabeçalho por contexto; consultar o documento Mobile complementar; não copiar sidebar estreita como navegação principal |
| Página | multi-coluna, análises e tabelas | uma coluna; cards de decisão e CTA claros |
| Métricas | KPIs em grid e detalhe analítico | somente energia, custo, tempo, estado e próxima ação da própria sessão |
| Estados | badges compactos | status em label maior + ícone + explicação, especialmente pagamento/demanda/ociosidade |
| Tabelas | scroll horizontal aceitável | converter histórico/fila em lista/células compactas |
| Cor | mesmo conjunto semântico | manter brand e estados; ampliar áreas de toque e contraste |

## 12. Checklist de implementação para o monorepo

- [ ] Criar tokens semânticos com os valores extraídos, sem hardcodes espalhados em componentes.
- [ ] Implementar `AppShell`, `SidebarItem`, `Topbar`, `PageHeading` e `SectionTabs` somente para Admin Web.
- [ ] Implementar `Surface`, `ContentCard`, `KpiCard`, `StatusBadge`, botões, controles e tabelas antes de telas específicas.
- [ ] Centralizar a matriz de cores/labels de estados nos contratos compartilhados, preservando enum e semântica de produto.
- [ ] Manter a fronteira: Design System não decide `CommercialSessionStatus`, permissões, chamadas GoodWe ou lógica de pagamento.
- [ ] Garantir foco visível, `aria-label` em ícones, legenda em gráfico e label textual de status.
- [ ] Respeitar breakpoints 1300px, 900px e 680px como ponto de partida; validar em viewport real antes de congelar.
- [ ] Aplicar o documento Mobile complementar ao Driver PWA; compartilhar tokens sem impor o shell desktop.
- [ ] Tratar assets SEMS como dependência visual explícita; validar direito de uso e migração antes de publicá-los no novo repositório.
- [ ] Criar uma spec de componentes/interação para os estados ainda não detalhados no CSS: hover, foco, loading, vazio, erro e permissões.

## 13. Decisões e pendências

### Decisões extraídas que podem ser adotadas agora

1. O Admin ChargeGrid usa canvas `#F1F2F3`, superfícies brancas, bordas sutis e vermelho GoodWe `#FF3049` como acento principal.
2. A família tipográfica-base é Segoe UI com fallbacks Arial/Helvetica/sans-serif.
3. A navegação administrativa é sidebar fixa recolhível, com 61px/231px e topbar de 48px.
4. Superfícies usam raio predominantemente de 10px; controles pequenos usam 7–11px; estados usam badges suaves.
5. Desktop é a prioridade; tabelas usam rolagem horizontal em vez de remoção silenciosa de colunas.

### Direção visual aprovada — 20 de agosto de 2026

O Admin ChargeGrid adota esta linguagem SEMS+ como identidade visual final do protótipo apresentado à GoodWe. Os ícones e PNGs fornecidos no projeto de referência são assets aprovados para esta demonstração e serão portados como dependência visual explícita do Admin Web.

O mapa operacional administrativo segue a mesma linguagem dark do sistema de referência: canvas escuro, marcadores vermelhos GoodWe, clusters e estado de fallback claro. Isso não transforma o mapa em fonte técnica: seus estados sempre são projeções comerciais e energéticas normalizadas pelo ChargeGrid.

### Pendências para SDD/design

- Para qualquer publicação além da demonstração, revalidar a licença, a origem e as restrições de uso dos PNGs/ícones com a GoodWe.
- Consolidar tokens em código sem perder os tons hoje dispersos no CSS.
- Definir estados de interação completos e critérios de contraste.
- Adaptar a barra inferior e os padrões mobile observados à arquitetura de navegação específica da Driver PWA, sem assumir que todos os destinos do SEMS+ serão reproduzidos.
- Decidir se dark mode, internacionalização e tema de alto contraste entram no MVP; o projeto analisado não os define.

## Apêndice — Mapeamento de evidências no projeto anterior

| Evidência | Conclusão documentada |
|---|---|
| `:root` em `src/styles/main.css` | cores principais e família tipográfica |
| `.sidebar`, `.sidebar-expanded`, `.main-area` | shell recolhível 61px/231px e transição |
| `.topbar`, `.topbar-actions`, `.topbar-promo` | barra superior compacta e ações utilitárias |
| `.surface`, `.content-card`, `.kpi-card` | superfícies, raio, borda e cards KPI |
| `.chargegrid-tabs`, `.status-tabs` | tabs com seleção vermelha/rosa e indicador |
| `.badge-*`, `.section-badge` | sistema semântico de estados |
| `.data-table`, `.table-wrap` | tabela administrativa com rolagem horizontal |
| `.recommendation-card`, `.energy-decision-panel` | comunicação de recomendação/alerta por faixa lateral |
| `@media` 1300px, 900px e 680px | comportamento responsivo de grids e shell |
| `src/ui/shell.js` e `src/constants/assets.js` | inventário de navegação e assets usados |
