# ChargeGrid Intelligence — Catálogo de Assets SEMS+ v1.0

**Status:** catálogo aprovado para o protótipo ChargeGrid/GoodWe

**Diretório atual:** `apps/admin-web/public/assets/sems/`

## 1. Regras gerais

- Os arquivos abaixo constituem a biblioteca visual aprovada do protótipo.
- Preservar nome com hash, proporção, transparência e resolução original.
- Não recolorir PNG por CSS, distorcer, recortar logo ou substituir por emoji.
- Assets decorativos usam `alt=""`; assets informativos recebem descrição contextual.
- O uso mobile deve selecionar o subconjunto necessário e manter o mesmo nome/arquivo.
- Não usar esses arquivos fora do contexto ChargeGrid/GoodWe sem nova autorização.

## 2. Logos e identidade

| Arquivo | Dimensão | Uso aprovado |
|---|---:|---|
| `logos/goodwe_logo.9e3214c8.png` | 280×42 | login, identificação expandida e materiais de apresentação |
| `logos/goodwe_logo_w.e0d65374.png` | 50×48 | sidebar, header compacto e assinatura mobile quando houver espaço limitado |
| `avatars/personal_installer.d222d640.png` | 180×180 | avatar demonstrativo do perfil administrativo |
| `icons/ai_icon_no_eye.9dad5490.png` | 181×218 | orb/assistente visual; não implica IA implementada |

## 3. Navegação e ações

| Arquivo | Dimensão | Papel |
|---|---:|---|
| `icons/icon_backstage_over.6f515874.png` | 48×48 | visão geral/backstage |
| `icons/icon_station_over.fd7f2df2.png` | 48×48 | plantas/estações |
| `icons/icon_device.ad71c9b2.png` | 48×48 | dispositivos/carregadores |
| `icons/icon_analysis.fd7d7adf.png` | 48×48 | análise e indicadores |
| `icons/icon_reports.3ff95c2c.png` | 48×48 | relatórios, sessões ou financeiro conforme label |
| `icons/icon_services.f837f7f1.png` | 48×48 | serviços/estabelecimentos conforme contexto |
| `icons/entrance_light.8edf1291.png` | 72×64 | entrada/energia e promoção contextual |
| `icons/icon_search.34450bf1.png` | 36×36 | pesquisa |
| `icons/icon_filters.0dbad799.png` | 26×28 | filtros |
| `icons/icon_language.1c16961c.png` | 40×42 | idioma |
| `icons/icon_message.113c036c.png` | 40×42 | mensagens |
| `icons/icon_setting.6ecae33c.png` | 36×32 | configurações/sair quando explicitamente rotulado |
| `icons/opt_morePoint.7968e14b.png` | 26×6 | menu de mais ações |
| `icons/opt_collect.f1b9ab43.png` | 32×32 | coleta/energia conforme contexto validado |
| `icons/darkModeSN.e2a51da4.png` | 34×32 | modo escuro quando existir controle real |

## 4. Estado

| Arquivo | Dimensão | Semântica |
|---|---:|---|
| `icons/icon_status_normal.b2f0e4c6.png` | 28×28 | normal/disponível |
| `icons/icon_status_standby_light.99ef94b2.png` | 48×50 | standby/espera |
| `icons/offline_1.96669346.png` | 48×50 | offline técnico |
| `icons/icon_status_fault.8b8bf71b.png` | 28×24 | falha |
| `icons/icon_status_constructing_light.77e115e4.png` | 44×44 | implantação/construção |
| `icons/icon_alarm.90066d1f.png` | 48×48 | alarmes na navegação |
| `icons/icon_alarm.e848ca8a.png` | 36×34 | alarme em ação/área compacta |

Ícone não substitui label. `offline`, `fault`, `closed` e `maintenance` continuam estados diferentes.

## 5. Conteúdo

| Arquivo | Dimensão | Uso |
|---|---:|---|
| `devices/charging_pile_off.b86d796d.png` | 256×828 | ilustração de carregador em fundo neutro/escuro |
| `plants/136287ad-ae2c-4034-bb53-015701b5fe9d.jpg` | 2037×1147 | miniatura/hero demonstrativo de planta ou estabelecimento |

A foto de planta é ilustrativa e não transforma local fictício em dado GoodWe. A PWA pode usá-la em card demo, sempre com contexto sintético.

## 6. Tamanhos de renderização

| Contexto | Faixa recomendada |
|---|---:|
| Sidebar desktop | 20–24px; logo compacto 34px |
| Topbar | 18–22px; avatar 28–32px |
| Ação de tabela | 16–20px |
| Badge/status | 13–16px |
| Bottom navigation mobile | 22–26px |
| Header mobile | 24–32px |
| Miniatura de entidade | 44–64px |

## 7. Distribuição entre apps

O diretório do Admin é a origem atualmente versionada. Antes de uma feature mobile usar um asset:

1. referenciar este catálogo na spec;
2. selecionar somente os arquivos necessários;
3. disponibilizá-los no pipeline estático da PWA sem renomear ou recomprimir;
4. evitar uma segunda cópia editada;
5. registrar o mapeamento em uma constante tipada do app.

Quando Admin e PWA consumirem o mesmo conjunto de forma recorrente, uma spec de infraestrutura poderá promover os arquivos para uma origem estática compartilhada. Não criar pacote de componentes apenas por causa dos PNGs.

## 8. Assets ainda necessários

Novos fluxos mobile podem exigir ícones não presentes no catálogo — voltar, localização, QR, pagamento, histórico, conta e suporte. Eles devem ser obtidos de fonte GoodWe/SEMS+ autorizada ou desenhados como extensão coerente. Não substituir silenciosamente por emoji na versão final.
