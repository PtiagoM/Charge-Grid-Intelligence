# Jornadas administrativas propostas

**Classificação:** `INFERRED`, confiança alta para a sequência principal e média onde há dependência de RBAC, integração GoodWe ou gateway ainda não homologados. As jornadas combinam padrões `OBSERVED` do SEMS+ com regras vigentes do ChargeGrid.

A Driver PWA não é redesenhada aqui. Eventos de motorista aparecem apenas como entradas ou resultados que o administrativo precisa receber.

## J1 — GoodWe acompanha carteira/rede e aprofunda uma exceção

| Campo | Definição |
| --- | --- |
| usuário/papel | gestor de carteira/consultor GoodWe; Central GoodWe em visão agregada |
| objetivo | identificar ativação, qualidade comercial, indisponibilidade, utilização e oportunidade de expansão no escopo atribuído |
| entrada | home SEMS+ com camada ChargeGrid e escopo de carteira, região ou parceiro |
| páginas | dashboard por responsabilidade → ativações/plantas comerciais → detalhe autorizado → carregador/sessões quando necessário |
| ações | filtrar período/escopo, comparar KPIs, abrir planta, inspecionar status e incidente |
| resultados | causa e impacto ficam contextualizados; ação técnica é encaminhada ao responsável adequado |
| próxima etapa | relatório, recomendação de expansão ou acompanhamento do incidente |
| permissões | leitura conforme carteira/região/parceiro; nacional somente como capacidade estratégica; financeiro e comandos apenas quando explicitamente autorizados |
| erro/ausência | rede vazia, telemetria antiga, `GOODWE_UNAVAILABLE`, escopo sem acesso e dados financeiros indisponíveis |
| evidências/open questions | SEMS-DASH-001, SEMS-PLANT-004, SEMS-ENERGY-002; identidade/SSO e extensão do controle continuam abertas |

## J2 — Estabelecimento incorpora uma planta GoodWe ao ChargeGrid

| Campo | Definição |
| --- | --- |
| usuário/papel | `ESTABLISHMENT_ADMIN`; consultor GoodWe conduz contrato e acompanha ativação |
| objetivo | transformar uma planta técnica existente em planta comercial publicável |
| entrada | código emitido após contrato externo para uma planta |
| páginas | resgatar código → vincular planta própria → validar EV Chargers → perfil comercial → revisão/publicação |
| ações | confirmar contrato/estabelecimento projetados, selecionar planta quando necessário, revisar carregadores, definir horários, acesso, tarifa e política de ociosidade |
| resultados | estabelecimento e planta ficam vinculados; publicação só ocorre com pré-condições válidas |
| próxima etapa | testar sessão controlada e abrir operação |
| permissões | consultor autoriza emissão; backend gera código; admin do estabelecimento resgata/configura; operador não publica nem altera parâmetros sensíveis |
| erro/ausência | código inválido/expirado, contrato não vigente, estabelecimento divergente, planta já contratada, nenhum EV compatível, telemetria indisponível ou permissão insuficiente |
| evidências/open questions | wizard SEMS como referência: SEMS-PLANT-005..007; sistema contratual e checklist final permanecem abertos |

## J3 — Operador conduz sessões e fila do dia

| Campo | Definição |
| --- | --- |
| usuário/papel | `ESTABLISHMENT_OPERATOR` |
| objetivo | manter recargas fluindo, tratar espera e agir em exceções sem alterar política comercial |
| entrada | visão operacional da planta ou alerta do módulo |
| páginas | sessões ao vivo ↔ fila ↔ detalhe do carregador ↔ incidente |
| ações | filtrar estados, acompanhar chamadas, verificar compatibilidade, solicitar start/stop permitido e registrar motivo |
| resultados | fila avança, sessão muda somente após confirmação técnica e toda ação fica auditada |
| próxima etapa | encerrar incidente, acompanhar liquidação ou escalar suporte técnico |
| permissões | leitura/escrita operacional nas próprias plantas; sem tarifa, comissão, usuários ou política global |
| erro/ausência | fila vazia, no-show, carregador indisponível, `START_FAILED`, comando pendente, telemetria antiga ou `FORBIDDEN` |
| evidências/open questions | SEMS-EV-001/002 e padrões SEMS-ORG-001; limites exatos de comandos do operador precisam de decisão |

## J4 — Estabelecimento reage à pressão de demanda

| Campo | Definição |
| --- | --- |
| usuário/papel | `ESTABLISHMENT_ADMIN` ou operador com capacidade específica |
| objetivo | proteger a admissão comercial sem alegar controle elétrico inexistente |
| entrada | banner/alerta de `PlantEnergyStatus` ou página Energia e demanda |
| páginas | energia/demanda → sessões afetadas → comando auditável → incidente, se falhar |
| ações | entender solar/rede/carga, restringir novos inícios e, em crítico, solicitar parada pela prioridade vigente |
| resultados | decisão comercial registrada; UI aguarda confirmação do gateway/GoodWe antes de declarar interrupção |
| próxima etapa | reabrir admissão quando o estado normalizar e revisar recomendação |
| permissões | leitura energética por escopo; política para admin; execução apenas para capacidade autorizada |
| erro/ausência | `TELEMETRY_UNAVAILABLE`, dado sem frescor, comando rejeitado, estado desconhecido ou divergência de medição |
| evidências/open questions | SEMS-ENERGY-001/002 e SEMS-EV-002; limiares e frescor ainda precisam ser homologados |

## J5 — Administrador configura tarifa e reconcilia o financeiro

| Campo | Definição |
| --- | --- |
| usuário/papel | `ESTABLISHMENT_ADMIN`; GoodWe vê somente agregados autorizados no escopo |
| objetivo | publicar condições comerciais e entender receita, taxas, líquido e pendências |
| entrada | configurações ChargeGrid ou KPI financeiro da planta |
| páginas | tarifa e políticas → financeiro → sessão/pagamento → exportações |
| ações | versionar tarifa, revisar ociosidade, filtrar período/estado, investigar settlement e exportar |
| resultados | preço aceito permanece auditável; valores energéticos e comerciais aparecem separados |
| próxima etapa | conciliar pendência, ajustar política futura ou emitir relatório |
| permissões | somente admin altera tarifa; operador vê no máximo estado operacional; GoodWe vê comissão/agregado conforme contrato |
| erro/ausência | pagamento falhou, `SETTLEMENT_PENDING`, disputa, custo desconhecido, exportação em processamento ou sem dados |
| evidências/open questions | SEMS-REPORT-001..003 e SEMS-ENERGY-002; split, fiscalidade e definição de lucro permanecem abertas |

## J6 — Operação transforma alarme técnico em incidente comercial

| Campo | Definição |
| --- | --- |
| usuário/papel | operador; estabelecimento admin; gestor/Central GoodWe conforme escopo e capacidade |
| objetivo | coordenar impacto em carregador/sessão sem duplicar a verdade técnica |
| entrada | alarme GoodWe correlacionado ou falha de sessão/comando |
| páginas | incidentes → detalhe → planta/carregador/sessão → histórico |
| ações | confirmar impacto, atribuir responsável, registrar ação, notificar e resolver com referência ao alarme original |
| resultados | incidente possui trilha operacional; alarme continua identificado como origem GoodWe |
| próxima etapa | suporte GoodWe/integrador, reembolso/conciliação ou fechamento |
| permissões | operador trata localmente; admin configura política; GoodWe acompanha rede; motorista não é exposto a terceiros |
| erro/ausência | duplicata, origem técnica indisponível, sessão sem correlação, notificação falha ou permissão insuficiente |
| evidências/open questions | SEMS-ALARM-001/002, SEMS-EV-003, SEMS-SUBSCRIPTION-001; regra de promoção/deduplicação está aberta |

## J7 — Gestor avalia uma recomendação preditiva

| Campo | Definição |
| --- | --- |
| usuário/papel | gestor/Central GoodWe conforme escopo ou `ESTABLISHMENT_ADMIN` |
| objetivo | antecipar saturação, demanda ou expansão sem automatizar decisão sensível |
| entrada | card de recomendação no dashboard ou página Recomendações |
| páginas | recomendações → explicação/dados → planta/sessões → ação proposta |
| ações | revisar janela, confiança, sinais, fallback e impacto; aceitar, adiar ou rejeitar com justificativa |
| resultados | decisão humana auditada; aceitar não equivale a comando técnico automático |
| próxima etapa | criar tarefa/política futura ou monitorar o indicador |
| permissões | leitura conforme escopo; execução segue a permissão da ação subjacente |
| erro/ausência | dados insuficientes, modelo indisponível, recomendação expirada, baixa confiança ou conflito com regra determinística |
| evidências/open questions | SEMS-ANALYSIS-001 como antecedente; governança, métricas e coexistência com IA GoodWe continuam abertas |

## Cobertura e exclusões

- Integrador/instalador não recebe aplicação ChargeGrid própria na v1. Quando necessário, entra por onboarding assistido ou suporte técnico existente.
- Descoberta, QR, checkout, acompanhamento do motorista e comprovante pertencem à PWA congelada.
- Nenhuma jornada permite editar firmware, configuração elétrica, senha, billing de conta SEMS+ ou propriedade organizacional.
