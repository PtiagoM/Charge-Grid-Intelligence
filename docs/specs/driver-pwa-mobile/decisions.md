# Decisões vigentes da Driver PWA

## DPR-001 — Tema claro como padrão

- **Data:** 2026-08-20
- **Decisão:** superfícies predominantemente brancas, vermelho GoodWe e tokens compartilhados com Admin/SEMS+.
- **Impacto:** escuro é opcional e persistido; nunca volta a ser o padrão sem nova decisão de produto.

## DPR-002 — Google Maps real e obrigatório

- **Data:** 2026-08-20
- **Decisão:** Maps JavaScript API com Data Layer; nenhum mapa fictício ou Map ID demonstrativo.
- **Impacto:** falha externa mantém a lista, mas não desenha geografia falsa.

## DPR-003 — Stripe como gateway real em modo teste

- **Data:** 2026-08-20
- **Decisão:** PaymentIntents e Payment Element substituem qualquer premissa anterior de gateway mock.
- **Impacto:** cartão reserva/captura e Pix paga/reembolsa; a API bloqueia `sk_live_`.

## DPR-004 — Operações financeiras no servidor

- **Data:** 2026-08-20
- **Decisão:** criar, consultar, capturar, reembolsar e verificar webhook em `apps/api`.
- **Impacto:** o PWA conhece somente chave publicável, client secret e estados normalizados.

## DPR-005 — Supabase Auth com fallback local de desenvolvimento

- **Data:** 2026-08-20
- **Decisão:** Supabase é a identidade remota quando configurado; fallback local serve apenas a desenvolvimento isolado.
- **Impacto:** produção não pode tratar `localStorage` como identidade, banco ou autorização.

## DPR-006 — QR por câmera, imagem e código

- **Data:** 2026-08-20
- **Decisão:** ZXing é carregado sob demanda e sempre há alternativa sem câmera.
- **Impacto:** permissão negada não bloqueia a jornada.

## DPR-007 — Notificações pelo service worker

- **Data:** 2026-08-20
- **Decisão:** notificações locais usam o registro do service worker e rotas associadas.
- **Impacto:** permissão é opcional; push remoto é uma feature separada.

## DPR-008 — Catálogo comercial inicial com seis plantas

- **Data:** 2026-08-20
- **Decisão:** catálogo versionado exercita mapa, busca, detalhe, fila e checkout.
- **Impacto:** futura API deve preservar o contrato, não necessariamente a origem local dos dados.

## DPR-009 — Não expor rótulos de fixture na experiência

- **Data:** 2026-08-20
- **Decisão:** textos como “dados simulados” não aparecem nas telas finais.
- **Impacto:** maturidade e origem continuam rigorosamente documentadas e testadas.

## DPR-010 — Mapa pronto somente após tiles reais

- **Data:** 2026-08-21
- **Decisão:** o canvas só recebe estado pronto após `tilesloaded`; falhas de provider têm estado separado e retry limpo.
- **Motivo:** a Demo Key desenhava o mapa por um instante antes de informar cota esgotada.
- **Impacto:** sem flicker, sem scripts duplicados e sem reconstrução por mera seleção de marcador.

## DPR-011 — Documento de estado prevalece sobre premissas históricas

- **Data:** 2026-08-21
- **Decisão:** `docs/CURRENT_STATE.md` é a entrada canônica para continuidade.
- **Impacto:** trechos antigos servem ao domínio, mas não podem reverter mapa real, Stripe sandbox, Supabase Auth, tema claro ou fluxos visitante/cadastrado.

## DPR-012 — Explorar recomenda; Sessão cataloga

- **Data:** 2026-08-21
- **Decisão:** `Explorar` apresenta até três recomendações determinísticas e explicáveis; a aba `Sessão`, quando não há recarga ativa, apresenta o catálogo completo, busca e filtros compactos.
- **Impacto:** a PWA separa decisão rápida de exploração abrangente. A recomendação não pode ser rotulada como IA enquanto usar apenas regras locais.

## DPR-013 — Mapa imersivo e neutro

- **Data:** 2026-08-21
- **Decisão:** `/map` ocupa a área visual completa e mantém somente busca superior, retorno e preview essencial dos pinos. Enter geocodifica e centraliza o endereço.
- **Impacto:** filtros, ranking, cards longos e interpretações comerciais permanecem fora do canvas do mapa.

## DPR-014 — Estados comerciais em linguagem humana

- **Data:** 2026-08-21
- **Decisão:** nenhuma superfície dirigida ao motorista exibe enums técnicos; tolerância de ociosidade tem representação temporal visual e transição explícita para urgência.
- **Impacto:** enums permanecem estáveis no domínio, mas labels, ícones e orientações são responsabilidade da camada de apresentação.

## DPR-015 — Janela recente de notificações

- **Data:** 2026-08-21
- **Decisão:** a central mostra por padrão notificações dos últimos sete dias e oferece acesso às anteriores sob demanda.
- **Impacto:** uma API futura deve preservar paginação, retenção e deep links sem carregar todo o histórico inicialmente.

## DPR-016 — Prévia do mapa e recomendações em Explorar

- **Data:** 2026-08-21
- **Decisão:** `Explorar` mantém uma prévia do mapa antes da seção `Melhores locais`; tocar na barra de busca expande a experiência para `/map`. Os cards destacam melhor opção, melhor tarifa e proximidade.
- **Impacto:** o mapa continua neutro e imersivo quando aberto, enquanto a recomendação permanece contextualizada fora do canvas.

## DPR-017 — Navegação persistente do contexto de sessão

- **Data:** 2026-08-21
- **Decisão:** para motoristas autenticados, detalhe da planta, QR, fila, checkout, sessão e comprovante pertencem à jornada de sessão e mantêm a aba `Sessão` ativa na navegação inferior.
- **Impacto:** o motorista mantém uma rota clara de retorno à sessão sem confundir os caminhos públicos de visitante.

## DPR-018 — Ilustrações como assets pendentes

- **Data:** 2026-08-21
- **Decisão:** a linguagem de ilustrações próprias fica documentada somente como roadmap até que os assets sejam fornecidos separadamente.
- **Impacto:** nenhum asset ilustrado adicional é gerado nem incorporado à PWA nesta etapa.

