# ChargeGrid Intelligence — Design System SEMS+ Mobile Extraído v1.0

**Status:** baseline mobile extraída de nove referências visuais do SEMS+  
**Uso:** Driver PWA ChargeGrid e experiências mobile derivadas; complementar ao Design System SEMS+ Extraído v1.0 do Admin Web  
**Evidência:** capturas de telas fornecidas em 19 de agosto de 2026  
**Natureza:** leitura visual de referência. Valores geométricos são aproximados quando não existem no código; não constituem guia oficial de marca ou componentes internos da GoodWe.

> **Regra de aplicação:** os tokens semânticos do documento desktop permanecem a base compartilhada. Este documento define como eles são organizados em tela pequena: menos densidade, toque prioritário, navegação inferior, cards de leitura imediata e ações de sessão evidentes. Ele não replica funcionalidades SEMS+ no ChargeGrid nem transforma screenshots em requisitos de produto.

## 1. Escopo e leitura das evidências

As imagens demonstram nove famílias de interface: lista de usinas, alarmes, serviços, estatísticas/indicadores energéticos, formulário de nova usina e mapa com bottom sheet. A extração considera padrões recorrentes entre elas, não detalhes de conteúdo de uma tela isolada.

| Família observada | Referências | Padrões relevantes ao ChargeGrid |
|---|---|---|
| Lista inicial de usinas | 1 | busca, tabs horizontais, card informativo, badge de status, navegação inferior |
| Alarmes | 2 | lista de cards, filtro por status, severity chip, item resolvido, ação de favorito |
| Serviços | 3 | banner, título de seção, grade de atalhos, contador de notificação |
| Estatísticas | 4–6 | segmented control, busca, cards de resumo, gauge, filtros, gráfico, donut e métricas ambientais |
| Formulário | 7 | cabeçalho com retorno, etapas, campos grandes, obrigatório, contador e CTA desabilitado |
| Mapa | 8–9 | conteúdo imersivo, busca sobre mapa, cluster/marcador, geolocalização e bottom sheet com CTA |

### 1.1 O que pode ser afirmado

- A identidade mobile privilegia canvas claro, cartões brancos grandes, arredondamento generoso, vermelho como seleção/CTA e estados por chips coloridos.
- A navegação global inferior possui quatro destinos e mantém label visível para o item ativo e os itens inativos.
- Busca, filtros, segmentação e mapa são padrões centrais de descoberta/gestão.
- Há um assistente flutuante recorrente no canto inferior direito, acima da navegação.

### 1.2 O que não pode ser afirmado

- Valores hex, fonte, tamanhos e componentes internos exatos não podem ser deduzidos com precisão de screenshots. Onde não houver valor no CSS administrativo, este documento usa faixas visuais e recomenda validação.
- A PWA ChargeGrid não herda automaticamente menus “Início”, “Alarme”, “Serviços” e “Conta”. Ela deve preservar a **linguagem**, mas definir destinos por jornada de motorista.
- Banner, mapas Google, GoodWe AI, serviços e fluxos de planta observados não são escopo funcional do Driver PWA por serem mostrados no SEMS+.

## 2. Princípios da linguagem mobile

1. **Uma ação por momento.** A tela mostra uma próxima ação forte — iniciar, pagar, entrar na fila, retirar o veículo ou visualizar local — sem competir com painel administrativo.
2. **Cartões legíveis à distância.** Conteúdo é agrupado em superfícies brancas, com títulos fortes, métricas grandes e detalhes muted.
3. **Contexto antes da ação.** Busca/tabs/filtros mostram onde o usuário está; preço, disponibilidade e condição da sessão devem anteceder a confirmação.
4. **Navegação persistente, tarefa focada.** A barra inferior é global; fluxos como QR, pagamento e sessão usam cabeçalho simples de retorno e evitam distração.
5. **Estado é uma frase, não só uma cor.** Chip colorido vem acompanhado por texto, ícone e, quando necessário, motivo e próxima consequência.
6. **Ação acessível pelo polegar.** CTAs e controles principais ficam na metade inferior/rodapé seguro, com alvos grandes e espaçamento confortável.
7. **Dados energéticos são explicáveis.** Indicadores, gráficos e origem de energia mostram unidade, legenda e período; não devem aparentar precisão não confirmada.

## 3. Fundação visual compartilhada

### 3.1 Cores

Os valores abaixo são herdados do CSS do Admin quando disponíveis; o papel mobile foi confirmado visualmente nas capturas.

| Token compartilhado | Valor de referência | Papel confirmado no mobile |
|---|---:|---|
| `color.brand.primary` | `#FF3049` | item de navegação ativo, sublinhado/tab ativo, CTA, passo atual, marcador de ação |
| `color.brand.primary-hover` | `#DF1C35` | variante forte de texto/ênfase; validar estado pressed no PWA |
| `color.canvas` | `#F1F2F3` | fundo claro de páginas de lista, serviços e formulário |
| `color.surface.base` | `#FFFFFF` | cards, input, barra inferior e bottom sheet |
| `color.text.primary` | `#08111F` | títulos, valores, CTA e navegação ativa |
| `color.text.muted` | `#7D8696` | rótulos, placeholders, descrição, labels inativas |
| `color.border.default` | `#E7E9ED` | linhas, campos, separadores e controles |
| `color.success` / `.subtle` | `#42C95A` / `#EFFBF1` | resolvido, operação saudável, energia favorável |
| `color.info` / `.subtle` | `#2F80FF` / `#EAF2FF` | em construção, informação/estado técnico |
| `color.warning` / `.subtle` | `#EBA900` / `#FFF7DA` | alarme, atenção, espera, tolerância |
| `color.danger` / `.subtle` | `#FF4D5E` / `#FFF0F2` | falha, campo obrigatório, estado crítico |
| `color.neutral.subtle` | `#F8F9FA` | bloco de métricas, fundo de chip neutro, área de gráfico |

### 3.2 Uso mobile de cor

- O canvas recebe cinza extremamente claro; cartões são brancos e definidos pelo raio/sombra leve ou contraste, não por bordas pesadas.
- O vermelho é visualmente dominante em CTA principal, seleção de navegação/tabs e alerta crítico, mas não deve preencher vários cards da mesma tela.
- Chips de sucesso são verdes claros; dados de resolução de alarmes aparecem em verde, enquanto a categoria “Falha” permanece em vermelho suave.
- Em gráfico/indicador, amarelo, laranja, verde e azul representam séries distintas. Legenda textual é necessária em qualquer gráfico ChargeGrid.

## 4. Tipografia e hierarquia

As capturas sugerem uma sans geométrica/humana próxima da família usada no Admin. A implementação deve usar a família compartilhada (`Segoe UI`, Arial, Helvetica, sans-serif) até que uma fonte GoodWe oficial seja fornecida.

| Papel mobile | Faixa visual aproximada | Características observadas | Aplicação ChargeGrid |
|---|---:|---|---|
| Título de página | 30–34px | bold, centralizado em fluxos | “Mapa”, “Nova recarga”, “Pagamento” |
| Título de seção | 27–31px | bold, alinhado à esquerda | “Serviços”, “Resumo da sessão” |
| Título de card/lista | 23–27px | semibold/bold | nome do estabelecimento, carregador, incidente |
| Métrica principal | 31–40px | forte, alta legibilidade | custo atual, kWh, tempo, posição da fila |
| Métrica secundária | 22–28px | forte, unidade menor | potência, estimativa de espera |
| Corpo | 18–22px | regular; alta altura de linha | descrição, endereço, regra, mensagem |
| Label / metadata | 16–20px | muted ou peso médio | data, unidade, campo, descrição auxiliar |
| Chip / navegação | 16–21px | semibold no ativo | estado e destino de nav |

### 4.1 Regras de tipos

- Toda métrica traz unidade próxima do número, mas visualmente menor: `8,4` + `kWh`, `R$ 12,50`, `15 min`.
- Valores ausentes usam representação explícita (`—`, “Sem leitura confirmada”) e não `0,00` se telemetria não estiver disponível.
- Informação acionável não deve usar os menores tamanhos observados no Admin; a referência mobile usa labels muito mais legíveis.
- Títulos longos devem quebrar em até duas linhas com descrição curta; não truncar razão de falha, preço ou estado crítico sem acesso a detalhes.

## 5. Geometria, espaços seguros e ritmo

### 5.1 Referência de viewport

As evidências foram capturadas em tela estreita e alta, aproximadamente 738px de largura. O PWA deve ser fluido; valores abaixo são ponto de partida, não largura fixa.

| Elemento | Medida/faixa visual | Diretriz |
|---|---:|---|
| Margem lateral padrão | 24–28px | alinhar busca, título, cards e CTA a uma mesma coluna |
| Espaço entre seções | 28–40px | separar blocos de tarefa, não usar linhas longas em excesso |
| Espaço interno de card | 24–32px | acomodar toque e leitura em blocos de dados |
| Raio de card | 20–24px | maior que o Admin, para sensação mobile suave |
| Raio de input | 18–22px | campo alto, borda discreta |
| Altura de busca/input simples | 64–72px | alvo de toque amplo e placeholder legível |
| Botão de ação circular | 64–68px | mensagem, filtro, adicionar e geolocalização |
| CTA primário inferior | 72–88px | largura quase total, raio pill grande |
| Barra inferior | ~126–145px incluindo safe area | fixa/ancorada; conteúdo não pode ficar oculto atrás dela |
| Assistente flutuante | ~60–72px | fica acima da barra inferior/CTA, nunca sobre ação crítica |

### 5.2 Espaços seguros

- O conteúdo começa abaixo da área do sistema e respeita `safe-area-inset-top`/`safe-area-inset-bottom` quando a PWA for instalada.
- Bottom sheets e CTAs fixos devem usar padding inferior adicional, para não conflitar com gesture bar ou a navegação inferior.
- Em fluxo de sessão/pagamento, o CTA fixo deve substituir ou recolher a navegação global, nunca competir com ela no mesmo espaço.

## 6. Navegação e chrome mobile

### 6.1 Barra inferior global

**Padrão observado:** superfície branca elevada com borda superior curva/ondulada sutil, quatro destinos centralizados com ícone grande e label abaixo. Ativo: ícone vermelho e label preto em peso forte. Inativo: ícone e label cinza.

| Característica | Observação | Aplicação ChargeGrid |
|---|---|---|
| Quantidade | 4 destinos | manter até quatro destinos principais para evitar menu comprimido |
| Estrutura | ícone sobre label | manter label sempre visível; não depender de símbolo isolado |
| Ativo | vermelho no ícone, label escuro | usar `brand.primary` e `text.primary` |
| Inativo | cinza | usar `text.muted`/neutral |
| Área de toque | item largo, distribuído igualmente | mínimo 44×44px; preferir área total de 64px+ |
| Elevação | superfície branca destacada do canvas | sombra/borda muito suave; não cobrir conteúdo |

**Tradução para a PWA (proposta de informação, não de design):** `Explorar`, `Sessão`, `Histórico` e `Conta` são candidatos naturais. A seleção final deve acompanhar as jornadas aprovadas: mapa/descoberta, sessão ativa, comprovantes/histórico e perfil. “Alarmes” e “Serviços” não devem ser copiados automaticamente do SEMS+.

### 6.2 Cabeçalho de fluxo

Nos formulários e mapas, o padrão é cabeçalho alto e simples: retorno à esquerda, título central em preto e nenhuma ação concorrente.

| Componente | Uso |
|---|---|
| `BackHeader` | QR, fila, pagamento, comprovante, detalhes do estabelecimento, configuração de perfil |
| Ícone de retorno | alvo amplo, à esquerda; não usar texto “voltar” se ícone estiver claro e houver label acessível |
| Título | centralizado; uma linha preferível; sem subtítulo em tarefas focadas |
| Divisor/etapa | abaixo do header quando há fluxo sequencial; vermelho identifica etapa atual |

### 6.3 Controle segmentado

Em Início/Estatísticas, aparece um switch em formato de cápsula com duas opções e painel interno branco no item ativo.

- Usar apenas para alternar duas visões de mesma hierarquia (por exemplo, `Lista`/`Mapa` ou `Disponibilidade`/`Sessões`).
- Altura aproximada de 64–72px e cápsula de grande raio.
- A opção ativa combina ícone e texto em vermelho; a inativa é cinza e sem preenchimento dominante.
- Não usar como filtro de status múltiplo; para isso, usar tabs horizontais.

## 7. Componentes de descoberta, listas e estados

### 7.1 Barra de busca e ações adjacentes

| Elemento | Padrão observado | Uso Driver PWA |
|---|---|---|
| `SearchField` | superfície branca, ícone de lupa, placeholder em cinza, raio alto | buscar estabelecimento/localização; não usar para buscar sessão privada de outro usuário |
| `IconAction` | quadrado branco arredondado de 64–68px | filtro, mensagens contextuais, adição quando houver permissão |
| Linha de ações | busca ocupa o espaço flexível; ações ficam à direita | manter gap de 12–16px e labels acessíveis |
| Filtro | ícone de funil, sem texto, em botão destacado | abrir bottom sheet/modal com filtros claros |

### 7.2 Tabs horizontais com contador

As telas de usinas e alarmes usam tabs em linha, com seleção vermelha e sublinhado curto; contadores são cápsulas compactas.

| Estado | Visual |
|---|---|
| Ativa | texto vermelho, peso médio/forte, sublinhado vermelho de ~60–70px |
| Inativa | texto escuro/muted; sem sublinhado |
| Contador ativo | badge vermelho com texto branco |
| Contador neutro | badge branco/cinza muito claro com texto cinza |

**Aplicação:** tabs adequadas para `Todos`, `Disponíveis`, `Com fila`, `Indisponíveis`; nunca usar fila para alterar tarifa ou sugerir reserva.

### 7.3 Card de estabelecimento/local

O card de usina observado tem imagem/identidade no topo, status em chip, metadados e um bloco de métricas em duas colunas. Para descoberta de recarga, reduzir métricas e priorizar decisão.

| Área | Conteúdo padrão ChargeGrid |
|---|---|
| Cabeçalho do card | nome do estabelecimento, distância/horário, chip de disponibilidade |
| Contexto | endereço resumido e potência nominal “até 7 kW” |
| Decisão | tarifa/segmento atual, fila/espera estimada quando aplicável |
| Ação | abrir detalhes ou iniciar fluxo QR; não iniciar energia de uma lista sem contexto/pagamento |
| Estado fechado/falha | card permanece visível com motivo, conforme produto; CTA de iniciar é removida/desabilitada |

### 7.4 Card de incidente/notificação

O padrão de alarmes é card branco com chip de categoria parcialmente encaixado no topo, título forte, texto descritivo, chip de resolução e ação discreta no canto.

- Para ChargeGrid, usar este padrão em notificações importantes: pagamento pendente, fila chamada, falha de carregador, interrupção por demanda, fim de tolerância.
- A categoria deve indicar severidade ou tipo (`Pagamento`, `Fila`, `Falha`, `Demanda`), não apenas cor.
- A ação de favorito observada no SEMS+ não é requisito da PWA; substituir por ação de contexto (ver comprovante, suporte, detalhes).

### 7.5 Chips e badges

| Semântica | Exemplo visual mobile | Aplicação |
|---|---|---|
| Informação | azul claro + ícone + texto | `CHARGING`, `STARTING`, “Em construção” de referência |
| Sucesso | verde claro + ícone + texto | pagamento confirmado, “Resolvido”, `OPEN_AVAILABLE` |
| Atenção | amarelo suave + texto | fila, `ALERT`, tolerância de ociosidade |
| Perigo | rosa/vermelho suave + texto | falha, pagamento recusado, `CRITICAL` |
| Neutro | cinza claro + texto | fechado, offline, não confirmado |

## 8. Cards de métricas, gráfico e sustentabilidade

### 8.1 Cards de resumo

As estatísticas combinam um card de alto nível (contagem/capacidade/status) com cards de dados em blocos. Há ampla separação visual entre agregação e detalhe.

| Padrão | Leitura observada | Uso recomendado no PWA |
|---|---|---|
| Hero metric | número alto + unidade/variação em chip | posição na fila, custo atual, energia entregue, tempo restante |
| Grid 2×n | ícone semântico, label em cinza e valor preto | resumo de sessão: kWh, R$, tarifa, limite restante |
| Status strip | 4–5 status divididos verticalmente | evitar no PWA quando houver mais de três itens; usar chips/lista horizontal |
| Gauge | número central e arco gráfico | somente quando há uma métrica única compreensível, como progresso da carga/limite financeiro |
| Donut | número central e legenda de categorias | composição de disponibilidade/energia, sempre com legenda |

### 8.2 Regras de dados energéticos

- Valor, unidade, período e caráter “estimado” devem aparecer juntos quando a fonte não for telemetria confirmada.
- Séries de geração/carregada/descarregada observadas em gráfico usam cores distinguíveis, mas a PWA ChargeGrid só deve exibir as métricas relevantes à recarga do motorista.
- “Origem de energia” ou benefício ambiental é informação explicativa; não deve prometer rastreabilidade física por sessão sem validação de dados.
- Quando não houver leitura, use estado vazio com mensagem. Não desenhar um gráfico de zeros como se fosse medição confirmada.

## 9. Formulários e progressão de fluxo

### 9.1 Formulário de uma coluna

O formulário “Nova usina” mostra o padrão mobile de tarefa: título central, indicador de etapas, label grande, campo amplo, ícone contextual, contador e CTA inferior.

| Componente | Padrão extraído | Uso ChargeGrid |
|---|---|---|
| `StepIndicator` | linha horizontal segmentada; etapa atual em vermelho | QR → condições → limite → pagamento → sessão; aplicar só quando a jornada for longa |
| `FieldLabel` | label escuro grande; asterisco vermelho quando obrigatório; ícone de ajuda | limite financeiro, e-mail opcional, veículo, dados de comprovante |
| `TextField` | branco, altura ~92px, raio alto, placeholder muted | entrada de dados simples; ícone no canto quando agrega contexto |
| `TextArea` | card branco alto, contador no canto inferior direito | suporte/observação; não usar para campos de fluxo principal |
| `PrimaryCTA` | botão largo, capsule, próximo ao rodapé | “Continuar”, “Confirmar pagamento”, “Iniciar recarga” |
| `DisabledCTA` | rosa muito claro + texto branco com baixo contraste visual | deve também possuir estado semântico/acessível e explicar requisito pendente |

### 9.2 Regras de validação

- Exibir erro próximo ao campo, com texto e ícone; borda/vermelho complementam, não substituem, a mensagem.
- “Continuar” fica habilitado somente quando os requisitos de produto estiverem satisfeitos; no fluxo ChargeGrid, garantia financeira validada é requisito antes da energia.
- O progresso da etapa não sugere que pagamento/recarga já ocorreu. `STARTING` continua sendo estado assíncrono.
- Não usar o padrão de formulário para administrar política comercial ou técnica; isso é Admin Web.

## 10. Mapa e bottom sheet

### 10.1 Estrutura observada

O mapa usa tela imersiva com cabeçalho de retorno, busca sobreposta, marcador/cluster e ação de geolocalização circular. Ao selecionar um local, surge um bottom sheet branco com grande raio superior, identificação, chip de status, endereço, dados e CTA vermelho.

| Camada | Padrão | Aplicação ChargeGrid |
|---|---|---|
| Header | retorno + título “Mapa” | `Explorar locais` ou nome do estabelecimento, conforme contexto |
| Busca overlay | branca, larga, sobre o mapa | busca de estabelecimento/local, não de carregador individual no mapa |
| Marcador/cluster | círculo escuro com contagem ou marcador colorido | cluster de estabelecimentos, não revelar dados de sessões |
| Geolocalização | botão circular escuro no canto inferior | centralizar localização após permissão explícita |
| Bottom sheet | surface branca, topo arredondado, conteúdo em pilha | nome, status comercial, distância, horário, tarifa, fila, potência nominal, CTA |
| CTA | vermelho, largura quase total | “Ver detalhes” ou “Escolher este local”; início só após condições e pagamento |

### 10.2 Estados comerciais no mapa

| `CommercialAvailability` | Tratamento móvel |
|---|---|
| `OPEN_AVAILABLE` | marcador/chip de sucesso; CTA de detalhes/escolha |
| `OPEN_PARTIAL` | estado de atenção e número de vagas/condição resumida |
| `FULL_QUEUE` | chip de atenção; mostra espera/entrada na fila, sem transformar em reserva |
| `CLOSED` | local continua visível com horário/motivo; remove CTA de início |
| `MAINTENANCE` | contexto de manutenção; não promete reabertura sem dado |
| `FAULT` | contexto de falha/indisponibilidade; oferece alternativa/retorno à lista |

### 10.3 Regras específicas

- O mapa é a superfície de descoberta do motorista; Admin Web não precisa reproduzir esse padrão.
- O bottom sheet é o local para conversão: informações suficientes antes de pedir pagamento ou QR.
- A camada de mapa, tiles e integração de localização ficam para SDD; este documento descreve composição visual, não fornecedor ou API.

## 11. Sessão de recarga — aplicação dos padrões mobile

Não há screenshot de ChargeGrid, portanto esta seção é uma tradução mínima dos padrões observados para as regras já congeladas do produto. Não introduz nova funcionalidade.

| Situação de produto | Estrutura visual recomendada | Elementos obrigatórios |
|---|---|---|
| Antes da recarga | `BackHeader` + card de carregador/local + preço e regras + CTA | potência nominal, segmentos tarifários aceitos, ociosidade, limite, disponibilidade |
| `AWAITING_PAYMENT` | formulário/foco de uma coluna + CTA fixo | meio, limite, estado de confirmação, retorno seguro |
| `STARTING` | card hero com informação/azul e progresso | “Iniciando recarga”; não mostrar kWh como entregue antes da confirmação |
| `CHARGING` | card hero + grid de energia/custo/tempo + ação segura de encerrar | potência e energia só quando confirmadas, custo estimado, tarifa aceita |
| `SUSPENDED_BY_DEMAND` | painel de atenção com faixa lateral/chip + explicação | motivo, energia confirmada até então, que não é pausa nativa, próxima atualização |
| `ENERGY_FINISHED` | card de conclusão energética + aviso de retirada | energia final, custo de energia, início de tolerância se veículo conectado |
| `IDLE_GRACE_PERIOD` | alert card amarelo + contador grande + CTA de retirada | minutos gratuitos restantes e taxa posterior |
| `IDLE_FEE` | alert card com valor/minuto e acumulado | taxa, tempo cobrado, teto, ação clara |
| `SETTLING` / pendência | painel neutro/atenção + status de pagamento | total, captura/devolução em andamento; não chamar de concluída |
| `COMPLETED` | recibo em card + valores finais + ação de histórico | energia, ociosidade, total, método, devolução se Pix |
| Falha/pagamento recusado | card danger com causa e próximo passo | valor confirmado, suporte/alternativa, sem ociosidade indevida |

## 12. Estados de interação e acessibilidade a definir no SDD

As fotos permitem extrair aparência de repouso/seleção, mas não comportamento completo. A implementação deve fechar estas regras antes de construir telas:

| Estado | Diretriz mínima |
|---|---|
| Pressed | diminuir sutilmente elevação/contraste de botão ou superfície; não alterar significado de cor |
| Foco | manter outline claramente visível para teclado e leitor de tela, inclusive em mapa, tabs e bottom sheet |
| Loading | usar skeleton em card/campo; preservar última telemetria confirmada com timestamp quando relevante |
| Offline | comunicar limitações e não substituir telemetria desconhecida por zero |
| Vazio | explicar estado e fornecer ação: “Nenhum local encontrado”, “Não há sessões ativas” |
| Erro de campo | label, mensagem textual, ícone e contorno danger; manter conteúdo digitado |
| Permissão de localização | solicitar no momento de valor e fornecer busca manual equivalente |
| Screen reader | labels de ícones, chip com texto, ordem de foco coerente, live region limitada para mudanças de sessão |

## 13. O que compartilhar e o que não compartilhar com o Admin

| Compartilhar | Não compartilhar literalmente |
|---|---|
| cores semânticas, família tipográfica, linguagem de badge, tom de cards, ícones autorizados | sidebar, topbar desktop, tabelas largas, grids de KPI de quatro colunas |
| `Surface`, `StatusBadge`, `PrimaryCTA` e estados de informação | dimensões de padding/raio do desktop |
| tokens de borda, dados estimados/confirmados e critérios de acessibilidade | menus específicos SEMS+ como “Alarmes” e “Serviços” |
| composição de alerta, motivo e próxima ação | conteúdo técnico de planta e administração comercial |

## 14. Checklist de implementação da Driver PWA

- [ ] Usar o documento de Contratos e Enums para labels, estados e visibilidade; Design System não redefine produto.
- [ ] Criar tokens compartilhados de cor e tipo, com variantes de espaço/raio mobile.
- [ ] Implementar `MobilePage`, `BackHeader`, `BottomNavigation`, `SearchField`, `IconAction`, `StatusChip`, `MobileCard`, `PrimaryCTA` e `BottomSheet` antes das páginas.
- [ ] Garantir `safe-area` para navegação inferior, CTA fixo e bottom sheet.
- [ ] Não usar barra inferior dentro de pagamento, QR, sessão ativa crítica ou qualquer fluxo em que CTA fixo já ocupe o rodapé.
- [ ] Exibir preço, tarifa segmentada, ociosidade e limite antes de autorização; respeitar transparência de produto.
- [ ] No mapa, usar marcador por estabelecimento e tratar `CommercialAvailability` — não construir mapa de conectores individuais.
- [ ] Não exibir dado `DEMO_ONLY` como telemetria GoodWe nativa; usar rótulo de simulação na demo quando necessário.
- [ ] Validar em viewport narrow e em teclado/leitor de tela, não apenas em screenshot.

## 15. Decisões e pendências

### Decisões que passam a ser base visual

1. A PWA adotará uma linguagem SEMS+ mobile de canvas claro, cards brancos grandes, raio amplo, toque generoso e vermelho GoodWe como seleção/ação principal.
2. A referência para navegação global é uma barra inferior com quatro destinos, labels sempre visíveis e estado ativo vermelho/preto; os destinos ChargeGrid continuam sujeitos à arquitetura de informação da PWA.
3. Mapa com busca sobreposta e bottom sheet é o padrão visual de descoberta, alinhado ao escopo já definido para o mapa do motorista.
4. Formulários de tarefa usam uma coluna, campos altos, progresso simples e CTA inferior seguro.
5. Dados de sessão usam card hero e métricas grandes; detalhes administrativos permanecem no Admin Web.

### Pendências de SDD/design

- Medir tokens exatos em fonte oficial/Figma ou código SEMS+ autorizado, caso se deseje fidelidade pixel a pixel.
- Definir a arquitetura final dos quatro destinos da PWA e quando a barra inferior desaparece.
- Criar especificação de estados pressed/focus/loading/vazio/erro e testes de acessibilidade.
- Escolher SDK/fornecedor de mapa e política de permissão de localização; esta decisão não é de Design System.
- Validar licença e disponibilidade dos ícones/assistente SEMS+ antes de transportar assets para o novo repositório.

## Apêndice A — Padrões visuais por referência

| Referência | Evidência extraída |
|---|---|
| 1 | segmentação, busca com ações, tabs com contador, card de usina, barra inferior e assistente |
| 2 | lista de incidentes, chips de severidade/resolução, ação de contexto e tabs de filtro |
| 3 | banner e cards de atalho em grade com badge de notificação |
| 4 | switch de visão, resumo de planta, status strip, gauge e filtros de período |
| 5 | grid de métricas econômicas, título de gráfico e superfície analítica |
| 6 | legenda de séries, donut de alarmes e métricas ambientais |
| 7 | cabeçalho de fluxo, step indicator, input/textarea e CTA desabilitado |
| 8 | mapa imersivo, busca, cluster e geolocalização |
| 9 | marcador de local, bottom sheet informativo e CTA pill principal |

## Apêndice B — Relação entre os documentos de Design System

| Documento | Superfície principal | Fonte | Regra |
|---|---|---|---|
| `ChargeGrid_Intelligence_Design_System_SEMS_Extraido_v1.0.md` | Admin Web desktop-first | CSS e código do dashboard anterior | fonte de tokens exatos disponíveis e padrões administrativos |
| `ChargeGrid_Intelligence_Design_System_SEMS_Mobile_Extraido_v1.0.md` | Driver PWA mobile-first | referências visuais mobile fornecidas | fonte de composição mobile e adaptação de jornada |

