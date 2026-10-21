# Sprint 4 — roteiro técnico de vídeo e conteúdo dos slides

**Duração planejada: 4min50s; limite absoluto: 5min.** Os dez segundos restantes absorvem transições. O vídeo demonstra a entrega final por duas jornadas conectadas: o motorista realiza uma recarga; o gestor acompanha a mesma sessão e interpreta energia e risco. O diferencial da Sprint 4 é energia + IA + decisão explicável; o checkout e a operação já demonstrados na Sprint 3 aparecem apenas para completar a história.

Este arquivo entrega conteúdo, fala e sequência de execução. Os slides serão produzidos separadamente pela equipe. O [README](../../README.md) é o documento técnico completo; este roteiro seleciona apenas o que cabe no vídeo. O vídeo final ainda não foi gravado/publicado nesta entrega.

## Mapa de tempo e mídia

| Tempo | Duração | Imagem principal | Objetivo |
| --- | ---: | --- | --- |
| 0:00–0:20 | 20s | Slide 1 | Problema, público e solução |
| 0:20–0:40 | 20s | Slide 2 | Arquitetura e diferença entre sprints |
| 0:40–1:15 | 35s | PWA | Descoberta, condições e autorização |
| 1:15–1:40 | 25s | Admin + laboratório | Mesma sessão e início automático |
| 1:40–2:20 | 40s | Energia e demanda | Balanço e uso da geração solar |
| 2:20–2:40 | 20s | Slide 3 | Como a IA foi construída e avaliada |
| 2:40–3:35 | 55s | Laboratório + Energia e demanda | Cenário de risco, previsão e decisão |
| 3:35–4:15 | 40s | PWA + laboratório + Admin | Encerramento, comprovante e conciliação |
| 4:15–4:35 | 20s | Dashboard / Sessões | Resultado compartilhado da jornada |
| 4:35–4:50 | 15s | Slide 4 | Contribuição, limites e entrega |

Sistema ocupa 3min35s; slides, 1min15s. A tela da PWA aparece por cerca de 55s no total (35s no começo e cerca de 20s no encerramento). Não demonstrar fila, criação de conta, configuração de tarifa ou todos os menus neste vídeo.

## Preparação fora da gravação

1. Executar o [setup do README](../../README.md#pré-requisitos) e manter a API contínua em um único processo. Abrir PWA em viewport móvel e Admin em desktop; ocultar notificações pessoais, chaves, e-mails reais e detalhes desnecessários do provedor.
2. Usar dados e identidade de demonstração, cartão Stripe test `4242 4242 4242 4242`, validade futura e CVC de teste. Entrar previamente na PWA e no Admin Aurora (`aurora@teste.com` / `teste`). Não gravar a digitação de senha nem a configuração do `.env`.
3. Usar a base local de demonstração. **Não pressionar “Reiniciar dados de teste” em uma base com registros a preservar**: esse controle apaga sessões, pagamentos, fila e telemetria. Se necessário, configurar outra pasta em `CHARGEGRID_DATABASE_PATH` antes de iniciar a API e conferir os dados antes de gravar.
4. Abrir quatro abas: PWA; Admin em ChargeGrid → Operação; Laboratório de hardware (`/admin`); Admin em Energia e demanda. Abrir Sessões/financeiro quando necessário. Confirmar os nomes no build usado no ensaio; os títulos abaixo correspondem aos componentes atuais.
5. No laboratório, aplicar **Excedente solar** com “Aplicar cenário”; confirmar telemetria fresca e `AURORA-01` disponível. Preparar potência de conexão de 7 kW. O perfil tem FV 30 kW e carga-base 8 kW. Não conectar antes da autorização na sequência filmada.
6. Ensaiar uma sessão completa: descoberta → oferta → autorização → conexão → carga → stop → desconexão → liquidação → comprovante. Conferir que PWA e Admin têm o mesmo código de sessão e carregador. Usar limite suficiente, por exemplo R$ 20,00, e não deixar a recarga atingir o teto antes do trecho de encerramento.
7. Conferir Maps real com cota/origem válidas. Usar cartão, pois Pix não tem a mesma evidência final. O custo de captura deve ser **pelo menos R$ 0,50**: a 7 kW e R$ 1,90/kWh são aproximadamente 2min16s de carga. Conferir a tarifa e o custo reais na tela; não depender apenas desse cálculo. Se não atingir o mínimo no tempo da tomada, gravar trechos com corte identificado como “alguns minutos depois”; nunca acelerar o relógio da API ou inventar valores.
8. Ensaiar “Rampa de demanda” e observar os resultados disponíveis no equipamento de gravação. A aplicação do cenário prepara histórico **simulado** para a previsão; não equivale a 24 horas de medição física. Confirmar modelo/validade e registrar os valores que de fato aparecem. Não prometer que um estado específico acontecerá no segundo exato do roteiro.
9. Capturar trechos de contingência no próprio sistema durante o ensaio, com cenário e dados de teste equivalentes. Se houver corte, indicar a passagem de tempo. Se a previsão estiver indisponível, mostrar o motivo; não substituir por um número estático apresentado como resultado ao vivo.
10. Fazer um ensaio com cronômetro. A fala admite pausas para os cliques; não ler tabelas inteiras. Encerrar em 4min50s. A configuração, os carregamentos longos e a troca de aplicações são candidatos a cortes; os estados de autorização, início, decisão e conclusão precisam continuar compreensíveis.

## Roteiro sincronizado

### 0:00–0:20 — slide 1: por que o ChargeGrid existe

**Mostrar:** título e problema do slide 1. Sem abrir telas ainda.

**Fala:**

> “No desafio GoodWe, desenvolvemos o ChargeGrid Intelligence para conectar recarga comercial e energia. O estabelecimento precisa atender motoristas, cobrar e conciliar os veículos com o consumo do prédio e a geração solar. Reunimos uma PWA para o motorista e um dashboard para o gestor.”

**Transição:** “Vamos acompanhar a mesma recarga pelas duas jornadas.”

### 0:20–0:40 — slide 2: integração e evolução

**Mostrar:** diagrama simples do slide 2; destacar a ligação dos dois frontends à mesma API/banco.

**Fala:**

> “A Sprint 3 integrou a jornada comercial. A Sprint 4 aprofunda energia, previsão e decisão. As duas interfaces usam a mesma API e banco persistente. O Stripe funciona em teste; o laboratório simula o hardware GoodWe. A sessão e as regras ficam no backend.”

### 0:40–1:15 — PWA: o motorista solicita a recarga

**Execução:**

1. 0:40–0:48: na descoberta, selecionar o Hub Solar Aurora pelo mapa/lista e abrir o detalhe.
2. 0:48–0:57: selecionar `AURORA-01`; mostrar disponibilidade e condições/preço da oferta.
3. 0:57–1:10: aceitar as condições e autorizar o limite pelo checkout Stripe de teste. Cortar a digitação repetitiva de cartão se necessário, preservando a confirmação visível.
4. 1:10–1:15: mostrar a sessão aguardando conexão e o código do carregador.

**Fala:**

> “O motorista encontra o Aurora, escolhe o carregador disponível e consulta as condições antes de aceitar. A autorização do limite é feita pelo Stripe em sandbox. Com o pagamento autorizado, a sessão fica aguardando conexão. Esse registro já está no backend: o gestor acompanha a mesma operação, sem cadastrar a recarga novamente.”

**Evidência:** mesmo Aurora/AURORA-01 na PWA e no próximo trecho. Não entrar no dashboard do Stripe: ele consumiria tempo sem avançar a jornada.

### 1:15–1:40 — gestor: início automático e observação

**Execução:**

1. 1:15–1:23: em ChargeGrid → Operação, selecionar `AURORA-01` e mostrar a sessão aguardando conexão.
2. 1:23–1:31: alternar para o Laboratório de hardware; no cartão `AURORA-01`, confirmar potência de 7 kW e clicar **Conectar veículo**.
3. 1:31–1:40: voltar à Operação e mostrar estado de recarga, potência e início da acumulação. Não clicar em um “início” manual que substitua a automação.

**Fala:**

> “No Admin aparece a mesma sessão. Aqui simulamos somente a conexão do veículo. Como a autorização financeira já existe, o backend inicia a recarga automaticamente. Potência, energia e custo avançam no servidor; as telas apenas acompanham. Isso mantém o estado coerente mesmo após fechar ou recarregar o navegador.”

### 1:40–2:20 — gestor: energia durante a recarga

**Execução:**

1. 1:40–1:50: abrir **Energia e demanda** do Aurora; mostrar a sessão ativa e a leitura atual.
2. 1:50–2:07: destacar geração solar, carga-base, carga EV e importação/exportação. O perfil aplicado antes da gravação é **Excedente solar**.
3. 2:07–2:20: mostrar demanda/margem, política e motivo da decisão. Não trocar para uma planta sem vertical integrada.

**Fala:**

> “A novidade é relacionar essa recarga ao balanço da planta. No cenário simulado, temos geração solar, consumo do prédio e carga dos veículos. A rede cobre o déficit; o excedente pode ser exportado. Potência é mostrada em quilowatts, enquanto energia acumula em quilowatt-hora. A atribuição solar é calculada depois da carga-base. O gestor vê a margem e o motivo da decisão, com a origem simulada explícita.”

**Evidência:** ler os números presentes, sem decorar um total que depende de quantos EVs estão ativos. No caso de 30 kW FV, 8 kW base e um EV de 7 kW, o balanço instantâneo esperado é 0 kW importados e 15 kW exportados; isso não é economia de fatura nem medição física.

### 2:20–2:40 — slide 3: o que a IA prevê

**Mostrar:** fluxo e métricas do slide 3; evitar uma tabela com todas as rodadas.

**Fala:**

> “A IA prevê o pico de importação da próxima hora. Comparamos modelos em dados compostos de edifício, veículos e solar, separando treino, validação e teste no tempo. O Ridge Delta reduziu o erro médio de 5,32 para 4,62 quilowatts: benchmark simulado, sem validação operacional no Aurora.”

### 2:40–3:35 — gestor: cenário de risco e decisão explicável

**Execução:**

1. 2:40–2:48: no laboratório, selecionar **Rampa de demanda** e clicar **Aplicar cenário**. Mostrar confirmação; não reiniciar os dados da sessão.
2. 2:48–3:05: voltar a **Energia e demanda**; comparar importação e margem atuais com o cenário solar. A rampa cresce com o relógio: mostrar o valor observado, sem esperar obrigatoriamente o fim da rampa.
3. 3:05–3:22: mostrar o painel **Previsão de demanda**, incluindo valor escalar, horizonte de 60 minutos, modelo, origem e validade.
4. 3:22–3:35: mostrar **Motivo e evidências da decisão** e a política. Se o resultado indicar risco crítico, destacar a restrição de novos inícios; não dizer que a IA parou a recarga em andamento.

**Fala:**

> “Agora aplicamos uma rampa de demanda, também simulada. O consumo do prédio cresce e a geração solar é menor. A API atualiza telemetria, previsão e evidências. Aqui separamos três informações: medição atual, pico previsto e política de admissão. O modelo estima; o motor de decisão verifica validade e compara o resultado com os limites do estabelecimento. Risco crítico pode impedir novas admissões. A previsão não envia comando de parada para a sessão ativa. Se os dados estiverem desatualizados ou insuficientes, a interface informa indisponibilidade, sem inventar uma previsão.”

**Verificação:** o “limiar do forecast” é do benchmark; não chamá-lo de limite contratado da planta. Não apresentar MAE/RMSE históricos como confiança do valor atual. Não exigir uma parada automática para “provar IA”.

### 3:35–4:15 — motorista e gestor: encerramento da mesma sessão

**Execução:**

1. 3:35–3:45: PWA, sessão atual: mostrar energia e custo, conferir mínimo de R$ 0,50 e encerrar a entrega de energia.
2. 3:45–3:53: laboratório, `AURORA-01`: emitir **Desconectar veículo** após a confirmação de energia encerrada. Se a política reativa tiver encerrado a entrega antes, mostrar esse estado e prosseguir, explicando o motivo; não atribuir a parada ao forecast.
3. 3:53–4:03: PWA: confirmar retirada/liquidação conforme o estado mostrado e abrir o comprovante final. Aguardar confirmação do servidor, sem afirmar sucesso financeiro enquanto estiver pendente.
4. 4:03–4:15: Admin → Sessões / Resumo financeiro: localizar a mesma sessão, apontar valor final e situação capturada; mostrar carregador liberado.

**Fala:**

> “Voltamos ao motorista para concluir a mesma jornada. A entrega de energia termina; depois confirmamos a desconexão e a liquidação. O comprovante vem do servidor. No Admin, encontramos a mesma sessão e o pagamento capturado, com o carregador liberado. Encerramento físico e conclusão financeira são estados distintos, evitando apresentar uma cobrança pendente como concluída.”

### 4:15–4:35 — resultado visível no sistema

**Execução:** mostrar Dashboard com período que inclua a sessão ou manter o detalhe/Sessões se o agregado ainda não tiver atualizado. Apontar energia e valor persistidos; não navegar por todos os cards. Mostrar a explicação de indisponibilidade ambiental se estiver no enquadramento.

**Fala:**

> “Atendimento, operação e energia usam os mesmos registros. Os indicadores mostram dados persistidos no período. CO₂ evitado e economia continuam indisponíveis: faltam fatores e uma base tarifária adequada. O resultado demonstrado é uma jornada coerente, com visibilidade energética e decisão rastreável.”

### 4:35–4:50 — slide 4: fechamento

**Mostrar:** contribuição e limites do slide 4; referência ao repositório.

**Fala:**

> “A Sprint 4 entrega jornada integrada, energia e previsão explicável, com execução e testes documentados. Pagamento é sandbox; hardware é simulado. A próxima etapa é validar na infraestrutura GoodWe real. ChargeGrid: recarga conectada à gestão de energia.”

**Fim:** encerrar em 4:50; não incluir créditos longos após a fala. Equipe pode aparecer no slide final sem leitura dos nomes.

## Conteúdo de cada slide

### Slide 1 — ChargeGrid Intelligence: problema e proposta

- Projeto final / Sprint 4 / GoodWe / FIAP.
- Problema: atender vários motoristas conciliando disponibilidade, cobrança e demanda energética.
- Público: motorista e estabelecimento; contexto do ecossistema GoodWe.
- Proposta: PWA do motorista + dashboard do gestor sobre uma operação compartilhada.

**Sincronização:** 0:00–0:20. Não atribuir ao SEMS+ falhas não comprovadas nem afirmar integração oficial.

### Slide 2 — Uma jornada, duas interfaces, um núcleo

- Diagrama: `PWA ↔ API ↔ banco PGlite` e `Admin ↔ API`; `Stripe test ↔ API`; `Laboratório/MockGoodWe ↔ API`.
- Na API: sessão, pagamento, medição, fila e regras; contratos TypeScript compartilhados.
- Sprint 3: jornada comercial compartilhada.
- Sprint 4: energia + previsão + decisão explicável + refinamentos de interface.
- Legenda: software/persistência executáveis; pagamento sandbox; hardware/telemetria simulados.

**Sincronização:** 0:20–0:40. Usar no máximo esses blocos; não mostrar diagrama conceitual com bateria como se estivesse implementada.

### Slide 3 — IA para antecipar risco de demanda

- Pergunta: “Qual será o pico de importação da rede nos próximos 60 minutos?”
- Fluxo: série composta → divisão temporal 60/20/20 → comparação → Ridge Delta → inferência Node → validação pela política.
- Dados: edifício EULP/ComStock + EV NREL Workplace Charging + solar PVDAQ; fontes independentes, `SIMULATED_COMPOSITE`.
- Resultado de teste: MAE persistência **5,32 kW** → Ridge Delta **4,62 kW** (redução aproximada de 13,3%).
- Nota: benchmark acadêmico; não validado em instalação real; IA não comanda hardware.

**Sincronização:** 2:20–2:40. Não usar “84,6% de acurácia”: F1 0,8461 é outra métrica. Fonte: [model card](../ai/model-card.md).

### Slide 4 — Entrega final e limites

- Entregue: jornada completa; energia persistida; previsão integrada; política e evidências compartilhadas.
- README final: como executar, arquitetura, evolução das sprints, resultados e testes.
- Limites: Stripe sandbox; GoodWe/HCA G2 simulados; sem bateria operacional ou economia/CO₂ comprovados.
- Próxima etapa: telemetria representativa e homologação na infraestrutura real.
- Repositório: `github.com/PtiagoM/Charge-Grid-Intelligence`.
- Equipe: Tiago Pimentel Muniz (574148), Gustavo Curis de Francisco (569704), Caio César Portela França (573127), Lourenço Borges da Silva (569515), Davi Teodoro Novais (571022).

**Sincronização:** 4:35–4:50. A equipe aparece sem consumir fala adicional.

## Conferência final da gravação

- Total exportado até 5:00, incluindo abertura, transições e encerramento.
- Uma única sessão reconhecível do pedido ao comprovante; mesma identificação nas interfaces.
- Energia e IA recebem o maior destaque; PWA não domina o vídeo.
- Valores e estado filmados correspondem à fala; cortes de tempo são identificados.
- Simulação física, sandbox financeiro e benchmark composto declarados.
- O vídeo mostra ações e efeitos; slides apoiam a explicação sem substituir a demonstração.
- Incluir o link do vídeo final no README somente após upload; o link histórico da Sprint 3 permanece rotulado.
