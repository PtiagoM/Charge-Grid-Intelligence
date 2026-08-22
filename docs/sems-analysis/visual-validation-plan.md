# Plano de validação visual futura

**Status:** procedimento repetível para o novo projeto. As referências SEMS+ existentes estão sanitizadas; credenciais não entram em scripts, traces, vídeos ou screenshots.

## Ciclo de validação

1. Abrir a referência SEMS+ autenticada.
2. Fixar página, papel, escopo, viewport, tema, idioma, período e estado.
3. Capturar referência sanitizada, removendo qualquer dado pessoal/técnico sensível.
4. Abrir a rota correspondente no projeto local com fixture determinística.
5. Capturar o resultado com a mesma viewport e escala.
6. Comparar layout, geometria, tipografia, espaçamento, cores, ícones, gráficos, conteúdo e comportamento.
7. Registrar divergência, evidência, severidade, owner e critério de correção.
8. Corrigir futuramente no projeto local.
9. Repetir até o critério de aceite e guardar apenas artefatos sanitizados.

## Severidade

| Nível | Definição | Exemplos | Critério de aceite |
| --- | --- | --- | --- |
| S0 funcional | fluxo/estado ou permissão incorretos | ação indevida, rota quebrada, dado de outro escopo | zero |
| S1 estrutural | hierarquia/layout principal divergente | sidebar, header, grid ou modal com geometria errada | zero |
| S2 visual | diferença perceptível de componente | tipografia, cor, espaçamento, borda, ícone | no máximo desvios aceitos e justificados |
| S3 polimento | diferença mínima sem impacto | antialiasing ou variação subpixel | tolerada dentro do orçamento |

## Tolerâncias objetivas

- viewport, device scale factor e zoom: correspondência exata;
- shell e contêineres principais: até 2 px por aresta;
- componentes internos: até 4 px quando o conteúdo variável justificar;
- espaçamento/token: até 2 px; tamanhos tipográficos: até 1 px;
- família, peso, line-height, raio e hierarquia: correspondência do token aprovado;
- cor sólida: `ΔE2000 ≤ 3`; estados semânticos não podem trocar significado;
- ícones: até 2 px de diferença de caixa/alinhamento e mesma semântica;
- screenshot diff: alvo ≤ 0,5% fora das máscaras; qualquer cluster estrutural é S1 mesmo abaixo do percentual;
- texto, status, permissão e próxima ação: correspondência funcional obrigatória, sem tolerância por pixel.

Mapas, timestamps, gráficos animados e canvas usam fixtures ou máscaras estáveis. Máscara não pode esconder estrutura, estado ou conteúdo essencial.

## Matriz mínima

| Área | Papel | Viewports | Temas | Estados obrigatórios |
| --- | --- | --- | --- | --- |
| autenticação/fallback | pré-auth | 1280×720; 1440×900 | claro/escuro se aplicável | vazio, validação, falha, sessão expirada |
| shell/home | três papéis admin | 1280×720; 1440×900; 1920×1080 | claro e escuro | vazio, populado, loading, erro, acesso parcial |
| portfólio/mapa | GoodWe e estabelecimento | 1280×720; 1440×900 | claro e escuro | sem plantas, uma, múltiplas, filtros, mapa indisponível |
| onboarding comercial | admins | 1280×720; 1440×900 | claro e escuro | inicial, validação, sem EV, erro, revisão, sucesso |
| detalhe da planta | três papéis | 1280×720; 1440×900 | claro e escuro | normal, alerta, crítico, sem telemetria |
| EV Chargers | três papéis | 1280×720; 1440×900 | claro e escuro | vazio, disponível, ocupado, manutenção, falha, offline |
| sessão | operador/admin | 1280×720; 1440×900 | claro e escuro | preparação, start pendente, carregando, fim, ociosidade, settlement e falhas |
| fila | operador/admin | 1280×720; 1440×900 | claro e escuro | vazia, esperando, chamado, expirado, incompatível |
| energia/demanda | três papéis | 1280×720; 1440×900 | claro e escuro | normal, alerta, crítico, dado antigo/ausente |
| tarifa/financeiro | admins | 1280×720; 1440×900 | claro e escuro | rascunho, vigente, validação, sem dados, pendência, disputa |
| incidentes | três papéis | 1280×720; 1440×900 | claro e escuro | vazio, aberto, atribuído, resolvido, duplicata |
| recomendações | admins | 1280×720; 1440×900 | claro e escuro | disponível, baixa confiança, fallback, indisponível, expirada |
| usuários/permissões | admins | 1280×720; 1440×900 | claro e escuro | lista, criação, edição, revogação, forbidden |
| relatórios/tarefas | admins | 1280×720; 1440×900 | claro e escuro | vazio, processando, sucesso, falha e download expirado |

Desktop abaixo de 1280 px deve continuar utilizável, mas não precisa reproduzir uma referência ainda não observada. Mobile administrativo é responsividade de segurança, não uma reconstrução da PWA.

## Baseline SEMS+ disponível

| Referência | Papel/tema/estado | Uso futuro |
| --- | --- | --- |
| SEMS-SHELL-001 | pré-auth, claro, vazio | autenticação e tipografia base |
| SEMS-SHELL-002 | Distribuidor/Instalador, escuro, populado | shell e dashboard de rede |
| SEMS-SHELL-003/004 | Proprietário, escuro/claro, populado | temas e dashboard por escopo |
| SEMS-PLANT-005/006 | Proprietário, escuro, wizard/sucesso | formulário em etapas e feedback |
| SEMS-PLANT-007 | Proprietário, escuro, planta vazia | detalhe e empty state |
| SEMS-DEVICE-004 | Proprietário, escuro, erro | validação de dispositivo |
| SEMS-ENERGY-001 | Distribuidor/Instalador, escuro, EV monitoring | composição energética contextual |

O baseline não cobre todas as páginas futuras. Elementos ChargeGrid novos usam os tokens/padrões consolidados e são validados por consistência, não por uma screenshot inexistente.

## Automação local com Playwright

- autenticar somente no projeto local com fixtures/contas de teste próprias;
- nomear snapshots por rota, papel, tema, viewport e estado;
- fixar relógio, locale, animações, random seed e respostas de rede;
- desabilitar transições durante captura;
- mascarar apenas regiões voláteis declaradas;
- anexar screenshot, diff, metadata e severidade ao resultado;
- manter testes de permissão separados de comparação visual;
- nunca automatizar o SEMS+ com credenciais persistidas; referência sandbox é capturada manualmente ou por sessão autorizada já existente, sem trace sensível.

## Gate de entrega

Uma página só encerra validação quando:

1. estados MUST da matriz possuem snapshot nos dois temas;
2. papéis sem acesso recebem o estado correto;
3. não há divergência S0/S1;
4. divergências S2 restantes estão justificadas e aprovadas;
5. acessibilidade básica, foco, teclado, contraste e zoom foram verificadas;
6. manifest e artefatos não contêm dados sensíveis.
