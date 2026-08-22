# Prompt mestre para a nova conta Codex

Copie o conteúdo a partir de “CREDENCIAIS DE EXECUÇÃO” para uma nova tarefa do Codex aberta no repositório. Substitua os placeholders somente na mensagem enviada à nova tarefa. **Não preencha credenciais neste arquivo nem faça commit de uma versão preenchida.** Prefira senhas temporárias e troque/revogue-as após a análise. Recomenda-se usar uma única tarefa para preservar a sessão autenticada e o histórico de evidências.

---

## CREDENCIAIS DE EXECUÇÃO — PREENCHER SOMENTE NA MENSAGEM DA NOVA TAREFA

```text
SEMS_BASE_URL=<URL_DO_SEMS_SANDBOX>

SEMS_OPERATOR_LOGIN=<LOGIN_OPERADOR>
SEMS_OPERATOR_PASSWORD=<SENHA_OPERADOR>

SEMS_USER_LOGIN=<LOGIN_USUARIO>
SEMS_USER_PASSWORD=<SENHA_USUARIO>
```

Estas credenciais são fornecidas exclusivamente para autenticação no SEMS+ sandbox durante esta tarefa. Trate o bloco como segredo de runtime:

- use os valores diretamente nos campos de login quando necessário;
- não repita, cite, resuma ou confirme os valores em commentary ou resposta final;
- não grave os valores em arquivo, `.env`, terminal, script, log, screenshot, plano ou documentação;
- não coloque credenciais em chamadas de shell, URLs, query strings ou nomes de arquivo;
- não inspecione cookies, tokens ou armazenamento da sessão após autenticar;
- ao capturar a tela de login, faça isso antes de preencher ou garanta que nenhum valor esteja visível;
- use a conta de operador para fluxos administrativos e a conta de usuário para validar experiência e restrições do papel correspondente;
- ao trocar de conta, faça logout pela interface e autentique novamente; não manipule tokens;
- se uma credencial falhar, tente novamente somente uma vez após conferir o campo; depois registre `AUTHENTICATION BLOCKED` sem revelar o valor;
- se houver MFA, CAPTCHA ou confirmação externa, solicite somente essa intervenção ao usuário.

## POLÍTICA DE AUTONOMIA — NÃO PEDIR CONFIRMAÇÃO ROTINEIRA

O usuário autoriza antecipadamente, dentro desta missão:

- leitura dos documentos e arquivos necessários do repositório;
- criação/edição da documentação em `docs/sems-analysis/`;
- uso das ferramentas de navegador, screenshot e inspeção de elementos visíveis;
- login e logout nas duas contas fornecidas;
- navegação por todas as áreas permitidas a cada conta;
- criação, edição, ativação, desativação, arquivamento e exclusão de dados de teste no sandbox;
- execução de formulários, filtros, modais, exports e fluxos funcionais do sandbox;
- comparação entre os papéis operador e usuário;
- verificações locais não destrutivas da documentação.

Não peça permissão para cada ferramenta, clique, screenshot, arquivo documental ou mutação normal do sandbox. Escolha a ferramenta adequada e continue autonomamente.

Interrompa e peça intervenção apenas se ocorrer:

1. MFA, CAPTCHA ou confirmação que somente o usuário pode concluir;
2. evidência de que a sessão não é sandbox ou de que existe ativo físico/integração externa real;
3. alteração de senha, e-mail principal, billing, assinatura, credenciais de API ou propriedade da organização;
4. exclusão em massa ou exclusão de dados que não foram criados pelo agente e não possam ser restaurados com segurança;
5. necessidade de contornar permissão/RBAC;
6. pedido implícito para modificar PWA, implementar o clone ou expandir materialmente o escopo;
7. bloqueio técnico que persista após alternativas seguras.

Observação: aprovações obrigatórias impostas pelo próprio Codex, navegador ou ambiente continuam válidas e não podem ser anuladas por este prompt. Quando aparecerem, formule a solicitação de forma objetiva e prossiga assim que forem concedidas.

## MISSÃO

Reconstruiremos, em uma etapa futura e dentro de um novo projeto, a experiência administrativa necessária para incorporar o **ChargeGrid como módulo/camada do SEMS+**.

Nesta tarefa você atuará como agente de análise autorizada, exploração funcional ativa em sandbox, documentação, reverse engineering da experiência observável, definição de escopo e planejamento. **Não implemente o Dashboard, não crie o clone e não modifique a Driver PWA.**

O SEMS+ é uma aplicação existente à qual o usuário possui uma conta de sandbox/teste autorizada. Não temos seu código-fonte. A conta não controla uma operação física real; portanto, você pode criar e alterar dados de teste, executar fluxos e provocar estados dentro do sandbox para compreender a aplicação.

## DECISÕES DE PRODUTO VIGENTES

1. O ChargeGrid será incorporado à experiência administrativa do SEMS+ como módulo/camada.
2. A decisão anterior de manter um Dashboard ChargeGrid independente foi superada.
3. A Driver PWA continua separada e está congelada nesta etapa: não alterar UI, UX, código, jornadas, funcionalidades ou regras específicas.
4. Regras ChargeGrid continuam válidas: plantas comerciais, carregadores, sessões, fila como contexto operacional, tarifa, receita/lucro, comissão demonstrativa, pagamento, ociosidade, controle de demanda, energia/sustentabilidade, incidentes, IA preditiva e recomendações.
5. GoodWe é a verdade técnica/energética; ChargeGrid mantém a verdade comercial; gateway + ChargeGrid mantêm a verdade financeira.
6. O Dashboard reconstruído deve oferecer temas claro e escuro. O PWA também oferece ambos, mas permanece fora do escopo.
7. Não é necessário clonar todo o SEMS+. Reconstrua futuramente apenas o shell e as páginas/fluxos necessários para uma experiência coerente do módulo.

## CONTEXTO OBRIGATÓRIO

Antes de navegar, leia integralmente e nesta ordem:

1. `docs/CURRENT_STATE.md` — fonte canônica e precedência;
2. `docs/sems-reconstruction/README.md` — metodologia e entregáveis desta missão;
3. `docs/product/ChargeGrid_Intelligence_Documento_Final_de_Produto_v1.0.md`;
4. `docs/contracts/ChargeGrid_Intelligence_Contratos_e_Enums_Compartilhados_v1.0.md`;
5. `docs/architecture/ChargeGrid_Intelligence_Stack_e_Arquitetura_MVP_v1.0.md`;
6. `docs/design-system/README.md`;
7. `docs/specs/driver-pwa-mobile/decisions.md`, somente para respeitar a fronteira da PWA.

Quando um documento antigo contradizer `CURRENT_STATE.md`, use `CURRENT_STATE.md`. Registre a contradição histórica se ela ajudar a evitar regressão.

## AUTORIZAÇÃO DESTA TAREFA

Você pode:

- ler arquivos do repositório;
- navegar no SEMS+ com a sessão autorizada;
- observar árvore de acessibilidade/DOM de elementos visíveis;
- capturar screenshots seletivos;
- criar, editar, arquivar e remover entidades de teste dentro do sandbox SEMS+;
- alterar estados e configurações de teste para observar fluxos, confirmações, erros e permissões;
- executar comandos funcionais do sandbox quando não houver integração externa ou ativo físico real associado;
- criar e editar documentação em `docs/sems-analysis/`;
- executar verificações não destrutivas dos documentos.

Você não pode nesta tarefa:

- editar aplicações, componentes, estilos, PWA, API ou banco;
- iniciar scaffold do clone;
- obter/copiar código proprietário;
- inspecionar bundles, source maps ou artefatos internos do SEMS+;
- extrair cookies, tokens, local/session storage ou credenciais;
- repetir ou persistir as credenciais fora do bloco de runtime originalmente fornecido pelo usuário;
- contornar RBAC ou tentar acessar área sem autorização;
- alterar senha, e-mail principal, propriedade da organização, billing, assinatura, credenciais de API ou configurações capazes de bloquear a conta, salvo autorização específica;
- acionar integração externa ou ativo físico real, caso algum deles apareça inesperadamente conectado;
- inventar entidade, permissão ou regra não observada.

### Protocolo para mutações no sandbox

1. confirme visualmente que a sessão é a conta de sandbox/teste;
2. antes de alterar uma entidade preexistente, capture seu estado inicial;
3. prefira criar entidades próprias com prefixo `CG_ANALYSIS_` e data quando o campo permitir;
4. registre `AÇÃO → ESTADO ANTERIOR → RESULTADO → ESTADO POSTERIOR`;
5. use dados fictícios e não insira informações pessoais reais;
6. explore criação, edição, validação, ativação, desativação, arquivamento e exclusão quando isso revelar estados relevantes;
7. remova ao final apenas os registros criados pelo próprio agente, se a remoção não eliminar evidências necessárias;
8. nunca use exclusão ampla, seleção em massa sem alvos conferidos ou ação fora do ambiente de sandbox;
9. se surgir indicação de ativo físico, integração externa, cobrança ou impacto fora do sandbox, interrompa essa ação e marque `NOT TESTED — EXTERNAL IMPACT RISK`.

## NAVEGADOR E LOGIN

Use preferencialmente a skill/ferramenta de navegador interativo disponível no Codex (`browser:control-in-app-browser`, se instalada). Leia as instruções da skill antes de usá-la.

Use primeiro as credenciais do bloco de runtime. O objetivo é que a análise continue sem exigir que o usuário permaneça disponível para logins rotineiros.

Para autenticar:

1. abra a tela de login no navegador;
2. identifique qual papel será analisado;
3. preencha login e senha diretamente nos campos usando o bloco de runtime;
4. conclua o login sem narrar ou exibir os valores;
5. confirme somente o papel/ambiente resultante, nunca a credencial;
6. preserve a sessão enquanto analisar aquele papel;
7. use logout normal antes de entrar com a outra conta.

Se o navegador não estiver disponível ou não preservar a sessão, esgote alternativas seguras disponíveis no ambiente antes de interromper. Não tente contornar autenticação, MFA ou RBAC.

## MÉTODO OBRIGATÓRIO

Use:

```text
reconhecimento amplo
→ evidência estruturada
→ aprofundamento orientado ao ChargeGrid
→ consolidação
→ escopo e jornadas
→ arquitetura e plano
```

Não comece pelo design system definitivo com poucas telas. Não implemente página por página nesta fase. Não trate screenshots como especificação suficiente.

Cada conclusão deve ser marcada como:

- `OBSERVED` — visto diretamente;
- `TESTED IN SANDBOX` — comportamento confirmado por criação/alteração controlada de dados de teste;
- `INFERRED` — dedução sustentada por evidências;
- `UNKNOWN` — não foi possível determinar;
- `OPEN QUESTION` — exige validação humana/produto;
- `NOT TESTED — EXTERNAL IMPACT RISK` — ação não executada por possível impacto fora do sandbox ou na segurança da conta.

Use confiança alta, média ou baixa. Não converta inferência em fato nas sínteses.

## ESTRUTURA DE DOCUMENTAÇÃO

Crie:

```text
docs/sems-analysis/
├── README.md
├── evidence-ledger.md
├── sitemap.md
├── navigation.md
├── pages.md
├── entities.md
├── permissions.md
├── components.md
├── states.md
├── flows.md
├── chargegrid-fit.md
├── scope-candidates.md
├── journeys.md
├── architecture-proposal.md
├── implementation-plan.md
├── visual-validation-plan.md
├── open-questions.md
└── screenshots/
    ├── manifest.md
    ├── shell/
    ├── plants/
    ├── plant-details/
    ├── devices/
    ├── users-permissions/
    ├── energy-alerts/
    └── reports-settings/
```

Não preencha lacunas com conteúdo genérico. Um documento pode começar com “a confirmar”.

Cada evidência deve conter ID, classificação, confiança, papel/contexto, viewport/tema, ação, resultado, referência visual e sensibilidade. Remova query strings sensíveis e substitua IDs reais por placeholders.

## FASE 0 — PREPARAÇÃO

1. Leia o contexto obrigatório.
2. Inspecione apenas a estrutura atual do repositório necessária para compreender o produto.
3. Confirme ferramentas de navegador e screenshot.
4. Crie a estrutura documental e convenções de evidência.
5. Registre explicitamente que nenhuma alteração da PWA ou implementação foi realizada.
6. Abra o SEMS+ e autentique com a conta adequada usando o bloco de runtime.

Entregue uma atualização curta e prossiga após o login. Só bloqueie se MFA/CAPTCHA, credencial inválida ou ferramenta realmente impedir observação após alternativas seguras.

## FASE 1 — RECONHECIMENTO AMPLO

Mapeie sem aprofundamento excessivo:

- sidebar, header, menus, submenus e breadcrumbs;
- tabs, páginas-raiz, rotas visíveis, modais e drawers;
- páginas acessíveis por seleção de planta/dispositivo;
- troca de organização, conta ou escopo, se visível;
- páginas ou ações bloqueadas por permissão;
- relação entre navegação global e contextual.

Para cada página inventariada, registre nome, rota segura, propósito aparente, entidade, entrada, ações principais, páginas relacionadas, evidência e confiança.

Capture somente shell e páginas-raiz relevantes. Não faça coleção indiscriminada.

Ao concluir, pare e entregue um **Checkpoint 1** com:

- sitemap resumido;
- quantidade de páginas/áreas observadas;
- áreas provavelmente relevantes ao ChargeGrid;
- limitações de permissão;
- arquivos criados;
- perguntas que precisam ser respondidas antes do aprofundamento.

Não implemente. Aguarde o usuário dizer para continuar.

## FASE 2 — APROFUNDAMENTO ORIENTADO AO CHARGEGRID

Após autorização para continuar, aprofunde nesta ordem:

1. shell, conta, escopo e papéis;
2. plantas e detalhe de planta;
3. dispositivos, EV Chargers e estado técnico;
4. energia, geração, consumo, bateria, rede e demanda;
5. alarmes, incidentes e ações funcionais que possam ser exercitadas no sandbox;
6. usuários, organizações, instaladores e permissões;
7. relatórios, exportações e configurações relevantes.

Para cada página/fluxo registre:

- localização e propósito;
- entidade principal e relações;
- informações exibidas;
- componentes reutilizáveis;
- filtros, ações e validações;
- sequência `AÇÃO → RESULTADO → PRÓXIMA AÇÃO`;
- loading, empty, populated, error, disabled, modal, confirmação, sucesso e falha quando observáveis;
- diferenças por papel, dados, viewport e tema;
- encaixe potencial ChargeGrid, ainda sem inventar a solução.

Use dados `CG_ANALYSIS_*` para provocar e documentar estados de criação, edição, validação, confirmação, sucesso, falha, desativação e exclusão quando o sandbox permitir. Não simule como observado aquilo que o sistema não produziu. Ações com possível impacto externo continuam proibidas.

Ao concluir, pare e entregue **Checkpoint 2** com:

- domínios aprofundados;
- principais entidades e relações;
- padrões de UI;
- fluxos observados;
- estados não observáveis;
- riscos e perguntas abertas;
- cobertura das evidências.

Não implemente. Aguarde continuação.

## FASE 3 — CONSOLIDAÇÃO

Após autorização:

1. remova duplicações e normalize nomes;
2. separe observado, inferido e desconhecido;
3. consolide entidades, relações e permissões;
4. consolide componentes e estados;
5. verifique que screenshots estão no manifest e não contêm informação sensível;
6. priorize perguntas abertas por impacto no escopo.

## FASE 4 — ENCAIXE SEMS+ × CHARGEGRID

Para cada capacidade abaixo, determine:

1. equivalente observado no SEMS+;
2. elemento a reutilizar conceitualmente;
3. adaptação necessária;
4. nova funcionalidade do módulo;
5. impacto em UI/UX;
6. impacto em entidades/permissões;
7. decisão de negócio pendente.

Capacidades:

- plantas comerciais;
- carregadores e disponibilidade técnica/comercial;
- sessões e recargas;
- fila como contexto operacional do Dashboard;
- tarifa;
- receita, lucro e comissão demonstrativa;
- pagamento/liquidação;
- ociosidade;
- controle de demanda;
- energia/sustentabilidade;
- incidentes;
- IA preditiva/recomendações;
- visão GoodWe, estabelecimento e operador.

Não altere nem redesenhe a PWA. Descreva apenas os contratos/estados que o Dashboard precisa receber ou exibir.

## FASE 5 — ESCOPO E JORNADAS

Classifique cada página/capacidade:

- `MUST IMPLEMENT`;
- `SHOULD IMPLEMENT`;
- `REFERENCE ONLY`;
- `OUT OF SCOPE`.

Para cada decisão, inclua justificativa, ator, dependências, evidência SEMS+ e regra ChargeGrid relacionada.

Defina somente jornadas sustentadas pela análise. Para cada uma inclua:

1. usuário/papel;
2. objetivo;
3. entrada;
4. páginas;
5. ações;
6. resultados;
7. próxima etapa;
8. permissões;
9. estados de erro/ausência;
10. evidências e open questions.

Considere GoodWe admin, estabelecimento admin, operador, instalador somente se houver necessidade comprovada, planta comercial, gestão de carregadores, sessões, demanda, financeiro e IA.

## FASE 6 — ESTRATÉGIA E ARQUITETURA

Compare explicitamente:

- página por página;
- design system primeiro;
- shell primeiro;
- implementação por entidades;
- implementação por fluxos;
- vertical slices;
- mock-first;
- combinação híbrida.

Escolha a estratégia com melhor equilíbrio de velocidade, fidelidade, manutenção, risco, validação e uso de contexto/tokens.

Proponha, sem implementar:

- frontend e estrutura do novo projeto;
- shell SEMS+ reconstruído e ponto de entrada do módulo;
- rotas;
- componentes e design tokens;
- temas claro/escuro;
- entidades e contratos;
- estado e dados mockados;
- services e APIs futuras;
- autenticação/RBAC;
- testes unitários, integração e E2E;
- estrutura de pastas;
- estratégia para integrar futuramente GoodWe/ChargeGrid.

Arquitetura técnica interna pode ser modular, mas a experiência administrativa deve parecer SEMS+ com ChargeGrid incorporado.

## FASE 7 — PLANO DE IMPLEMENTAÇÃO

Crie milestones pequenos e ordenados. Para cada um informe:

- objetivo;
- páginas/fluxos;
- componentes;
- dependências;
- mocks;
- funcionalidades;
- critérios de aceitação;
- validações visuais;
- testes;
- riscos;
- estimativa.

Estratégia inicial esperada, sujeita à evidência:

```text
fundação e contratos
→ shell/navegação/temas
→ planta comercial
→ carregadores e sessões
→ energia e controle de demanda
→ financeiro e lucro
→ IA/recomendações
→ permissões, estados e hardening
→ validação visual completa
```

Não crie código ao definir milestones.

## VALIDAÇÃO VISUAL FUTURA

Defina procedimento repetível:

1. abrir referência SEMS+;
2. escolher viewport, tema, papel e estado;
3. capturar referência;
4. abrir rota reconstruída;
5. capturar resultado;
6. comparar layout, geometria, tipografia, espaçamento, cores, componentes e comportamento;
7. registrar divergência por severidade;
8. corrigir futuramente;
9. repetir até o critério de aceite.

Inclua matriz de páginas/estados/viewports e tolerâncias objetivas. Planeje Playwright para o projeto local. No SEMS+ sandbox, a exploração pode ser ativa e automatizada apenas quando a ferramenta preservar a sessão autorizada sem registrar credenciais e os alvos forem dados de teste controlados.

## ENTREGA FINAL DESTA TAREFA

Ao terminar as fases, entregue e escreva no repositório:

1. executive summary;
2. metodologia usada e limitações;
3. sitemap e mapa de navegação;
4. catálogo de páginas e fluxos;
5. componentes e estados;
6. entidades, relações e permissões;
7. matriz SEMS+ × ChargeGrid;
8. escopo MUST/SHOULD/REFERENCE/OUT;
9. jornadas;
10. arquitetura proposta;
11. milestones de implementação;
12. plano de validação visual;
13. open questions priorizadas;
14. relatório de evidências e screenshots;
15. confirmação de que não houve implementação nem alteração da PWA.

Antes da entrega, verifique:

- nenhuma credencial, token, cookie, ID pessoal ou dado sensível foi salvo;
- toda afirmação relevante tem evidência ou classificação de incerteza;
- nenhuma página entrou no escopo apenas por existir;
- decisões antigas não prevaleceram sobre `CURRENT_STATE.md`;
- milestones são independentes e testáveis;
- nenhum arquivo fora de documentação foi alterado.

Pare ao concluir. **Não comece a implementação até uma nova autorização explícita do usuário.**
