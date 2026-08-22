# ChargeGrid Intelligence — Design System SEMS+/GoodWe Mobile v2.0 (revisado)

**Status:** normativo para a Driver PWA  
**Atualizado:** 21 de agosto de 2026  
**Dependência:** fundação SEMS+/GoodWe v2.0 e decisões da spec `driver-pwa-mobile`

## 1. Direção

A Driver PWA pertence ao mesmo ecossistema do Admin Web, mas não copia seu canvas escuro ou densidade. O padrão mobile é claro, predominantemente branco, com vermelho GoodWe, tipografia, iconografia e semântica de estados compartilhadas. O tema escuro é uma preferência opcional.

## 2. Invariantes

- Marca GoodWe em vermelho e assets homologados.
- Tema claro inicial: canvas `#F5F6F7`, superfícies `#FFFFFF`, texto `#1F2123` e bordas cinza suaves.
- Tema escuro opcional: tokens grafite da fundação compartilhada.
- Vermelho primário próximo a `#EF3238`; pressed/strong conforme tokens.
- Success, info, warning, danger e neutral mantêm o mesmo significado do Admin.
- Tipografia da implementação: Inter/system-ui com fallbacks seguros; não introduzir família por tela.
- Status técnico e comercial permanecem distintos.
- Nenhum emoji substitui logo, ícone, marcador ou asset final.

## 3. Escala mobile

| Papel | Regra |
| --- | --- |
| Viewport mínimo | 320 px |
| Conteúdo | 100%, máximo 720 px, padding lateral 16–20 px |
| Área de toque | mínimo 44×44 px; CTA preferencial 52–60 px |
| Header | 64–72 px + `safe-area-inset-top` |
| Bottom navigation | 72–82 px + `safe-area-inset-bottom` |
| Card | raio 16 px, padding 16–20 px |
| Campo | raio 12 px, altura mínima 52 px |
| CTA | pill, largura total quando representa a próxima etapa |

## 4. Chrome e navegação

- Header compacto com marca/título contextual e somente ações indispensáveis.
- Bottom navigation tem até quatro destinos e aparece apenas para motorista autenticado.
- Fluxos de QR, checkout e sessão priorizam a ação corrente e podem ocultar navegação concorrente.
- Safe areas são obrigatórias.

## 5. Componentes

### `MobileCard`

Superfície branca no tema claro, borda suave e sombra discreta. No tema escuro, usa superfície grafite equivalente. Evitar aninhamento excessivo.

### `EstablishmentCard`

Foto/asset real, nome, distância/endereço, horário, disponibilidade, potência, tarifa e fila. A ação corresponde ao estado comercial.

### `StatusChip`

Texto obrigatório e cor semântica; cor nunca é o único indicador.

### `PrimaryCTA`

Vermelho GoodWe, pill, alto contraste e uma ação dominante por contexto.

### `Field`

Label externa, fundo claro/cinza no tema claro, foco visível, ajuda e erro associados.

### `SessionHero`

Estado textual, energia, potência, custo e próxima ação. Nunca mostra energia antes de confirmação.

O `SessionHero` nunca exibe enum técnico. O estado combina label humana, ícone, cor semântica e orientação. A tolerância de ociosidade usa contador regressivo; quando encerrada, ícone, cor e mensagem mudam em conjunto.

## 6. Descoberta e mapa

- Explorar é uma seleção curta de recomendações; catálogo, filtros e mapa são superfícies distintas.
- Recomendações podem usar trilho horizontal com snap, sem transformar a tela em uma lista vertical extensa.
- O catálogo completo fica na aba Sessão sem contexto ativo, com busca, filtros recolhíveis e “Ver mais”.
- Google Maps real com estilo padrão legível no tema claro; não usar desenho cartográfico alternativo.
- Busca flutuante branca, sombra discreta e controles de toque.
- Em modo imersivo, busca e retorno são os únicos controles ChargeGrid sobre o mapa; Enter centraliza o endereço pesquisado.
- Marcador vermelho/semântico com disponibilidade numérica.
- Marcador representa estabelecimento/planta, não sessão.
- Cards permanecem utilizáveis quando a API externa falhar.
- O canvas do mapa só aparece após tiles reais; erro do provider não deve gerar flicker.
- Localização negada mantém busca manual equivalente.

## 7. Sessão e pagamento

| Estado | Tratamento mínimo |
| --- | --- |
| `AUTHORIZED` | sucesso da garantia sem alegar energia |
| `WAITING_START` | informação e preparação |
| `STARTING` | progresso e confirmação técnica |
| `CHARGING` | hero com kWh, potência, custo e encerrar |
| `ENERGY_FINISHED` | conclusão energética e retirada |
| `IDLE_GRACE_PERIOD` | warning e tolerância |
| `IDLE_FEE` | urgência, valor/minuto e acumulado |
| `SETTLING` | intermediário; nunca concluído |
| `COMPLETED` | comprovante e eventual devolução |
| falha | causa, impacto e próximo passo |

Stripe deve aparecer como ambiente de teste no checkout quando o sandbox estiver ativo, sem sugerir cobrança live.

## 8. Movimento e feedback

- Transições de 120–220 ms e respeito a `prefers-reduced-motion`.
- Loading preserva layout.
- Toast não substitui erro persistente ou confirmação financeira.
- Mudanças críticas usam live region moderada.

## 9. Acessibilidade

- Contraste WCAG AA, foco visível e labels acessíveis.
- Zoom de 200% não oculta CTA, valor ou erro.
- Ordem de foco acompanha a leitura.
- Botões de ícone têm nome acessível.
- Teclado aberto e safe areas não cobrem ações.

## 10. Não transportar do Admin

- Sidebar, topbar densa, tabelas largas e grid de quatro KPIs.
- Formulário administrativo multi-coluna.
- Telemetria bruta e controles técnicos de planta.
- Tema grafite como obrigação no primeiro acesso.

## 11. Checklist

- [ ] Tema claro é o estado inicial e usa tokens compartilhados.
- [ ] Tema escuro é opcional e não altera semântica.
- [ ] Existe uma ação primária clara.
- [ ] Estados usam enum e label oficiais.
- [ ] Preço, limite e ociosidade aparecem antes da autorização.
- [ ] Funciona em 320 px, safe area, teclado e zoom.
- [ ] Loading, vazio, offline, erro e permissão negada estão previstos.
- [ ] Mapa é real e sua falha não bloqueia a lista.
- [ ] Nenhum texto técnico sobre fixtures aparece na experiência final.
