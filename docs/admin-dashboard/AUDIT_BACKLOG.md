# Backlog de auditoria — Admin SEMS+ com ChargeGrid

**Status:** `ATIVO — decisões consolidadas e auditoria visual contínua`  
**Rodada inicial:** 25 de agosto de 2026  
**Escopo:** auditoria manual iniciada pelo perfil Central GoodWe. Este documento registra defeitos, decisões aprovadas, hipóteses secundárias e itens deferidos; `PRODUCT_DECISIONS.md` permanece como contrato canônico de produto.

## Como usar este backlog

- `CONFIRMADO PARA CORREÇÃO`: comportamento, fluxo ou hierarquia já conflita com decisão vigente.
- `PRECISA DE REFERÊNCIA`: a direção é válida, mas depende de evidência SEMS+ ou de uma escolha visual antes de implementar.
- `DECISÃO DE PRODUTO`: altera identidade, escopo ou responsabilidade; não deve ser codificada até consolidação explícita.
- `DEFERIDO`: não é perdido, mas fica fora da próxima rodada funcional.

## Síntese da auditoria

O Admin já possui as jornadas e os dados locais necessários para demonstrar o ChargeGrid, mas parte da interface ainda apresenta informação de estabelecimento como se fosse informação da rede GoodWe. A próxima rodada deve corrigir primeiro contexto, responsabilidade e navegação; refinamento visual amplo, baseline e design system completo continuam deliberadamente posteriores.

## Achados confirmados para correção

| ID | Área | Achado e direção | Prioridade |
| --- | --- | --- | --- |
| AUD-01 | Painel Central GoodWe | O painel não pode expor operação específica de carregadores, sessões ou alarmes de um estabelecimento como conteúdo principal. Deve priorizar agregados de rede/carteira: ativações, cobertura, qualidade comercial, risco, utilização agregada e expansão. | alta |
| AUD-02 | Contexto global | O seletor de escopo no topo não deve ser o mecanismo principal de contexto. Cada lista ou jornada deve oferecer filtros próprios; detalhes devem receber contexto por origem, breadcrumb e recurso selecionado. | alta |
| AUD-03 | Lista de usinas | Há navegação interna sem estado consistente, quebra de grid ao trocar contexto e filtros redundantes/sem efeito. Deve haver uma única barra de filtros funcional, com status e pesquisa aplicados à lista. | alta |
| AUD-04 | Dispositivos e alarmes | Pesquisa e filtros precisam operar de fato. A composição do inventário de dispositivos é a referência mais próxima do SEMS+ nesta rodada e deve ser preservada enquanto recebe refinamentos pontuais. | média |
| AUD-05 | Recomendações | A área atual não comunica origem, evidência, impacto, ação autorizada ou motivo de existir. Ela precisa ser redesenhada como uma inbox explicável, e não como cards genéricos. | alta |
| AUD-06 | Gestão e organização | A estrutura deve se aproximar mais da hierarquia SEMS+ observada: informações da organização, usuários/funções e logs; contratos/ativações ChargeGrid entram como seção contextual adicional. | média |
| AUD-07 | Detalhe de planta | A página está distante da composição SEMS+ e deve ser uma vertical priorizada. O detalhe de carregador permanece a exceção bem encaminhada e receberá somente ajustes pontuais. | alta |

## Itens que precisam de referência ou desenho antes de implementação

| ID | Área | Direção | Próxima evidência ou decisão necessária |
| --- | --- | --- | --- |
| AUD-08 | Login | A composição ainda não iguala o SEMS+. É ajuste visual de baixa prioridade. | referência adicional de estados de login, se houver |
| AUD-09 | Monitoramento Central | O gráfico deve ser um monitoramento agregado útil, com estado atualizável e tooltip numérico por posição, em linguagem próxima ao SEMS+. Não deve fingir telemetria em tempo real sem fonte. | definir série agregada, cadência mockada e referência visual do gráfico SEMS+ |
| AUD-10 | Relatórios | Mapear profundamente relatórios de planta, dispositivo, tarefas/download e assinaturas do SEMS+ antes de reorganizar a Central de relatórios e criar análises ChargeGrid. | novas capturas/fluxos SEMS+ de relatórios |
| AUD-11 | Ferramentas de análise | Diagnóstico IV, comparação e bateria precisam preservar navegação e estrutura SEMS+; Energia/Demanda, Inteligência e Oportunidades ChargeGrid precisam de desenho próprio e menos genérico. | referências das ferramentas e decisão de linguagem para as novas superfícies |
| AUD-12 | Centro de serviço | Abrir chamado para a GoodWe pode fazer sentido no SEMS+ técnico, mas não está justificado como jornada da Central comercial. | decidir se permanece técnico, é ocultado na Central ou vira encaminhamento interno |
| AUD-13 | Assinaturas | Assinatura de notificações e relatórios por e-mail está fora de posição e não é prioridade. A reprodução das regras SEMS+ e qualquer adaptação ChargeGrid ficam para o fim. | decisão posterior de escopo |
| AUD-14 | Design system e baseline | Há inconsistências visuais e componentes grosseiros. Consolidar design system e baseline visual é fase de finalização, depois que as telas forem aprovadas pelo produto. | aprovação explícita de telas; manter sem snapshots até então |

## Revisão necessária do modelo de identidade e acesso

O achado mais relevante da rodada é a separação entre **conta profissional SEMS+** e **acesso comercial ChargeGrid**. A formulação abaixo é coerente com as decisões já vigentes e resolve a ambiguidade de tratar toda conta GoodWe como superadministradora:

```text
tipo de conta SEMS+
→ função organizacional SEMS+, quando existir
→ vínculo ChargeGrid opcional
→ responsabilidade ChargeGrid
→ escopo explícito
→ capacidade de leitura ou ação
```

| Persona proposta | Base SEMS+ | Vínculo ChargeGrid | Escopo e limite esperado |
| --- | --- | --- | --- |
| Cliente comum | Proprietário | nenhum | usa SEMS+ e suas plantas técnicas; não recebe conteúdo comercial |
| Cliente comercial | Proprietário | é administrador da própria operação; pode delegar operador ou analista | usa a camada comercial apenas das plantas contratadas; não recebe privilégios de instalador |
| Instalador/técnico | Distribuidor/Instalador com função organizacional | nenhum por padrão | usa plantas, dispositivos, alarmes e diagnóstico técnico autorizados; não recebe contratos, faturamento, sessões ou fila comercial |
| Consultor GoodWe | Distribuidor/Instalador com função organizacional | gestor de carteira | acompanha contratos, ativações, qualidade comercial e expansão de carteira; qualquer acesso à operação local precisa ser uma capacidade explícita, não consequência do perfil técnico |
| Central GoodWe | membro profissional GoodWe | governança de rede | possui escopo de rede amplo e indicadores agregados; não é simplesmente um consultor com todos os comandos locais ou todos os detalhes operacionais |

**Decisão consolidada:** a Central é um consultor GoodWe com escopo completo de rede e função organizacional SEMS+ de administrador. Ela não é uma conta-mestre e não ganha capacidades implícitas. A gestão organizacional decorre da função SEMS+; a diferença de dados decorre do escopo; qualquer ação exclusiva futura precisa ser registrada como capacidade adicional de governança GoodWe.

Até essa confirmação, a direção segura é:

- o proprietário da planta contratada é o administrador comercial por definição; não existe uma persona administrativa separada para ele;
- instalador sem vínculo ChargeGrid não vê dados ChargeGrid;
- consultor recebe carteira comercial explícita, sem controle operacional local por padrão;
- Central recebe a mesma base comercial do consultor, com visão agregada e governança de rede; não recebe sessões, fila, comandos ou financeiro detalhado por padrão;
- permissões técnicas SEMS+ permanecem independentes do acesso comercial.

## Próxima rodada recomendada

1. Corrigir o contrato de contexto e os filtros/navegação de Usinas, Dispositivos e Alarmes.
2. Reprojetar o Painel da Central GoodWe como painel agregado de governança.
3. Consolidar a decisão de identidade acima e então ajustar menus, rotas, fixtures e capabilities em conjunto.
4. Priorizar Detalhe de planta e Recomendações como próximas verticais visuais.
5. Coletar referências SEMS+ de relatórios, análises e gráfico monitorado antes de redesenhá-los.

## Limites desta rodada

- não foram criados snapshots, baseline visual ou nova matriz de regressão;
- não foram alteradas telas, domínio, API, permissões produtivas ou Driver PWA;
- os itens marcados como `PRECISA DE REFERÊNCIA` e `DECISÃO DE PRODUTO` não devem virar implementação automaticamente.

## Segunda rodada — Consultor GoodWe e proprietário comercial

**Data:** 25 de agosto de 2026  
**Status:** `APROVADO PELO PRODUTO — base da próxima execução`

### Constatações confirmadas no frontend atual

- existe `usuario@teste.com` como proprietário SEMS+ comum, sem vínculo ChargeGrid;
- não existe uma persona limpa de instalador SEMS+ comum: `suporte@teste.com` ainda possui papel ChargeGrid `GOODWE_TECH_SUPPORT` e não prova a experiência profissional sem camada comercial;
- Ativações ChargeGrid e Contratos por planta estão agrupados em Lista de usinas;
- Operação ChargeGrid, Sessões e Fila estão agrupadas em Lista de dispositivos;
- Resumo financeiro e Políticas tarifárias estão agrupados em Central de relatórios;
- Energia e demanda, Inteligência ChargeGrid e Oportunidades estão agrupados em Ferramentas de análise;
- o Painel usa a presença de qualquer papel ChargeGrid para exibir receita, sessões, disponibilidade, fila e operação de carregadores, sem distinguir proprietário, consultor ou Central;
- o gráfico atual é SVG estático e não oferece série temporal derivada dos dados, atualização de período ou tooltip numérico.

Essas constatações confirmam a auditoria: a camada existe, mas sua arquitetura de informação ainda não representa corretamente responsabilidade, contexto e finalidade.

### Aspectos bem encaminhados e que devem ser preservados

- Gestão da organização já possui uma base útil para Informações da organização e Contratos e ativações;
- o fluxo do proprietário para validar código de contrato e iniciar ativação está conceitualmente correto;
- sessões e detalhe individual do carregador são bases funcionais aproveitáveis;
- inventário de dispositivos e inbox de alarmes estão próximos da composição SEMS+ e precisam principalmente de filtros, busca, ícones e refinamento;
- proprietário da planta contratada é o administrador da operação comercial; não existe persona separada de administrador local.

### Proposta de contrato de navegação

As sete superfícies SEMS+ continuam inalteradas para proprietário comum e instalador sem ChargeGrid. Quando o proprietário possuir ao menos uma planta comercial ativa, uma entrada explícita `ChargeGrid` é adicionada logo abaixo de Lista de dispositivos.

| Superfície | Conteúdo proposto |
| --- | --- |
| Painel | leitura SEMS+ do escopo atual; proprietário comercial pode alternar ou combinar energia e resultado comercial; consultor/Central recebe agregados adequados ao seu escopo |
| Lista de usinas | lista, filtros, pesquisa e detalhe técnico/comercial da planta; sem contratos ou onboarding como subnavegação permanente |
| Lista de dispositivos | inventário técnico SEMS+ e detalhe do carregador; sem sessões e fila como abas internas do inventário |
| ChargeGrid | operação comercial local do proprietário: sessões, fila e resumo financeiro |
| Central de alarmes | alarmes/ocorrências e recomendações explicáveis |
| Central de relatórios | geração, exportação, tarefas e histórico de relatórios; não serve como menu financeiro |
| Ferramentas de análise | ferramentas SEMS+ preservadas; análises ChargeGrid só entram quando tiverem objetivo, evidência e desenho próprios |
| Centro de serviço | conteúdo SEMS+ preservado; funções comerciais somente quando seu propósito estiver definido |
| Gestão da organização | organização, usuários/funções, contratos/ativações, política tarifária, auditoria e futuras assinaturas/configurações |

Essa proposta substitui a regra anterior de encaixar toda função ChargeGrid apenas como subitem das sete superfícies. A nova entrada não cria um dashboard paralelo: ela é exibida para quem administra ou opera plantas comerciais próprias e reúne a operação que não pertence semanticamente a Dispositivos, Relatórios ou Análises.

### Conteúdo da entrada ChargeGrid por responsabilidade

| Responsabilidade | Conteúdo inicial |
| --- | --- |
| Proprietário comercial | visão da operação, sessões, fila, resumo financeiro e acesso contextual aos carregadores publicados |
| Consultor GoodWe | entrada ausente na primeira implementação; acompanhamento comercial aparece contextualmente em Painel, Usinas, Alarmes, Análises e Gestão da organização |
| Central GoodWe | mesma regra do consultor, com escopo completo e gestão/auditoria decorrentes da função organizacional de administrador |
| Instalador sem ChargeGrid | entrada ausente |
| Proprietário comum | entrada ausente |

Uma entrada ChargeGrid específica para consultor/Central fica registrada como **possibilidade secundária**, não como requisito da próxima rodada. Ela só deve ser criada se, durante a construção, `Visão geral` e `Oportunidades` demonstrarem função real e não couberem com clareza no Painel ou nas Ferramentas de análise. Nesse caso, a proposta precisa ser novamente avaliada e não pode introduzir fila comercial, responsáveis, tarefas ou fluxo de CRM.

### Configuração fora das superfícies de monitoramento

- contratos e ativações ficam em Gestão da organização para proprietário, consultor e Central conforme escopo;
- políticas tarifárias deixam Central de relatórios e ficam em Gestão da organização do proprietário comercial;
- responsabilidades de colaboradores e carteiras ficam na Gestão da organização GoodWe, com busca, filtros, seleção em lote e confirmação adequada a grande volume;
- assinatura organizacional de notificações/relatórios permanece deferida para a fase final;
- Documentos comerciais só permanece se for definido como repositório de leitura ligado ao contrato — contrato assinado, aditivos, termos e políticas aplicáveis; caso contrário, deve ser ocultado.

### IA e recomendações

`Inteligência ChargeGrid` não deve permanecer como página genérica apenas para demonstrar IA. A proposta é usar inteligência dentro de decisões reais:

- recomendações com evidência, causa, impacto, confiança e próxima ação;
- previsão de demanda dentro de Energia e demanda, somente para papéis que realmente utilizam essa decisão;
- oportunidades dentro da carteira do consultor/Central;
- indicadores explicados no painel, sem afirmar automação ou previsão quando os dados não sustentarem isso.

Uma visão transversal de insights ou uma entrada ChargeGrid própria para consultor/Central pode existir futuramente, mas somente depois que essas aplicações estiverem funcionais, visualmente compreensíveis e sem transformar o SEMS+ em CRM ou gestor de tarefas.

### Centro de serviço

- proprietário comum e instalador preservam o Centro de serviço SEMS+;
- proprietário comercial pode receber atendimento relacionado à sua operação quando o fluxo estiver definido;
- consultor e Central não devem exibir `Abrir chamado para a GoodWe` como ação externa, pois já pertencem à organização GoodWe; eventual escalonamento interno exige outro fluxo e fica fora da próxima rodada.

### Ordem proposta para a próxima implementação

0. consolidar navegação compartilhada, contexto por página, filtros e persona limpa de instalador;
1. concluir o proprietário comercial em todas as telas principais e estados;
2. concluir o consultor GoodWe, em conjunto com contratos/ativações;
3. derivar a Central GoodWe do consultor, adicionando escopo completo e governança explícita;
4. concluir o instalador SEMS+ sem ChargeGrid;
5. validar o proprietário comum como regressão da experiência SEMS+ sem camada comercial;
6. somente depois implementar operador, analista, Navegador, Técnico e outras delegações restritas.

A completude é validada por persona, mas a implementação deve reutilizar o mesmo shell e as mesmas superfícies SEMS+; não serão mantidas cópias independentes das páginas para cada usuário.

### Ordem visual proposta

1. contrato de navegação e contexto por página;
2. Painel do proprietário comercial e Painel agregado de consultor/Central;
3. Lista e detalhe de usinas;
4. Gestão da organização, contratos e atribuição de carteiras em escala;
5. Recomendações explicáveis;
6. entrada ChargeGrid com operação, sessões, fila e financeiro;
7. relatórios e ferramentas de análise após novas referências SEMS+;
8. refinamentos de dispositivos, alarmes e detalhe do carregador;
9. login, assinaturas, documentos comerciais e Centro de serviço;
10. consolidação final do design system e baseline visual somente após aprovação das telas.

### Decisões aprovadas para a próxima execução

1. a entrada dinâmica `ChargeGrid` é a oitava superfície apenas para proprietário e operação local de plantas comerciais; para consultor/Central permanece hipótese secundária;
2. a página genérica `Inteligência ChargeGrid` deixa de ser destino obrigatório; inteligência é distribuída em recomendações, demanda e oportunidades com função real;
3. Central de relatórios é geração/exportação; resumo financeiro migra para ChargeGrid e tarifa para Gestão da organização;
4. Documentos comerciais só será mantido como repositório contratual de leitura; sem definição suficiente, permanece oculto/deferido;
5. consultor e Central não abrem chamados externos para a própria GoodWe;
6. não existe fila de trabalho comercial, responsável por pendência ou gestão de tarefas/CRM dentro do SEMS+;
7. a entrada ChargeGrid secundária para GoodWe só será reconsiderada se Visão geral e Oportunidades provarem utilidade e não couberem nas superfícies existentes.
