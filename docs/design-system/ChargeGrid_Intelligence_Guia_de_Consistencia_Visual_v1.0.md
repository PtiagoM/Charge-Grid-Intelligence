# ChargeGrid Intelligence — Guia de Consistência Visual v1.0

**Status:** normativo para specs, implementação e revisão visual

## 1. Objetivo

Garantir que Admin Web, Driver PWA e futuras superfícies pareçam partes do mesmo ChargeGrid/SEMS+, ainda que tenham densidade e jornadas diferentes.

## 2. Invariantes

| Dimensão | Regra comum |
|---|---|
| Marca | vermelho GoodWe `#FF323A`; logos e ícones aprovados |
| Ambiente | Admin usa canvas grafite; Driver PWA usa tema claro e predominância branca por padrão |
| Hierarquia | profundidade por superfícies e bordas suaves adequadas ao tema ativo |
| Tipo | Poppins com fallback obrigatório Segoe UI/Arial |
| Forma | raio 8/12/16px; pill para CTA/chip |
| Estado | success verde, info azul, warning amarelo, danger vermelho, neutral cinza |
| Conteúdo | dado + unidade + período/origem quando aplicável |
| Acessibilidade | label textual, foco visível, contraste AA e área de toque adequada |

## 3. Variações permitidas

| Admin Web | Driver PWA |
|---|---|
| sidebar 64px e topbar | header simples e bottom navigation |
| grids de 4 colunas | uma coluna ou grid 2×n |
| controles com 36–40px | controles com 48–60px |
| tabelas densas | cards/listas progressivas |
| formulários multi-coluna | formulários de uma coluna |
| mapa operacional de rede | mapa de descoberta e bottom sheet |

Admin e PWA compartilham marca, vermelho, iconografia e significado de status. A paleta de superfícies varia por decisão explícita: escura no Admin e clara por padrão na PWA.

## 4. Nomenclatura visual

- Componentes usam nomes de papel: `Surface`, `StatusBadge`, `PrimaryCTA`, `MapPanel`; não nomes de página.
- Tom visual usa `brand`, `success`, `info`, `warning`, `danger`, `neutral`.
- Enum de negócio não é renomeado para combinar com o componente.
- “Offline técnico” nunca é apresentado como “fechado comercial”.

## 5. Matriz de consistência

| Elemento | Regra |
|---|---|
| Logo | proporção original; sem recolorir, distorcer ou aplicar sombra |
| Ícone | asset aprovado; tamanho consistente por contexto; `aria-label` em ação |
| CTA primário | vermelho, pill, uma ação dominante por contexto |
| Ação secundária | grafite e borda/contraste suave |
| Badge | texto obrigatório; fundo semântico sutil |
| Card | superfície correspondente ao tema + borda suave; sombra apenas quando elevada |
| Campo | superfície contrastante, label externa e foco visível |
| Tabela | header `surface.4`, linhas `surface.1`, scroll horizontal |
| Mapa | Google Maps real; Admin pode usar tema escuro e PWA prioriza legibilidade clara; marcador e fallback consistentes |
| Vazio | explicação e próxima ação; nunca gráfico falso de zeros |
| Erro | causa, impacto e recuperação; não apenas toast/cor |

## 6. Proibições de regressão

- Usar cores, superfícies ou gradientes fora dos tokens v2 como fundação.
- Usar emoji em logo, mapa, navegação, status ou cards finais.
- Adotar outra biblioteca visual ou família tipográfica sem decisão registrada.
- Criar vermelho diferente por app.
- Fazer componente local redefinir tokens globais.
- Comunicar estado somente por cor.
- Copiar componente desktop para mobile sem adaptar densidade e toque.

## 7. Evidência obrigatória em PR visual

Toda alteração visual relevante deve apresentar:

1. Screenshot desktop ou mobile no viewport-alvo.
2. Estados normal, hover/pressed, foco, disabled e erro quando existirem.
3. Loading, vazio e offline para superfícies de dados.
4. Comparação com a implementação homologada ou referência do documento.
5. Confirmação de uso dos tokens e assets aprovados.
6. Teste em viewport mínimo e zoom/fonte ampliada quando aplicável.

## 8. Critério de aceite visual

Uma tela é consistente quando:

- parece pertencente ao SEMS+/ChargeGrid antes da leitura do logo;
- mantém hierarquia clara em escala de cinzas;
- tem no máximo uma ação primária dominante por contexto;
- preserva distinções de estado do produto;
- não depende de placeholder visual para parecer completa;
- permanece utilizável com teclado, foco e viewport-alvo.

## 9. Processo de divergência

Se uma feature precisar divergir:

1. registrar a necessidade em `decisions.md` da spec;
2. demonstrar por que tokens/componentes atuais não atendem;
3. avaliar impacto em Admin e PWA;
4. atualizar o Design System antes de consolidar uma nova regra global.

Uma decisão local não pode alterar silenciosamente identidade, contratos ou produto.
