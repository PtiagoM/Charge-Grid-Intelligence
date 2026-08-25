# ChargeGrid Intelligence — fonte única de verdade

**Atualizado em:** 25 de agosto de 2026  
**Escopo:** GoodWe, produto, negócio, operação, arquitetura, implementação, histórico e decisões vigentes  
**Status:** documento canônico para continuidade do projeto

Este é o primeiro documento que uma pessoa ou IA sem contexto deve ler. Ele consolida os documentos oficiais, o código atual e cinco sínteses de conversas históricas. Seu objetivo é preservar o máximo de contexto útil sem permitir que hipóteses antigas pareçam decisões atuais.

## 0. Governança

### Precedência

Quando houver conflito:

1. decisão explícita do usuário posterior à data deste documento;
2. revisão mais recente deste documento;
3. decisão datada posterior em uma spec implementada, dentro do seu escopo;
4. código e testes verificados, apenas para comportamento realmente implementado;
5. Produto, Arquitetura, Contratos, Demo e Design Systems;
6. materiais acadêmicos, pitches, pesquisas e conversas históricas.

Código não redefine silenciosamente produto ou negócio. Uma decisão relevante deve atualizar este documento e a spec afetada.

### Classificações

| Classificação | Significado |
| --- | --- |
| **VIGENTE** | Decisão atual. |
| **IMPLEMENTADO** | Existe no código atual. |
| **REAL EM SANDBOX** | Usa serviço externo real em teste, sem equivaler a produção comercial. |
| **DOCUMENTADO PELA GOODWE** | Encontrado em documentação de referência, não necessariamente homologado no ambiente do projeto. |
| **SIMULADO/FIXTURE** | Reproduz comportamento com dados locais ou sintéticos. |
| **HIPÓTESE COMERCIAL** | Demonstra valor, mas não é política corporativa aprovada. |
| **HISTÓRICO/SUPERADO** | Explica a evolução, mas não orienta trabalho novo. |
| **FUTURO/NÃO VALIDADO** | Possibilidade de roadmap sem comprovação suficiente. |

Não confundir documentação com homologação, sandbox com produção, ou fixture com telemetria real. A UI final não exibe avisos de “dados simulados”; essa transparência fica em documentação, testes e apresentação técnica.

### Decisões vigentes da Driver PWA

1. O mapa da Driver PWA usa Google Maps JavaScript API real; não deve existir mapa cartográfico fictício.
2. O catálogo mobile contém várias plantas comerciais para exercitar busca, bounds, disponibilidade e seleção.
3. A landing pública atende quem chega por busca ou link e oferece escanear QR Code, criar conta ou entrar.
4. O visitante pode seguir pelo QR até pagamento, sessão e comprovante sem cadastro obrigatório.
5. O motorista cadastrado possui cadastro, login, mapa, fila, histórico, conta e notificações.
6. O tema padrão da PWA é claro e predominantemente branco; o escuro é opcional.
7. Notificações usam a API do navegador e o service worker, sempre após permissão explícita.
8. Pagamentos usam Stripe real em modo de teste, acima de qualquer premissa antiga de gateway demonstrativo.
9. A interface não deve exibir rótulos como “dados simulados”, “cenário demo” ou equivalentes. A natureza de fixtures deve permanecer documentada e testável, sem poluir a experiência do usuário.
10. Supabase Auth é a identidade remota do motorista quando configurado. O fallback local existe somente para desenvolvimento sem credenciais.
11. A fila é exclusiva para motoristas autenticados. A entrada exige confirmação explícita, informa posição/espera previstas e explica que o primeiro carregador compatível liberado na planta será atribuído.
12. Fila e sessão comercial são estados globais persistidos no contexto do motorista: devem continuar durante a navegação. Busca, filtros e estados transitórios de interface permanecem locais à tela.
13. O limite financeiro autorizado é um teto de recarga: ao atingi-lo, a sessão encerra a energia sem ultrapassar o valor e informa o motorista. Durante a recarga, o principal indicador é uma barra verde de consumo do limite, saldo e tempo estimado restante.
14. `Explorar` preserva uma prévia do mapa antes das recomendações determinísticas e explicáveis. Acionar a barra de busca abre o mapa imersivo; a ordenação das recomendações prioriza disponibilidade comercial, fila/espera, distância, potência, tarifa e condição energética favorável e não deve alegar uso de IA.
15. Sem sessão ativa, a aba `Sessão` é a origem do catálogo completo de plantas, busca e filtros compactos. Com sessão ativa, preserva o contexto comercial corrente.
16. O mapa de descoberta usa a rota imersiva `/map`: ocupa a área visual completa e mantém somente busca, retorno e previews essenciais. O primeiro toque seleciona e aproxima; o segundo toque no mesmo pino abre potência, disponibilidade, tarifa e CTA para a planta. Enter geocodifica e centraliza o local pesquisado.
17. Estados de sessão nunca exibem enums ou códigos técnicos ao motorista. Tolerância de ociosidade usa contador visual e muda para urgência quando encerrada.
18. A central mostra por padrão notificações dos últimos sete dias e oferece acesso explícito às anteriores.
19. Em todos os destinos autenticados que pertencem ao fluxo comercial (detalhe, QR, fila, checkout, sessão e comprovante), a navegação inferior permanece visível e marca `Sessão` como ativa.
20. Ilustrações próprias e a expansão da identidade visual são roadmap: os assets serão fornecidos separadamente antes de qualquer integração na PWA.

### Decisões vigentes do Admin SEMS+ + ChargeGrid — 23/08/2026

1. O SEMS+ permanece a plataforma e verdade técnica; o ChargeGrid é uma camada comercial e operacional aditiva por planta.
2. Habilitar o ChargeGrid não substitui o shell, não remove funções SEMS+ e não converte todas as plantas da conta.
3. Permanecem os tipos de conta `Proprietário` e `Distribuidor/Instalador`; a conta profissional depende de aprovação e código organizacional.
4. O técnico/instalador mantém o papel técnico SEMS+ e não recebe dados comerciais por padrão.
5. `Usuário comercial` é uma condição derivada do acesso comercial a pelo menos uma planta, não um terceiro tipo permanente de conta.
6. Uma conta pode possuir simultaneamente plantas somente SEMS+ e plantas ChargeGrid.
7. Cada contrato ChargeGrid cobre exatamente uma planta e tem o estabelecimento como parte contratante.
8. O consultor GoodWe que conduziu o contrato autoriza a emissão; o backend gera um código único que vincula contrato, estabelecimento, consultor e planta quando conhecida.
9. Dados contratuais chegam de sistema comercial/contratual ou backoffice restrito; o usuário não redigita o contrato no SEMS+.
10. Resgatar o código inicia o onboarding, mas publicação exige vínculo válido, prontidão técnica e configuração comercial.
11. Compartilhamento SEMS+ não concede automaticamente contrato, tarifa, sessões, fila, pagamentos ou financeiro.
12. Encerrar o contrato suspende somente a camada comercial da planta e preserva toda a experiência técnica SEMS+.
13. Novos carregadores da planta ficam elegíveis, mas não são publicados automaticamente.
14. Usuários GoodWe recebem responsabilidade e escopo de carteira, região, parceiro ou planta; visão nacional é capacidade estratégica adicional e agregada por padrão.
15. A apresentação ChargeGrid segue a densidade e a hierarquia do SEMS+: listas, tabelas, gráficos, estados inline e resumos compactos prevalecem sobre grades genéricas de cards grandes com números.
16. As funções organizacionais `Administrador`, `Navegador` e `Técnico` continuam distintas dos papéis ChargeGrid; a demonstração não pretende reconstruir toda a matriz proprietária de permissões do SEMS+.
17. Permissões internas do SEMS+ só são reproduzidas quando confirmadas por evidência ou necessárias ao modelo ChargeGrid; diferenças desconhecidas de acesso a dispositivos não devem ser inventadas.
18. Central GoodWe não é conta-mestre nem novo tipo de login: é colaborador profissional GoodWe com função organizacional de administrador, responsabilidade ChargeGrid de consultor/governança e escopo de rede completo; diferenças de tela ou ação exigem origem explícita.
19. O proprietário SEMS+ da planta contratada é automaticamente o administrador da operação ChargeGrid; não existe uma persona separada de administrador do estabelecimento.
20. Proprietário com planta comercial recebe entrada dinâmica `ChargeGrid` para operação, sessões, fila e financeiro; proprietário comum e instalador sem vínculo preservam apenas as sete superfícies SEMS+.
21. Consultor e Central usam inicialmente as superfícies SEMS+ existentes; uma entrada ChargeGrid GoodWe para Visão geral/Oportunidades é secundária e só será criada se provar utilidade sem introduzir CRM ou gestão de tarefas.
22. Contratos, ativações e tarifa pertencem à Gestão da organização; Central de relatórios fica dedicada a geração, exportação, tarefas e histórico de relatórios.
23. Inteligência não é página decorativa: deve aparecer em recomendação, demanda, oportunidade ou indicador com evidência e decisão associada.

O registro completo e canônico destas decisões está em `docs/admin-dashboard/PRODUCT_DECISIONS.md`.

O plano aprovado para a próxima construção está em `docs/admin-dashboard/NEXT_EXECUTION_PLAN.md`.

### Implementação local da decisão — 23/08/2026

- inventário SEMS+ preservado com abas de inversores, dongles, carregadores veiculares e inversores de terceiros;
- somente o carregador possui detalhe reconstruído nesta fase, com palco do equipamento, último carregamento, monitoramento e registros; os demais dispositivos permanecem no inventário técnico;
- Central GoodWe, gestor de carteira e suporte técnico possuem escopos explícitos nas fixtures do Admin;
- a função organizacional SEMS+ (`Administrador`, `Navegador` ou `Técnico`) é armazenada separadamente do papel ChargeGrid;
- a fidelidade de permissões prioriza contratos, ativações, carteiras, publicação de carregadores, operação local e proteção comercial; a matriz interna GoodWe permanece deliberadamente simplificada;
- a Gestão da organização reúne informações organizacionais, usuários e funções, contratos e ativações e logs;
- o código autorizado localiza um contrato de uma planta e inicia o onboarding sem permitir redigitação do estabelecimento, consultor ou vínculo técnico;
- uma conta SEMS+ sem concessão ChargeGrid autentica normalmente e não recebe conteúdo comercial;
- revogar uma concessão ChargeGrid remove o papel comercial, sem desativar a conta SEMS+;
- a lateral preserva as sete superfícies SEMS+ e integra as jornadas ChargeGrid em navegação contextual;
- formulários manuais de cliente, ponto e carregador GoodWe foram removidos do fluxo executável;
- carregadores descobertos entram como elegíveis e exigem configuração e publicação individual pelo administrador do estabelecimento;
- a janela de chamada da fila foi unificada em dez minutos;
- esta implementação permanece frontend/fixture; autoridade produtiva, RLS, integração contratual e emissão segura do código continuam pendentes no backend.

### Integração histórica do Admin — 23/08/2026

- `7fe0205` — `feat(admin): align ChargeGrid flows with SEMS responsibilities` — foi integrado em `develop/admin-web` pelo PR #5 (`b7d3fea`);
- a entrega consolida a camada ChargeGrid sobre as superfícies SEMS+, sem alterar o Driver PWA, API, pacotes compartilhados ou `main`;
- CI do PR aprovou lint, testes e build; a regressão E2E integral permaneceu fora da execução automática conforme a estratégia vigente;
- a validação local proporcional registrou 20 arquivos/72 testes unitários e 20 cenários E2E focais aprovados; o navegador integrado não estava disponível para uma nova inspeção manual;
- o modelo de permissões apresentado no frontend é demonstrativo: reproduz a estrutura e as restrições ChargeGrid confirmadas, mas não afirma equivalência integral à matriz proprietária de autorização GoodWe.

### Estado atual do Admin — 25/08/2026

- Fase 0 consolidada no PR #9, branch `feature/admin-persona-foundation`, commit funcional `dd81549` e consolidação documental `d8df92a`.
- A branch parte de `origin/develop/admin-web` no merge do PR #8 (`31401e6`).
- Foram aprovados 76 testes unitários Admin, lint, build e E2E focais de personas, navegação, filtros e painel.
- O CI integral do PR permanece responsável pela validação remota; nenhum snapshot ou baseline visual foi criado.
- Registros anteriores de M0–M9, PR #5 e branch `feature/admin-responsibility-flows` são históricos e não descrevem a base vigente.

## Registro da entrega atual — 21 de agosto de 2026

- `Explorar` combina prévia do mapa, abertura imersiva por busca e recomendações explícitas de locais. No mapa, o primeiro toque aproxima o pino e o segundo abre o card com dados essenciais e acesso à planta.
- O catálogo compacto permanece em `Sessão` quando não há recarga ativa.
- O contexto de sessão fica ativo na navegação do motorista durante detalhe, QR, fila, checkout e comprovante.
- Estados de sessão e notificações foram humanizados e verificados em navegador, lint, testes e build.
- O fluxo Pix, sua configuração Stripe e os assets de ilustração não foram alterados nesta entrega; ilustrações aguardam arquivos fornecidos pelo produto.

## 1. Síntese executiva

> **A GoodWe já possui infraestrutura, equipamentos, dados energéticos, software e canais comerciais. O ChargeGrid adiciona a camada comercial e operacional que transforma carregadores instalados em estabelecimentos em um serviço de recarga para múltiplos usuários.**

O ChargeGrid é um módulo/camada incorporado à experiência do SEMS+. A decisão anterior de manter um Dashboard ChargeGrid separado foi superada em 22/08/2026 e refinada em 23/08/2026: a camada é literalmente aditiva. A reconstrução usa somente evidência observável, sem acesso ou cópia de código proprietário, preserva as superfícies e fluxos SEMS+ reconstruídos e acrescenta contexto comercial por planta. Ativar o ChargeGrid não troca o shell nem remove funções técnicas. O backend pode continuar modular e integrado por APIs, mas a experiência administrativa permanece centralizada no SEMS+.

A Driver PWA permanece uma aplicação separada e está congelada nesta etapa: UI, UX, jornadas, funcionalidades e regras específicas não devem ser alteradas pela reconstrução do Dashboard.

```text
SolarGo    → configura e comissiona localmente
SEMS+      → observa e gerencia tecnicamente a planta
ChargeGrid → organiza comercialmente a recarga
```

> **O SEMS+ mostra o que acontece na planta; o ChargeGrid transforma esses dados em operação comercial de recarga.**

## 2. GoodWe como empresa

### Posicionamento adotado

A GoodWe não deve ser apresentada apenas como fabricante de inversores ou carregadores. No projeto, ela é uma empresa de tecnologia e soluções energéticas integradas, combinando:

- inversores fotovoltaicos e híbridos;
- solar, baterias e armazenamento;
- smart meters e comunicação;
- EV Chargers;
- soluções residenciais e C&I;
- SEMS+ e SolarGo;
- monitoramento e gestão energética;
- engenharia, pré-vendas, pós-vendas, treinamento e suporte;
- em mercados maduros, plataformas empresariais, microgrids, VPP, despacho e settlement.

Quatro traços orientam a narrativa:

- **engenharia aplicada:** soluções defensáveis e ligadas a equipamentos reais;
- **ecossistema:** hardware, energia, software e serviço funcionando juntos;
- **proximidade com o canal:** parceiros como multiplicadores da marca;
- **adaptação regional:** capacidade varia por mercado, firmware, produto, permissão e regulação.

Demanda, integração, tarifação/pagamento e IA são direções de evolução, não “falhas da GoodWe”.

### Fluxo comercial brasileiro observado

```text
GOODWE
tecnologia, equipamentos, plataforma, engenharia e suporte
        ↓
DISTRIBUIDORES
estoque, escala e condições comerciais
        ↓
INTEGRADORES / INSTALADORES / EPCs
projeto, dimensionamento, venda, instalação e comissionamento
        ↓
CLIENTE FINAL / PROPRIETÁRIO DA PLANTA
residência, comércio, indústria, agronegócio ou investidor
```

Em projetos maiores podem participar EPCs, parceiros energéticos e EaaS. A GoodWe Brasil não é tratada como operação essencialmente D2C.

O integrador aprende e especifica GoodWe, compra pelo distribuidor, dimensiona, instala, comissiona, conecta a planta e retorna para suporte ou expansão. Ele não é um intermediário a remover.

As conversas históricas registram o GoodWe PLUS+ como programa de treinamento/certificação de parceiros. Revalidar externamente antes de uso institucional.

### Pós-venda

```text
cliente/estabelecimento
→ integrador, instalador ou distribuidor
→ GoodWe
→ suporte, garantia, RMA ou parceiro autorizado
```

O ChargeGrid registra e acompanha incidentes comercialmente. Reparo, garantia e substituição continuam na estrutura técnica GoodWe/parceiros; a v1 não recria RMA.

### Modelo de receita atual da GoodWe

A leitura do projeto é **hardware-led**: inversores, baterias/storage, carregadores, smart meters, acessórios e infraestrutura. Garantias, peças, logística e serviços podem complementar.

O SEMS+ gera valor econômico mesmo sem assinatura independente:

```text
mais hardware GoodWe
→ mais ativos e dados no ecossistema
→ maior integração e retenção
→ suporte, cross-sell, expansão e recompra
```

O ChargeGrid busca recorrência digital e inteligência comercial sem competir com hardware.

## 3. GoodWe e recarga veicular

### HCA G2

Foi superada a hipótese de que a GoodWe não venderia carregadores no Brasil. As pesquisas históricas registram a família HCA G2 em 7, 11 e 22 kW. Referência do projeto:

> **GoodWe HCA G2 — GW7K-HCA-20 — AC nominal de 7 kW.**

Revalidar comercialmente antes de afirmação externa atual.

O HCA G2 é hardware integrado ao ecossistema energético, não uma operação comercial completa. Não atribuir automaticamente billing, Pix/cartão, fila, reserva, roaming, marketplace, CPO/eMSP, OCPP ou comandos não documentados. RFID é autorização local, não pagamento completo.

### GoodWe não é CPO por definição do projeto

Não foi comprovada rede pública GoodWe brasileira com CPO/eMSP nacional, roaming e carteira pública. A formulação segura é:

> **A GoodWe habilita a operação com tecnologia, plataforma e suporte; o estabelecimento ou parceiro opera o serviço e os ativos.**

### WE Platform e direção internacional

Pesquisas históricas identificaram solar + storage + charging, microgrid, VPP, despacho e settlement, sobretudo na China. A WE Platform é entendida como plataforma empresarial mais ampla que “SEMS+ da China”. Isso prova direção, não disponibilidade idêntica no Brasil.

> **A GoodWe demonstra globalmente evolução para plataformas energéticas; o ChargeGrid especializa essa direção para a recarga comercial brasileira.**

## 4. SEMS+, SolarGo e OpenAPI

### SEMS+

É a referência prática de monitoramento e gestão energética GoodWe:

- plantas, mapas, clusters e contas;
- dispositivos e estados;
- geração, consumo, bateria e rede;
- potência, energia, alarmes e histórico;
- proprietários, instaladores e organizações;
- carregadores e telemetria disponível.

Ele modela planta energética, não necessariamente “eletroposto comercial”. O ChargeGrid não recadastra tecnicamente a planta nem duplica monitoramento.

SEMS+ é global, mas infraestrutura, endpoints, hardware, firmware, permissões e integrações variam por região. Não inferir Brasil a partir de outra região.

### SolarGo

Permanece ligado à configuração e ao comissionamento local. O ChargeGrid vincula uma planta existente e cria perfil comercial; não substitui instalação ou parametrização técnica.

### Arquitetura de integração

```text
GoodWe Cloud / SEMS+ / OpenAPI
              ↓
        GoodWe Adapter
              ↓
        ChargeGrid Core
          /         \
SEMS+ + módulo CG   Driver PWA
```

O Dashboard será reconstruído como experiência SEMS+ com o ChargeGrid incorporado como módulo/camada. A implementação pode preservar separação interna de componentes, domínio, backend e adapters, mas não deve apresentar o ChargeGrid como produto administrativo paralelo. O PWA continua separado e inalterado.

### Autorização documentada

As fontes históricas registram OAuth organizacional, autorização de terceiros por usuário/planta, scopes de dados/controle, whitelist de equipamento e gateways regionais. São capacidades documentadas, não credenciais disponíveis.

### EV Charger na OpenAPI

A referência analisada inclui `deviceType = 5` e campos como `model`, `ratedPower`, `refreshTime`, `vehConnectStatus`, `evChargerCharge`, `activePower`, tensões/correntes, `currentChargeE` e `currentChargeTime`.

`vehConnectStatus` foi usado como referência:

```text
0 → desconectado
1 → conectado/aguardando
2 → conectado e carregando
```

A planta pode expor `pvPower`, `batteryPower`, `evChargerPower`, `meterPower`, `loadPower` e estatísticas energéticas. A disponibilidade depende do ambiente.

### Comandos e limites

`StartCharge` e `StopCharge` aparecem na documentação. Solicitação aceita é assíncrona; a UI só declara carga após confirmação por estado/telemetria.

Não estão homologados:

- `SetPowerLimit` para EV;
- `PauseCharge`/`ResumeCharge`;
- balanceamento fino;
- OCPP no HCA G2;
- RFID/card ID pela OpenAPI;
- latência para proteção elétrica;
- conjunto completo de alarmes EV.

Controles mais ricos de bateria e despacho por terceiros reforçam integração energética futura, mas não podem ser atribuídos ao EV Charger.

### Estado atual

Existe `MockGoodWeProvider`; não há conexão operacional GoodWe, credenciais homologadas, token produtivo ou teste real do HCA G2. O mock preserva contrato e assincronicidade para futura troca por `OpenApiGoodWeProvider`.

## 5. Problema empresarial

A transição residencial → comercial adiciona múltiplos usuários, visitantes, sessões simultâneas, descoberta, pagamento, preço, fila, horários, ociosidade, demanda, conciliação, suporte, receita e utilização.

> **Instalar um carregador cria infraestrutura. Operar recarga comercial exige um sistema.**

## 6. Definição e limites do ChargeGrid

> **ChargeGrid Intelligence é a camada comercial e operacional de recarga do ecossistema GoodWe, utilizando dados energéticos e operacionais para transformar a infraestrutura em operação gerenciável, sustentável e monetizável.**

```text
dado técnico
→ contexto operacional
→ decisão comercial
→ experiência e pagamento
→ receita, utilização e expansão
```

Não é empresa independente, CPO autônoma, substituto do SEMS+/SolarGo, monitoramento duplicado, apenas billing/dashboard, IA autônoma ou plataforma multi-fabricante v1.

### Fontes de verdade

| Domínio | Fonte | Exemplos |
| --- | --- | --- |
| Técnico/energético | GoodWe | planta, dispositivo, telemetria, potência, solar, bateria, rede, alarme e estado EV |
| Comercial | ChargeGrid | estabelecimento, motorista, sessão, tarifa, fila, ociosidade e disponibilidade comercial |
| Financeiro | Gateway + ChargeGrid | autorização, captura, pré-pagamento, devolução, settlement e disputa |
| Predição | IA/cálculo derivado | espera, demanda, ocupação e expansão como estimativas |

Disponibilidade técnica ≠ comercial. Um carregador online pode estar fechado, sob restrição de demanda, em manutenção ou sem condição comercial válida.

### Estado implementado do produto

| Área | Estado | Referência |
| --- | --- | --- |
| Landing pública | Implementada com QR, cadastro e login | `apps/driver-pwa/src/pages/HomePage.tsx` |
| Scanner QR | Câmera, imagem e código manual com ZXing | `apps/driver-pwa/src/pages/QrScannerPage.tsx` |
| Visitante | QR → detalhe → checkout → sessão → comprovante | `apps/driver-pwa/src/app/AppRouter.tsx` |
| Cadastro/login | Supabase Auth quando configurado; fallback local em desenvolvimento | `apps/driver-pwa/src/services/driverAuth.ts` |
| Descoberta | Recomendações determinísticas e explicáveis; catálogo completo na aba Sessão | `apps/driver-pwa/src/pages/ExplorePage.tsx` |
| Mapa | Google Maps JavaScript API, rota imersiva e geocodificação | `apps/driver-pwa/src/components/DriverDiscoveryMap.tsx` |
| Pagamento | Stripe Payment Element e PaymentIntents em modo teste | `apps/driver-pwa/src/pages/CheckoutPage.tsx` |
| API financeira | Criar, consultar, capturar e reembolsar PaymentIntent | `apps/api/src/payments/` |
| Fila/sessão | Estado global persistido, entrada confirmada e limite financeiro aplicado | `apps/driver-pwa/src/app/DriverAppContext.tsx` |
| Notificações | Permissão e notificações locais pelo service worker | `apps/driver-pwa/src/pages/NotificationsPage.tsx` |
| Dashboard Admin | **RECONSTRUÇÃO FUNCIONAL EM M6**: verticais de plantas, operação, fila, energia e financeiro funcionais localmente; tarifa versionada, precisão monetária, reembolso e conciliação implementados | `apps/admin-web/`, `docs/admin-dashboard/CRITICAL_REVIEW.md` |
| GoodWe | contrato e `MockGoodWeProvider`; OpenAPI real ainda não conectada | `apps/api/src/goodwe/` |
| Persistência comercial | estrutura prevista; migrations, RLS e repositories ainda não implementados | `supabase/` |
| IA externa | fronteira documental | `apps/api/src/ai/README.md` |
| Produção Vercel | Driver PWA e API publicados | `apps/api/src/app.ts`, `apps/api/src/server.ts` |

## 7. Atores

### GoodWe comercial

- gestor de carteira/consultor: estabelecimentos e plantas atribuídos, contratos, ativações, pendências, qualidade comercial e expansão;
- Central GoodWe: indicadores agregados por região, carteira ou parceiro; a visão nacional é capacidade estratégica adicional;
- suporte técnico: permanece nas permissões SEMS+ das plantas/equipamentos autorizados e não recebe dados comerciais por padrão.

A GoodWe não é um único superadministrador nacional. Não substitui comissionamento nem rotina local.

### Estabelecimento/admin e operador

O estabelecimento define horários, preço e políticas; acompanha carregadores, sessões, fila, energia, incidentes e relatórios; arca com energia/custos locais e recebe a maior receita. Operador atua na rotina sem parâmetros sensíveis.

### Distribuidor/instalador/integrador/EPC

Conta profissional sujeita a aprovação e código organizacional. Atua em venda, dimensionamento, instalação, comissionamento, habilitação, suporte e expansão. Sem app ChargeGrid próprio na v1 e sem operar comercialmente por padrão.

### Motorista cadastrado

Mapa, perfil, veículos, fila, pagamento, sessão, notificações, histórico e comprovantes.

### Visitante

QR, condições, limite, pagamento, sessão e comprovante sem conta. Atualmente não entra na fila.

> **O QR Code adquire; a conta fideliza.**

## 8. Modelo de negócio

```text
GoodWe → distribuidor/integrador → estabelecimento → motorista
```

O canal passa de “carregador + instalação” para “infraestrutura + operação comercial + inteligência + experiência”.

### Valor para a GoodWe

1. **Venda inicial maior:** charger, meter, inversor, solar, bateria, adequação e software.
2. **Recorrência digital:** licença, assinatura, revenue share, serviço gerenciado ou pacote com hardware.
3. **Expansão:** ocupação, fila e demanda não atendida revelam novas vendas.

### Parâmetro demonstrativo de 5%

```text
energia + ociosidade - descontos - devoluções
= receita bruta liquidada

comissão demonstrativa
= 5% × receita bruta liquidada

líquido do estabelecimento
= receita bruta liquidada - comissão - taxas do gateway
```

É **HIPÓTESE COMERCIAL**, configurável, não política oficial; não aparece como sobretaxa ao motorista e não exclui outros modelos. Depende de contratos, split, fiscalidade, chargeback e estratégia GoodWe.

## 9. Superfícies

### Dashboard SEMS+ com camada ChargeGrid

- usuário SEMS+ sem vínculo comercial: experiência técnica preservada;
- administrador do estabelecimento: plantas comerciais autorizadas, tarifa, pagamentos, energia e relatórios;
- operador do estabelecimento: rotina comercial sem parâmetros sensíveis;
- gestor de carteira/consultor GoodWe: contratos, ativações, qualidade e expansão dentro do escopo;
- Central GoodWe: agregados estratégicos por região, carteira ou parceiro.

O Dashboard está sendo reconstruído sobre a linha `develop/admin-web`. O shell e os fluxos SEMS+ reconstruídos são preservados; o ChargeGrid acrescenta cards, filtros e abas contextuais ou cria páginas dentro do mesmo shell quando não houver encaixe coerente. Uma conta pode misturar plantas técnicas e comerciais. O Dashboard não duplica a verdade técnica e não reproduz jornadas de motorista ou visitante da PWA.

### Driver PWA

Mobile-first por URL/QR, sem instalação obrigatória: landing, scanner, visitante, login, mapa, fila, checkout, sessão, notificações, histórico, conta e comprovante.

Dashboard e Driver PWA oferecem temas claro e escuro como opções do usuário. A escolha de tema não altera a diferença de composição: o Dashboard continua mais denso e operacional, enquanto a PWA permanece mobile, tátil e progressiva. Na PWA, o estado inicial continua claro quando ainda não existe preferência persistida.

### Core/API

Deve concentrar regras críticas de sessão, pagamento, tarifa, fila, ociosidade, demanda, comandos, auditoria e conciliação.

> **Uma regra crítica, um lugar: o backend.**

## 10. Jornadas

### Visitante

```text
QR → carregador → condições → limite → cartão/Pix
→ garantia → validação → StartCharge → acompanhamento
→ encerramento → ociosidade → liquidação → comprovante
```

### Cadastrado

```text
login → mapa → estabelecimento → fila quando necessário
→ carregador compatível → pagamento → recarga
→ notificações → histórico
```

### Estabelecimento

```text
dashboard → energia/demanda → regras → admissão
→ sessões/fila/falhas → financeiro e recomendações
```

### GoodWe

```text
rede → plantas → utilização/volume → incidentes
→ saturação → expansão
```

### Onboarding de planta

```text
estabelecimento → consultor GoodWe → contrato por planta
→ instalação ou validação SEMS+ → código autorizado/emitido
→ resgate pelo estabelecimento → vínculo da planta
→ detectar EV Chargers → perfil comercial
→ preço/horários/políticas → revisar → publicar
```

O código inicia o onboarding e não publica sozinho. A planta continua técnica no SEMS+ mesmo se o contrato for encerrado.

## 11. Sessão e pagamento

### Estados

```text
SESSION_CREATED → AWAITING_PAYMENT → AUTHORIZED → WAITING_START
→ STARTING → CHARGING → ENERGY_FINISHED → IDLE_GRACE_PERIOD
→ IDLE_FEE, se aplicável → SETTLING → COMPLETED
```

Exceções: `PAYMENT_FAILED`, `START_FAILED`, `FAULTED`, `CANCELLED`, `SETTLEMENT_PENDING`, `DISPUTED`, `OUTSTANDING_BALANCE` e `SUSPENDED_BY_DEMAND` comercial.

### Princípio

```text
identificar → garantir pagamento → liberar energia
→ medir consumo confirmado → calcular → liquidar
```

Nenhuma energia comercial sem garantia válida.

- **Cartão:** pré-autorização e captura do usado.
- **Pix:** pré-pagamento e devolução do saldo.

Stripe está em sandbox; live, split, fiscalidade, antifraude e conciliação completa não existem.

### Limite financeiro vigente

- é teto operacional real, não só UX;
- a sessão não deve ultrapassá-lo;
- ao atingir o teto, solicita `StopCharge` e informa o motorista;
- barra verde mostra consumo do limite, saldo e tempo estimado;
- progresso é crédito consumido, não SOC do veículo;
- tempo estimado nunca é garantia;
- implementação real precisa margem pela latência/última medição.

## 12. Tarifação

O estabelecimento define preço comercial. Podem informar novas ofertas: tarifa base, horário/posto, modalidade, custo, demanda, solar, bateria, bandeira e limites.

- fila/lotação não geram surge pricing;
- mudança programada informada antes do aceite pode segmentar sessão;
- solar/demanda instantâneos não reprificam silenciosamente sessão aceita;
- preço e transições são transparentes antes da autorização.

## 13. Fila e reserva

### Vigente

- exclusiva para autenticados;
- por estabelecimento/planta, não por conector;
- confirmação explícita;
- preview de posição/espera;
- primeiro carregador compatível liberado em toda a planta;
- FIFO entre elegíveis;
- uma fila ativa por motorista;
- persistência global durante navegação;
- sair da página não remove;
- busca/filtros/seleção continuam locais;
- sem reserva antecipada.

Espera é estimativa determinística; IA futura pode melhorar, nunca garantir.

### Chamada/no-show de referência

- janela de 10 minutos;
- lembrete com 5 minutos restantes;
- no-show perde a vez e pode voltar ao fim.

Precisa de backend/persistência para operação confiável.

### Histórico superado

Documentos antigos aceitavam visitantes, com cadastrados primeiro e FIFO por classe. Foi substituído por fila exclusiva para autenticados. Visitante ainda pode carregar diretamente por QR quando há disponibilidade.

## 14. Ociosidade

```text
energia confirmadamente encerrada → 15 min grátis
→ veículo conectado → R$ 0,50/min de referência
→ desconexão ou teto de 60 min
```

Parâmetros demonstrativos/configuráveis. Falha técnica, demanda, comunicação incerta ou fim não confirmado não iniciam ociosidade. Saldo insuficiente pode gerar `OUTSTANDING_BALANCE`.

## 15. Controle de demanda

| Estado | Comportamento |
| --- | --- |
| `NORMAL` | Permite novos inícios. |
| `ALERT` | Restringe novos inícios e preserva existentes. |
| `CRITICAL` | Bloqueia novos inícios e pode usar `StopCharge`. |

Sem promessa de proteção instantânea, modulação contínua, `SetPowerLimit` ou pausa física. `SUSPENDED_BY_DEMAND` pode significar `StopCharge` e novo `StartCharge` após revalidação.

Prioridade histórica de interrupção: visitantes mais recentes primeiro; depois cadastrados mais recentes. Visitantes ainda podem ter sessões diretas por QR.

## 16. IA e sustentabilidade

> **A IA prevê e recomenda; o motor de regras valida; a interface comunica.**

Pode apoiar demanda, ocupação, espera, local/horário, tarifa, saturação e expansão. Não substitui proteção, BMS, regras ou operador; indisponibilidade não bloqueia o core.

Sustentabilidade significa aproveitar solar, respeitar bateria, reduzir pico, coordenar cargas e informar decisões. Não afirmar “100% solar por sessão” sem rastreabilidade.

## 17. Arquitetura e processo

```text
apps/
├── admin-web
├── driver-pwa
└── api
packages/shared
supabase/
```

- React + TypeScript + Vite;
- Node/Express;
- Supabase/PostgreSQL/Auth/RLS planejado;
- adapters GoodWe, pagamento e IA;
- Python/FastAPI opcional para IA;
- polling simples como baseline;
- sem microserviços, Kafka, Redis obrigatório, Kubernetes, GraphQL ou DDD excessivo.

`packages/shared` centraliza contratos, enums, constantes, tokens e fixtures. Não duplicar linguagem entre Admin, PWA e API.

```text
GoodWeProvider
├── MockGoodWeProvider       [atual]
└── OpenApiGoodWeProvider    [futuro]
```

Processo:

```text
produto/contexto → arquitetura → contratos → demo
→ design system → spec → código/testes
```

## 18. Estado implementado em 22/08/2026

| Área | Estado | Fonte |
| --- | --- | --- |
| Landing | **IMPLEMENTADO** | `HomePage.tsx` |
| QR | **IMPLEMENTADO**: câmera, imagem e manual com ZXing | `QrScannerPage.tsx` |
| Visitante | **IMPLEMENTADO**: QR → checkout → sessão → recibo | `AppRouter.tsx` |
| Auth | **REAL EM SANDBOX**: Supabase; fallback local só dev | `driverAuth.ts` |
| Mapa | **REAL EM SANDBOX**: Google Maps, busca, geolocalização, seis plantas | `DriverDiscoveryMap.tsx` |
| Resiliência do mapa | **IMPLEMENTADO**: singleton, timeout, tiles, retry, lista | mesmo componente |
| Pagamento | **REAL EM SANDBOX**: Stripe Payment Element/Intents | `CheckoutPage.tsx` |
| API financeira | **IMPLEMENTADO**: criar, consultar, capturar e reembolsar | `apps/api/src/payments/` |
| Webhook | **PARCIAL**: valida assinatura/registra; não reconcilia sessão | `payments/routes.ts` |
| Fila/sessão | **LOCAL**: contexto global persistido e ciclo entre telas | `DriverAppContext.tsx` |
| Progresso | **LOCAL**: teto, barra verde, saldo e estimativa | `SessionPage.tsx` |
| Notificações | **LOCAL**: navegador/service worker | `browserNotifications.ts` |
| PWA | **IMPLEMENTADO**: manifest, SW, ícone, instalação/safe areas | `public/` |
| Dashboard Admin | **BASE LOCAL M0–M9 CONCLUÍDA**: onboarding, operação, fila, energia, financeiro, incidentes, recomendações sem autoexecução, acesso por papel/escopo e relatórios exportáveis funcionam no sandbox; M9 removeu implementações paralelas e validou build, lint, unitários, E2E crítico e 390/1280/1440 px. Providers, autorização backend/RLS, tema claro, entrega agendada e a nova regressão visual após o próximo redesenho permanecem pendentes | `apps/admin-web/`, `docs/admin-dashboard/VALIDATION_REPORT.md` |
| GoodWe | **SIMULADO** | `apps/api/src/goodwe/` |
| Persistência comercial | **NÃO IMPLEMENTADO**: migrations/repositories/RLS | `supabase/` |
| IA | **NÃO IMPLEMENTADO** | `apps/api/src/ai/README.md` |
| Vercel | **PUBLICADO PARA TESTE**: PWA e API | projetos Vercel |

## 19. Rotas da PWA

| Rota | Acesso | Uso |
| --- | --- | --- |
| `/` | público | landing de visitante |
| `/scan` | público | scanner QR |
| `/qr/:chargerSlug` | público | carregador identificado |
| `/signup` | público | cadastro de motorista |
| `/login` | público | login |
| `/explore` | motorista | recomendações determinísticas para carregar agora |
| `/map` | motorista | mapa imersivo, busca de local e preview de plantas |
| `/place/:establishmentId` | motorista | detalhe do estabelecimento |
| `/checkout` | público | Stripe Payment Element |
| `/queue` | motorista | fila |
| `/session` | público | sessão corrente; para motorista sem sessão, catálogo completo e filtros |
| `/receipt/:receiptId` | público | comprovante |
| `/history`, `/notifications`, `/account` | autenticado | recorrência |

## 20. Integrações e publicação

### SEMS+ sandbox de análise

As contas de operador e usuário disponíveis para reconstrução pertencem a um ambiente de sandbox/teste sem controle de operação física real. Durante a análise, está autorizado autenticar autonomamente os dois papéis e criar, editar, ativar, desativar, arquivar e excluir dados fictícios para descobrir estados, permissões e fluxos. Usar preferencialmente nomes `CG_ANALYSIS_*`, registrar estado anterior/posterior e remover somente registros criados pelo próprio agente. As credenciais podem ser fornecidas como segredo de runtime na mensagem inicial da tarefa, mas nunca devem ser gravadas no repositório, arquivos, terminal, screenshots ou documentação. Billing, propriedade da conta, credenciais de API, integrações externas e qualquer possível ativo real continuam fora dessa autorização.

### Variáveis

| Variável | Ambiente | Uso |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | browser | Maps |
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | browser | Supabase público |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | servidor | Supabase privilegiado |
| `VITE_STRIPE_PUBLISHABLE_KEY` | browser | Stripe público test |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | servidor | Stripe test |
| `VITE_CHARGEGRID_API_URL` | browser | API |
| `CHARGEGRID_ALLOWED_ORIGINS` | servidor | CORS |

`.env` não é versionado. Segredos nunca entram em `VITE_*` ou documentação.

### Vercel

- PWA: `https://chargegrid-driver-pwa.vercel.app`
- API: `https://chargegrid-api.vercel.app`
- Health: `GET https://chargegrid-api.vercel.app/health`
- Config pagamentos: `GET https://chargegrid-api.vercel.app/payments/config`

A PWA possui fallback de SPA em `apps/driver-pwa/vercel.json`, permitindo abrir ou recarregar diretamente rotas do React Router como `/explore`, `/map` e `/place/:id` sem receber 404 da Vercel.

O monorepo possui dois projetos Vercel, ambos com raiz configurada em `apps/`. O PWA usa Vite e recebe somente variáveis públicas `VITE_*`; a API Express recebe `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` e `CHARGEGRID_ALLOWED_ORIGINS` como variáveis protegidas. Não documentar valores de chaves, segredos ou IDs de webhook.

Ambiente de teste técnico, não lançamento comercial.

### Maps

- mapa real obrigatório;
- chave com API, billing, cota e referrer;
- trocar `VITE_GOOGLE_MAPS_API_KEY` exige redeploy da PWA, não da API;
- falha mantém lista e retry.

Em 21/08/2026, SDK com referer de produção respondeu sem erro conhecido. Falhas futuras exigem Console/Google Cloud.

### Stripe, Supabase e notificações

- Stripe real em teste; webhook ainda não reconcilia sessão;
- Supabase Auth conectado; tabelas, RLS e JWT da API pendentes;
- notificações locais; push remoto/FCM pendente;
- `localStorage` não é autoridade de produção.

## 21. Histórico e decisões superadas

### Origem

Sprint 1 usou circuito lógico de condição energética, autenticação, prioridade, recarga, fila e pagamento. Foi substituído por máquinas de estado, políticas e admissão. Sprint 2 consolidou arquitetura, requisitos e dashboard; `EntregaSprint2.md` foi referência temporária.

```text
dashboard inteligente
→ plataforma comercial genérica
→ risco de SaaS/CPO externo
→ produto GoodWe
→ pesquisa SEMS+, HCA, OpenAPI e WE
→ camada comercial/operacional
→ primeira implementação com Admin separado + PWA + API
→ produção técnica de teste
→ decisão definitiva: módulo dentro da experiência SEMS+
→ análise autorizada e testes ativos no sandbox SEMS+
→ reconstrução do Dashboard em novo projeto
→ persistência e homologação GoodWe
```

### Matriz de decisões

| Tema | Histórico | Vigente |
| --- | --- | --- |
| GoodWe | fabricante/futura CPO | ecossistema; habilita, estabelecimento opera |
| ChargeGrid | SaaS externo ou Dashboard administrativo separado | camada comercial/operacional aditiva por planta dentro do SEMS+; PWA permanece separado |
| SEMS+ | referência técnica integrada a um Admin próprio | plataforma técnica preservada; ativar ChargeGrid não troca o shell, não remove função e não converte toda a conta |
| Contas Admin | superadmin GoodWe + papéis ChargeGrid isolados | `Proprietário` e `Distribuidor/Instalador` permanecem; vínculos comerciais são adicionais e por planta |
| Ativação | botão de onboarding para planta autorizada | contrato por planta + código autorizado pelo consultor + prontidão antes da publicação |
| Integração | OCPP/MODBUS/MQTT amplos | GoodWe Adapter/OpenAPI |
| Comandos | controle fino | `StartCharge`/`StopCharge`; outros não validados |
| RFID | cobrança | autorização local |
| Pagamento | mock | Stripe sandbox real |
| Auth | localStorage | Supabase Auth; fallback dev |
| Mapa | fictício | Google Maps real |
| Catálogo | uma planta | seis plantas atuais; D0 segue como demo |
| Temas | associação rígida de Admin ao escuro e PWA ao claro | Admin e PWA oferecem claro/escuro; composição e densidade continuam próprias de cada superfície |
| Fila | visitantes+cadastrados | só autenticados, confirmação e persistência |
| Reserva | possível | fora da v1 |
| Limite | UX | teto real/progresso |
| Tarifa | trava total/surge | segmentos transparentes; sem surge por fila |
| IA | autopilot | recomendação + regra determinística |
| 5% | definitivo | parâmetro demonstrativo; modelo final aberto |

## 22. Cenário de demonstração

“Hub Solar Aurora” contém uma planta, seis chargers de 7 kW, balanço energético, tarifa, pessoas, sessões, fila, falhas, demanda, ociosidade e liquidação D0–D15. Garante coerência entre superfícies e testes; não é rede real nem limita o catálogo atual.

`StartCharge`/`StopCharge` são as únicas intenções EV demonstráveis. Modulação física em bancada é simulação futura.

## 23. Não-escopo v1

- reserva;
- roaming;
- OCPP no HCA G2;
- multi-fabricante;
- controle fino garantido;
- proteção elétrica instantânea;
- VPP/mercado de energia;
- CRM/ERP/fiscal/RMA completos;
- estacionamento/fidelidade padrão;
- app de integrador;
- substituição SEMS+/SolarGo;
- IA autônoma;
- financeiro live sem homologação.

## 24. Roadmap

1. estabilizar PWA/API em domínio real de teste;
2. implementar schema, migrations, repositories, RLS e auditoria;
3. validar JWT/autorização na API;
4. obter credenciais e homologar OpenAPI/HCA G2;
5. trocar mock por telemetria/comandos reais;
6. reconciliar sessão técnica, comercial e pagamento;
7. validar planta piloto, operação e suporte;
8. definir modelo comercial, contratos, fiscalidade, LGPD e risco;
9. habilitar live após homologação;
10. evoluir push/observabilidade;
11. treinar IA com dados reais e fallback;
12. considerar balanceamento, reserva e multi-fabricante após evidência.

## 25. Pontos abertos

### GoodWe/hardware

- modelo comercial atual oficial no Brasil;
- HCA G2/modelos e PLUS+ atuais;
- região, credenciais e permissões OpenAPI;
- campos, comandos, latência, erros, RFID e alarmes do equipamento;
- papel oficial como CPO ou habilitadora.

### Produto/operação

- thresholds de demanda;
- chamada/no-show definitiva;
- margem de encerramento financeiro;
- SLA e suporte GoodWe-integrador-estabelecimento;
- preço, desconto e ociosidade finais;
- piloto e critérios de sucesso.

### Financeiro/jurídico/dados

- monetização definitiva;
- sistema contratual de origem, integração e recebedor financeiro; o estabelecimento já está definido como parte contratante e cada contrato cobre uma planta;
- split, fiscalidade, LGPD, fraude e chargeback;
- Stripe live;
- schema, RLS e autorização.

### IA/futuro

- dataset, features, métricas e drift;
- qualidade sem histórico local;
- controle contínuo, OCPP e multi-fabricante;
- estacionamento/benefícios.

## 26. Regras de continuidade

- GoodWe = verdade técnica; ChargeGrid = verdade comercial;
- regra crítica no backend;
- não declarar GoodWe real com provider mock;
- não chamar Stripe test de live;
- não usar `localStorage` como banco/autoridade;
- não pôr segredo em `VITE_*`;
- não substituir Maps por desenho fictício;
- não reintroduzir visitante na fila sem nova decisão;
- preservar fila/sessão globais;
- não chamar progresso financeiro de SOC;
- não reintroduzir reserva/OCPP/power control por conveniência;
- não apresentar 5% como política corporativa;
- não desintermediar o canal;
- usar `@chargegrid/shared` para contratos/enums;
- manter Admin/PWA coerentes sem torná-los idênticos;
- preservar funcionalidades e fluxos SEMS+ ao habilitar a camada ChargeGrid;
- nunca promover compartilhamento técnico SEMS+ a acesso comercial implícito;
- aplicar contrato e ativação ChargeGrid por planta, não por conta inteira;
- não usar `GOODWE_ADMIN` como persona nacional única; combinar papel, escopo e capacidade;
- atualizar este documento e a spec ao mudar fronteiras.

## 27. Execução local

```bash
npm install
npm run dev

npm run dev:admin  # http://localhost:5173
npm run dev:pwa    # http://localhost:5174
npm run dev:api    # http://localhost:3333

npm run lint
npm run test
npm run build
```

## 28. Fontes e leitura complementar

Após este documento:

1. `README.md` — estrutura e execução;
2. `docs/specs/driver-pwa-mobile/` — PWA;
3. `docs/product/ChargeGrid_Intelligence_Documento_Final_de_Produto_v1.0.md` — produto original;
4. `docs/architecture/ChargeGrid_Intelligence_Stack_e_Arquitetura_MVP_v1.0.md` — arquitetura;
5. `docs/contracts/ChargeGrid_Intelligence_Contratos_e_Enums_Compartilhados_v1.0.md` — contratos;
6. `docs/demo/ChargeGrid_Intelligence_Cenario_Compartilhado_de_Demonstracao_v1.0.md` — D0–D15;
7. `docs/design-system/` — identidade;
8. `docs/pitch/ChargeGrid_Intelligence_Guia_de_Narrativa_Pitch_Business.md` — narrativa.

As cinco sínteses de chats antigos são fontes históricas auxiliares. Suas informações úteis, contradições e decisões superadas estão consolidadas aqui.
