# ChargeGrid Intelligence — Design System SEMS+/GoodWe v2.0

**Status:** aprovado e normativo

**Superfícies:** Admin Web, fundação compartilhada e futuras interfaces ChargeGrid

**Implementação homologada:** `apps/admin-web/src/styles/app.css`

**Base visual:** interface do repositório `Dashboard_Comercial-ChargeGrid`, validada em 20 de agosto de 2026

> Este documento substitui integralmente as especificações visuais v1. O ChargeGrid é apresentado visualmente como extensão comercial nativa do ecossistema SEMS+/GoodWe.

## 1. Decisão visual

O ChargeGrid usa a mesma linguagem visual do SEMS+: tema grafite escuro, navegação compacta, superfícies por profundidade, vermelho GoodWe como acento, iconografia PNG do ecossistema e alta densidade informacional no Admin.

A adaptação de produto altera conteúdo, dados, permissões e destinos — não a identidade visual. Uma tela ChargeGrid deve parecer pertencente ao mesmo conjunto de produtos, sem fingir que regra comercial é telemetria SEMS+.

## 2. Princípios

1. **Continuidade SEMS+.** Shell, ritmo, iconografia, contraste e comportamento visual mantêm familiaridade com o produto GoodWe.
2. **Grafite como ambiente.** O canvas nunca é branco na identidade aprovada. Hierarquia vem de superfícies escuras graduais.
3. **Vermelho com intenção.** Vermelho identifica marca, seleção, CTA principal e perigo; contexto e label distinguem esses usos.
4. **Dados primeiro.** KPIs, tabelas, mapas e estados têm alta legibilidade e baixa ornamentação gratuita.
5. **Estado não depende só de cor.** Todo status combina texto e, quando útil, ícone ou motivo.
6. **Uma linguagem, densidades diferentes.** Admin é denso; Driver PWA é tátil e progressivo. Ambos compartilham tokens e assinatura visual.
7. **Assets reais, não substitutos improvisados.** Não usar emoji ou ícone genérico quando existe asset aprovado.
8. **Produto permanece soberano.** Design não cria comandos GoodWe, estados, dados ou jornadas inexistentes.

## 3. Tokens canônicos

Os valores abaixo correspondem à camada final efetivamente aplicada na implementação homologada.

### 3.1 Cor

| Token | Valor | Papel |
|---|---:|---|
| `color.canvas` | `#0D0D0F` | fundo global |
| `color.surface.1` | `#1F2123` | shell e superfície baixa |
| `color.surface.2` | `#202224` | painéis principais |
| `color.surface.3` | `#2C2D30` | cards, cabeçalhos e grupos |
| `color.surface.4` | `#3A3A3C` | campos, controles e superfícies elevadas |
| `color.field` | `#3A3A3C` | input, select e textarea |
| `color.text.primary` | `#FFFFFF` | títulos, métricas e ações |
| `color.text.secondary` | `rgba(245,246,248,.60)` | descrições e metadados |
| `color.text.muted` | `rgba(245,246,248,.50)` | informação terciária |
| `color.border.soft` | `rgba(255,255,255,.08)` | contorno padrão |
| `color.border.strong` | `rgba(255,255,255,.16)` | foco estrutural e separação forte |
| `color.brand.primary` | `#FF323A` | GoodWe, CTA, seleção e destaque |
| `color.brand.strong` | `#D8212D` | hover/pressed do primário |
| `color.brand.subtle` | `rgba(255,50,58,.14)` | fundo de seleção e badge |
| `color.success` | `#4ECB57` | disponível, normal, concluído |
| `color.info` | `#2F86FF` | em andamento e informação |
| `color.warning` | `#F6C443` | espera, parcial e atenção |
| `color.danger` | `#FF323A` | falha, crítico e erro |
| `color.neutral` | `rgba(245,246,248,.50)` | offline, fechado e desconhecido |

Cada cor semântica possui fundo sutil com opacidade de `16%`. O vermelho de marca possui borda sutil `rgba(255,50,58,.42)` quando usado em seleção ou foco.

### 3.2 Tipografia

| Papel | Família | Faixa | Peso |
|---|---|---:|---:|
| Família principal | `Poppins, "Segoe UI", Arial, Helvetica, sans-serif` | — | — |
| Título de página | mesma família | 28–31px | 700–800 |
| Título de seção | mesma família | 18–22px | 700 |
| Métrica principal | mesma família | 28–34px | 700–800 |
| Corpo | mesma família | 13–14px | 400–500 |
| Label/tabela | mesma família | 11–13px | 500–700 |
| Microcopy | mesma família | 10–12px | 400–600 |

Poppins é a preferência visual. Enquanto não houver fonte empacotada/licenciada no repositório, o fallback obrigatório é Segoe UI; não introduzir outra família por feature.

### 3.3 Espaçamento

Escala compartilhada: `4, 8, 12, 16, 20, 24, 32px`.

- Painel desktop: 20–24px.
- Gap entre seções: 18–20px.
- Gap interno de grids: 12–16px.
- Linha de tabela: 14–18px vertical, conforme densidade.
- Controles: mínimo 36px no Admin e 48px no mobile.

### 3.4 Raio, borda e elevação

| Token | Valor | Uso |
|---|---:|---|
| `radius.sm` | `8px` | badge, botão e subcard |
| `radius.md` | `12px` | painel e campo |
| `radius.lg` | `16px` | shell, modal e card hero |
| `radius.pill` | `100px` | CTA e chip |
| `border.default` | `1px solid rgba(255,255,255,.08)` | superfície e controle |
| `shadow.soft` | `0 18px 60px rgba(0,0,0,.28)` | painel elevado |
| `shadow.card` | `8px 8px 16px rgba(0,0,0,.20), inset 0 0 40px rgba(255,255,255,.12)` | cards SEMS+ característicos |
| `shadow.brand` | `0 0 0 1px rgba(255,50,58,.25), 0 10px 26px rgba(255,50,58,.22)` | CTA/foco primário |

## 4. Shell administrativo

| Elemento | Regra aprovada |
|---|---|
| Sidebar | 64px, `#111214`, fixa, canto direito 16px, ícones centralizados |
| Logo | marca compacta branca de 34px + label `SEMS+` |
| Item ativo | cápsula grafite, contraste elevado e tooltip textual |
| Topbar | transparente sobre canvas, ações à direita, promoção contextual em gradiente escuro/vermelho |
| Área principal | deslocamento de 64px, padding 20px, largura fluida |
| Cabeçalho | título branco forte, subtítulo e timestamp secundários, ação à direita |
| Assistente | orb flutuante no canto inferior direito; nunca cobre CTA crítico |

Não expandir a sidebar com rótulos permanentes no desktop homologado. Não transportar a sidebar para a PWA.

## 5. Componentes normativos

### 5.1 Superfícies

- `Surface/Panel`: `surface.2`, borda suave, raio 12px, padding 20px.
- `KpiCard`: `surface.1`, label secundária, valor branco forte, ajuda curta e acento inferior opcional.
- `DetailCard`: grid interno em `surface.1`, raio 12px e contorno suave.
- `AssistantCard`: bloco secundário com texto explicativo; não implica IA ativa.
- `MapPanel`: mapa escuro, resumo flutuante em três linhas e título contextual.

### 5.2 Navegação e filtros

- Tabs de dispositivo usam texto forte e ativo branco; inativos são secondary.
- Tabs de status combinam ponto colorido, label e contador; a primeira/selecionada recebe sublinhado vermelho.
- Toolbar usa botão `Filter`, campos escuros, ações quadradas e CTA pill vermelho no extremo direito.
- Todo icon button possui `aria-label` e área clicável mínima de 36px.

### 5.3 Tabelas

- Cabeçalho em `surface.4`, texto branco semibold.
- Corpo em `surface.1`, divisores suaves e hover discreto.
- Identidade da entidade combina miniatura, nome forte e metadado secundário.
- Tabelas largas usam scroll horizontal; não reduzir texto até ilegibilidade.
- Ações secundárias são botões grafite; somente criação/ação principal usa vermelho.

### 5.4 Formulários

- Grid administrativo com até quatro colunas e quebra progressiva.
- Label acima do campo, 11–12px, secondary.
- Campo em `surface.4`, raio 12px, borda transparente/suave.
- Foco precisa de outline visível; erro combina mensagem, borda e ícone.
- Submit primário ocupa a largura do grid e usa pill vermelho com glow discreto.

### 5.5 Visualizações

- Barras: trilha `surface.4`, preenchimento em gradiente vermelho.
- Mapa: estilo noturno, marcadores vermelhos, cluster com contagem e fallback visual equivalente.
- Gráficos sempre exibem label, unidade, período e origem/qualidade quando relevante.
- Nenhum gráfico inventa telemetria ausente; vazio não é zero.

## 6. Estados semânticos ChargeGrid

| Família | Cor | Exemplos |
|---|---|---|
| Sucesso | verde | `AVAILABLE`, `AVAILABLE_TO_START`, `NORMAL`, `PAID`, `COMPLETED` |
| Informação | azul | `STARTING`, `CHARGING`, `AUTHORIZED`, `CALLED` |
| Atenção | amarelo | `OCCUPIED`, `OPEN_PARTIAL`, `WAITING`, `IDLE_GRACE_PERIOD`, `SUSPENDED_BY_DEMAND` |
| Perigo | vermelho | `FAULT`, `FAULTED`, `CRITICAL`, `PAYMENT_FAILED`, `START_FAILED` |
| Neutro | cinza | `OFFLINE`, `UNAVAILABLE`, `CLOSED`, `MAINTENANCE`, `CANCELLED`, `UNKNOWN` |

O mesmo carregador pode ter badge técnico azul/verde e badge comercial amarelo/cinza. Nunca colapsar os dois estados.

## 7. Login

- Canvas `#0D0D0F` com duas colunas equivalentes em desktop.
- Painel de marca à esquerda; autenticação à direita.
- Logo GoodWe, nome ChargeGrid e explicação curta do papel comercial.
- Campos amplos em `surface.4`; CTA pill vermelho em largura total.
- Contas demo aparecem como atalhos grafite; produção substituirá o mecanismo, não a composição.
- Em viewport estreita, os painéis empilham e preservam contraste e espaçamento.

## 8. Responsividade Admin

- ≥1200px: grids de quatro colunas e tabelas completas.
- 900–1199px: grids de duas colunas; promoção pode ser omitida.
- <900px: painéis empilhados e tabelas roláveis.
- <680px: controles simplificados, sem esconder ações críticas.

Admin responsivo não se transforma na Driver PWA. A PWA segue seu documento próprio.

## 9. Acessibilidade

- Contraste mínimo WCAG AA para texto funcional.
- Foco visível em links, botões, tabs, campos e controles do mapa.
- Status com texto; ícone e cor são reforço.
- Imagem decorativa usa `alt=""`; imagem informativa possui descrição útil.
- Respeitar `prefers-reduced-motion` em transições, orb e feedback.
- Zoom de 200% não pode impedir ação crítica ou leitura de erro.

## 10. Proibições

- Usar canvas, superfície ou texto fora dos tokens canônicos v2.
- Misturar temas ou escalas cromáticas locais com os painéis SEMS+.
- Emoji como logo, navegação, estado ou ilustração final.
- Ícones de bibliotecas com traço conflitante quando há asset aprovado.
- Gradientes decorativos fora dos padrões explicitamente homologados.
- Sombras claras genéricas, glassmorphism ou neon fora do padrão homologado.
- Criar variante visual local sem registrar decisão no Design System.

## 11. Fonte técnica

- Tokens portáveis ficam em `packages/shared/src/styles/tokens.css`.
- Componentes permanecem em cada app até repetição real justificar pacote visual.
- O CSS homologado do Admin é evidência executável do sistema, não licença para copiar regra de produto ou fixture do projeto-base.
- A PWA herda tokens, assets e semântica; composição e densidade seguem o documento mobile.
