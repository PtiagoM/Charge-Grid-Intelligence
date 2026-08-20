# ChargeGrid Intelligence — Design System SEMS+/GoodWe Mobile v2.0

**Status:** aprovado como fundação da Driver PWA

**Dependência:** Design System SEMS+/GoodWe v2.0

**Escopo:** composição mobile; não define jornadas ou regras de produto

## 1. Direção

A Driver PWA deve parecer parte do mesmo ecossistema do Admin e do SEMS+, sem reproduzir sua densidade ou sidebar. A assinatura permanece grafite escura, vermelha GoodWe e baseada nos mesmos assets. A experiência mobile prioriza toque, uma ação por etapa e leitura rápida.

A PWA utiliza exclusivamente a fundação visual v2 descrita neste conjunto documental.

## 2. Invariantes compartilhados

- Canvas `#0D0D0F`.
- Superfícies `#1F2123`, `#202224`, `#2C2D30` e `#3A3A3C`.
- Texto branco, secondary com 60% e muted com 50%.
- GoodWe red `#FF323A`; pressed `#D8212D`.
- Mesma matriz de success/info/warning/danger/neutral do Admin.
- Família `Poppins, "Segoe UI", Arial, Helvetica, sans-serif`.
- Assets SEMS+ aprovados, sem emoji final.
- Status técnico e comercial continuam distintos.

## 3. Escala mobile

| Papel | Regra |
|---|---|
| Viewport mínimo | 320px |
| Conteúdo | 100%, máximo 720px, padding lateral 16–20px |
| Área de toque | mínimo 44×44px; CTA preferencial 52–60px |
| Header | 64–72px + `safe-area-inset-top` |
| Bottom navigation | 72–82px + `safe-area-inset-bottom` |
| Título de página | 28–34px, peso 700–800 |
| Título de card | 18–24px, peso 700 |
| Corpo | 14–16px |
| Label | 12–13px |
| Card | raio 16px, padding 16–20px |
| Campo | raio 12px, altura mínima 52px |
| CTA | pill 100px, largura total quando representa próxima etapa |

## 4. Chrome mobile

### 4.1 Header

- Marca GoodWe/ChargeGrid compacta, título contextual e ação indispensável.
- Fundo `surface.1` ou transparente sobre canvas; divisor suave.
- Em fluxo profundo, usar back button de asset coerente e título curto.
- Não transportar promoção, avatar completo ou quatro ações da topbar desktop.

### 4.2 Navegação inferior

- Até quatro destinos persistentes, definidos pela spec da PWA.
- Ícone aprovado acima e label sempre visível.
- Ativo: vermelho GoodWe + texto branco; inativo: muted.
- Desaparece em QR, pagamento, sessão crítica ou fluxo com CTA fixo quando competir por espaço.
- Nunca usar itens administrativos do SEMS+ apenas por semelhança visual.

## 5. Componentes mobile

### `MobilePage`

Canvas, safe areas, header opcional, região principal e espaço reservado para navegação/CTA. Centraliza comportamento de viewport; não contém regra comercial.

### `MobileCard`

Superfície escura, borda suave, raio 16px. Pode ter miniatura real, header, metadados, métricas e ação. Evitar vários níveis aninhados.

### `EstablishmentCard`

- Foto/asset real ou mapa, nunca ilustração por emoji.
- Nome, distância/endereço, horário e `CommercialAvailability`.
- Disponíveis, potência nominal, tarifa e fila com labels explícitos.
- CTA coerente com o estado: detalhes, entrar na fila ou indisponível.

### `StatusChip`

Pill compacta com texto; ponto/ícone opcional. Cores vêm da matriz compartilhada. O chip não reduz `FAULT` e `CLOSED` ao mesmo significado.

### `PrimaryCTA`

Vermelho, pill, altura 52–60px, peso 700. Uma ação primária por contexto. Disabled usa superfície/contraste reduzido e mensagem que explica o requisito.

### `Field`

Label externa, campo em `surface.4`, foco visível, erro textual e ajuda associada. Teclado/tipo do campo deve corresponder ao dado.

### `BottomSheet`

Superfície `surface.2`, raio superior 20–24px, handle discreto, scroll interno seguro e CTA fora da área obstruída. Usado para detalhes de local/mapa e escolhas curtas.

### `SessionHero`

Estado textual, tempo/energia/custo destacados e próxima ação. Nunca comunica energia iniciada antes da confirmação assíncrona.

## 6. Descoberta e mapa

- Mapa escuro alinhado ao Admin, mas orientado à descoberta do motorista.
- Busca sobreposta em `surface.3/4`, marcador vermelho e clusters com contagem.
- Seleção abre bottom sheet com nome, disponibilidade comercial, distância, horário, tarifa, fila e potência.
- Marcador representa estabelecimento/planta comercial, não identidade de sessão.
- `OPEN_PARTIAL`, `FULL_QUEUE`, `CLOSED`, `MAINTENANCE` e `FAULT` mantêm tratamentos e labels distintos.
- Oferecer busca manual equivalente quando localização for negada.

## 7. Sessão e pagamento

| Estado | Tratamento visual mínimo |
|---|---|
| `AWAITING_PAYMENT` | card/foco de pagamento, valor/limite e CTA seguro |
| `AUTHORIZED` | confirmação success sem alegar início da energia |
| `STARTING` | info, progresso e texto “Iniciando recarga” |
| `CHARGING` | hero, kWh, potência, custo estimado, tempo e encerrar |
| `SUSPENDED_BY_DEMAND` | warning, motivo e próxima atualização; não usar ícone de pause nativo |
| `ENERGY_FINISHED` | conclusão energética + instrução de retirada |
| `IDLE_GRACE_PERIOD` | warning + contador e tarifa futura |
| `IDLE_FEE` | danger/warning conforme urgência + valor/minuto e acumulado |
| `SETTLING` | estado intermediário; não chamar de concluído |
| `COMPLETED` | recibo, energia, ociosidade, total e devolução quando aplicável |
| falha | danger, causa, valor confirmado e próximo passo |

## 8. Movimento e feedback

- Transições de 120–220ms para pressão, entrada de sheet e mudança de estado.
- Respeitar `prefers-reduced-motion`.
- Loading preserva layout e, quando houver, última leitura confirmada com timestamp.
- Toast não substitui erro persistente ou confirmação financeira.
- Mudança crítica de sessão usa live region moderada e não repete atualizações de telemetria continuamente.

## 9. Acessibilidade

- Texto funcional em contraste WCAG AA.
- Zoom de 200% e fontes ampliadas não podem ocultar CTA ou valor.
- Ordem de foco segue leitura visual.
- Botões de ícone têm nome acessível.
- Cor nunca é único indicador.
- Safe areas são obrigatórias em header, CTA fixo, bottom nav e sheet.

## 10. O que não transportar do Admin

- Sidebar, topbar densa, tabelas largas ou grids de quatro KPIs.
- Formulário administrativo multi-coluna.
- Controles técnicos de planta, telemetria bruta e filtros de rede.
- Orb flutuante quando conflitar com CTA, navegação ou bottom sheet.

## 11. Checklist para specs mobile

- [ ] A tela usa tokens v2 sem cores claras aposentadas.
- [ ] Assets finais não são emoji ou placeholder genérico.
- [ ] Existe uma única ação primária clara.
- [ ] Estados usam enum oficial, label e semântica correta.
- [ ] Preço, ociosidade, limite e caráter estimado aparecem antes da autorização quando aplicável.
- [ ] A tela funciona em 320px, safe area e teclado aberto.
- [ ] Loading, vazio, offline, erro e permissão negada estão especificados.
- [ ] A spec registra quando header, bottom nav e CTA fixo aparecem.
