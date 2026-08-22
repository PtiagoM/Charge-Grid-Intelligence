# Revisão crítica e direção do Dashboard Admin

**Data:** 22 de agosto de 2026  
**Status:** decisão vigente para a reconstrução  
**Base:** análise observacional do SEMS+, `CURRENT_STATE.md`, proposta de arquitetura, plano M0–M9 e inspeção do Admin importado

## Veredito

O dashboard importado é uma boa referência visual e uma prova de conceito React/TypeScript, mas não é uma base de produto pronta para expansão. Ele reproduz a superfície do SEMS+ sem reproduzir sua lógica de contexto, hierarquia, progressão e operação. O resultado parece artificial porque oferece muitos destinos laterais, poucas jornadas completas, números demonstrativos apresentados como certezas e controles que não correspondem a capacidades reais.

A reconstrução não será um clone página a página. O shell, a densidade e os padrões visuais do SEMS+ são referência; a arquitetura de informação e os fluxos devem nascer do trabalho real do ChargeGrid.

## Modelo operacional canônico

```text
GoodWe / organização
└── cliente comercial
    └── estabelecimento
        └── planta GoodWe / ponto de recarga
            ├── carregadores
            │   ├── telemetria e capacidade técnica
            │   ├── disponibilidade comercial
            │   └── comandos auditáveis
            ├── sessões
            ├── fila
            ├── energia e demanda
            └── incidentes
```

`Planta` é a entidade técnica existente na GoodWe. `Ponto de recarga` é sua projeção comercial no ChargeGrid. O onboarding não deve recadastrar a planta nem inventar uma localização paralela: deve vincular uma planta autorizada, detectar seus equipamentos e complementar apenas dados comerciais.

## Problemas encontrados

### 1. Navegação lateral excessiva

O perfil GoodWe recebe dezesseis itens laterais e o estabelecimento doze. A sidebar funciona como inventário de funcionalidades, não como orientação de trabalho. Conceitos relacionados ficam separados artificialmente: operação, sessões, energia, tarifa, financeiro, relatórios e auditoria competem no mesmo nível.

**Decisão:** a próxima interface terá no máximo seis domínios primários:

1. Visão geral;
2. Rede — clientes, estabelecimentos, plantas e carregadores;
3. Operação — sessões, fila, comandos e incidentes;
4. Energia;
5. Comercial — tarifas, pagamentos, contratos e financeiro;
6. Inteligência — recomendações e relatórios.

Configurações, acesso e auditoria pertencem ao menu da conta ou a uma área administrativa secundária.

### 2. Falta de navegação contextual e vertical

As telas mostram blocos independentes, mas raramente conduzem o usuário do resumo para diagnóstico e ação. Tabs internas são âncoras inconsistentes; algumas apontam para seções inexistentes. O detalhe selecionado costuma surgir abaixo de uma tabela, fora da área visível.

**Decisão:** cada domínio deve possuir rotas mestre/detalhe e tabs contextuais no conteúdo. A sidebar escolhe o domínio; breadcrumbs, tabs, filtros e CTAs conduzem a jornada dentro dele.

Exemplo:

```text
Rede → cliente → estabelecimento → planta → carregador
                                      ├── resumo
                                      ├── sessões
                                      ├── energia
                                      ├── incidentes
                                      └── comandos
```

### 3. Controles de carregador ausentes ou enganosos

O estabelecimento não consegue solicitar start/stop, limitar disponibilidade ou diagnosticar o equipamento. Adicionar botões locais agora seria incorreto: os contratos GoodWe e a matriz de capacidades ainda não estão homologados.

**Decisão:** controles são obrigatórios no detalhe do carregador quando a capacidade permitir, com:

- ação autorizada por papel e planta;
- motivo obrigatório;
- chave de idempotência e correlação;
- estado `solicitado`, `confirmado`, `falhou` ou `expirou`;
- confirmação por telemetria/evento, nunca apenas pelo HTTP;
- autor, horário e resultado no histórico de comandos;
- mensagem clara quando o perfil só pode monitorar.

### 4. Sessões sem semântica operacional

Não fica claro se a área mostra sessão de recarga, conexão física, cobrança, incidente ou apenas histórico. Estados terminados aparecem como “resolvidos”, linguagem herdada de alarmes. O detalhe não possui timeline nem relação explícita com comando, pagamento e energia.

**Decisão:** sessão comercial terá lista “Ao vivo” e “Histórico” e detalhe próprio com timeline:

```text
pagamento autorizado → início solicitado → energia confirmada
→ recarga em andamento → encerramento → captura/conciliação
```

Falhas e dados antigos devem aparecer como estados, não desaparecer. A sessão sempre liga planta, carregador, motorista/visitante, tarifa aceita, energia, pagamento e eventos técnicos.

### 5. Informação sem hierarquia

Há muitos KPIs equivalentes, cards genéricos e textos explicativos. Métricas essenciais, alertas e ações competem visualmente. Vários percentuais, health scores, demanda, comissão e previsões são constantes de fixture sem origem visível.

**Decisão:** cada tela responde, nesta ordem:

1. Qual é o escopo e a situação atual?
2. O que exige atenção?
3. Qual evidência explica isso?
4. Qual ação autorizada pode ser tomada?
5. Onde consultar histórico e detalhes?

Hipóteses comerciais e previsões não homologadas permanecem em fixtures/documentação e não podem parecer políticas GoodWe.

### 6. Onboarding e cadastros artificiais

Cliente, estabelecimento, ponto e carregador são cadastrados por formulários independentes, sem wizard, validação assíncrona, descoberta GoodWe ou resumo de publicação. O fluxo permite criar estruturas impossíveis.

**Decisão:** o onboarding seguirá etapas:

1. selecionar cliente/estabelecimento;
2. localizar planta GoodWe autorizada;
3. validar vínculo e detectar carregadores;
4. preencher somente o perfil comercial;
5. revisar horários, acesso, tarifa e responsáveis;
6. publicar ou salvar rascunho.

Carregadores GoodWe são descobertos e vinculados. Cadastro manual genérico só poderá existir para uma categoria externa explicitamente suportada.

### 7. Detalhe do carregador sem identidade própria

A página tentou copiar agrupamentos do SEMS+ sem estabelecer uma hierarquia ChargeGrid. O detalhe atual é um conjunto de quatro cards após uma tabela e não suporta diagnóstico, sessão ao vivo, comandos, incidentes ou histórico.

**Decisão:** o detalhe será uma vertical slice própria. Ele preservará o contexto visual do SEMS+, mas organizará conteúdo por necessidade operacional:

- identidade, planta, conector e frescor da telemetria;
- estado técnico versus disponibilidade comercial;
- sessão atual e fila relacionada;
- potência, energia e restrição de demanda;
- incidentes e diagnóstico;
- comandos disponíveis e trilha de auditoria;
- histórico de sessões e manutenção.

### 8. IA e recomendações parecem cenográficas

O assistente apresenta textos fixos e previsões sem fonte, confiança ou fallback. Isso aumenta a sensação de protótipo artificial.

**Decisão:** recomendações começam determinísticas, com regra, evidência, impacto e próxima ação. IA externa só entra após baseline, observabilidade e governança; nunca autoexecuta comandos.

## Avaliação contra o plano M0–M9

| Marco | Situação observada | Decisão |
| --- | --- | --- |
| M0 — fundação | contratos compartilhados existem, mas a UI não os consumia e havia duas árvores Admin | consolidar árvore, fixtures, serviço de estado e domínio compartilhado |
| M1 — shell/RBAC | shell visual forte; escopo implícito e sidebar excessiva | concluir escopo em URL, guardas e reorganização por domínios |
| M2 — planta/onboarding | formulários independentes e recadastro técnico | reconstruir como vínculo de planta GoodWe |
| M3 — carregadores/sessões | listas superficiais, sem comandos/timeline | primeira vertical slice funcional |
| M4 — fila | tabela demonstrativa | integrar ao contexto de planta/sessão |
| M5 — energia | KPIs visualmente coerentes, mas parcialmente fixos | usar snapshot tipado, frescor, limiares e impacto operacional |
| M6 — financeiro | percentuais e rateio tratados como definitivos | parametrizar e separar hipótese de dado confirmado |
| M7 — incidentes/recomendações | cartões estáticos | inbox, workflow e recomendação explicável |
| M8 — acesso/relatórios | telas cenográficas | implementar por capacidade e tarefas reais |
| M9 — validação | boa cobertura de demo em viewport amplo | matriz por papel, estado e 1280/1440/desktop amplo |

O estado atual deve ser tratado como **M0/M1 parcial com protótipos visuais de M2–M8**, não como conclusão desses marcos.

## Fundação corrigida nesta etapa

- Admin e Driver PWA separados também no roteamento, estado, testes e CSS;
- uma única árvore Admin executável;
- organização em `app`, `domain`, `fixtures`, `features`, `components`, `layouts` e `services`;
- estado local atrás de um repository substituível;
- escopo GoodWe explícito e persistido na URL;
- rolagem reiniciada na mudança de rota/escopo;
- métricas de cliente derivadas da fonte de dados;
- sessão de fixture vinculada a carregador existente;
- energia agregada por escopo e fila calculada pelo domínio compartilhado;
- mapa migrado do `google.maps.Marker` depreciado para overlays nativos sem dependência de Map ID público;
- documentação atualizada para refletir implementação iniciada.

## Ordem da reconstrução funcional

1. **M1 completo:** reduzir navegação, definir capability map e estabilizar shell/escopo.
2. **M2:** portfólio e onboarding de planta vinculada.
3. **M3:** carregadores, detalhe, comandos e sessões/timeline.
4. **M4/M5:** fila e energia dentro do contexto da planta.
5. **M6:** tarifa, pagamento, conciliação e financeiro parametrizados.
6. **M7/M8:** incidentes, recomendações, acesso, auditoria e relatórios.
7. **M9:** validação visual e funcional completa.

Cada etapa nasce em `feature/admin-*`, retorna por PR para `develop/admin-web` e só segue para `main` após validação e aprovação humana.

## Critério para começar o redesenho

O próximo trabalho visual deve partir deste documento e responder a uma vertical slice, não a uma aba isolada. Nenhuma tela é aceita apenas por parecer com o SEMS+: ela precisa demonstrar contexto, estado, evidência, ação, retorno e permissão.
