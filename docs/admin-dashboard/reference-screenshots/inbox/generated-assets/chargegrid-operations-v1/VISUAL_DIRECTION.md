# Direcao visual — ChargeGrid Operacao v1

Pacote de validacao para o palco operacional de vagas da planta comercial. Estes arquivos ainda nao sao assets publicaveis e nao devem ser integrados ao Admin antes da aprovacao visual.

## Sistema comum

- Estilo: render 3D de produto com realismo controlado, coerente com o conceito aprovado e com o tema escuro do SEMS+.
- Camera: frontal elevada, lente longa moderada, pouca distorcao; o carregador aparece ao fundo e o veiculo ocupa a metade inferior da vaga.
- Ponto de fuga: central no eixo vertical de cada vaga.
- Iluminacao: ambiente escuro neutro, luz superior branca quente e sombras macias; nenhuma cor de estado embutida.
- Materiais: parede grafite fosca, piso tecnico preto/cinza, metal pintado e borracha sem reflexos excessivos.
- Composicao: sem textos, logos adicionados, badges, icones ou indicadores de interface.
- Estados: verde, azul, amarelo, vermelho e cinza serao aplicados posteriormente com CSS/SVG.
- Encaixe: carregador, cabos e veiculo devem compartilhar perspectiva, escala e pontos de conexao.

## Direcao revisada — palco panoramico

Depois da primeira validacao, o modulo de vaga isolado deixou de ser a direcao principal. A perspectiva propria do arquivo `02-charging-spot-base.png` nao permite repetir varias unidades lado a lado sem produzir quebras visuais.

A composicao recomendada passa a usar `10-operation-stage-closeup-neutral-5-bays.png`: uma edicao direta do close-up aprovado, com cinco vagas e cinco corpos de carregador neutros preservados na perspectiva da referencia. A imagem fixa resolve somente a arquitetura e o alinhamento. Veiculos, cabos conectados, cores, simbolos, textos, selecao e controles continuam como camadas dinamicas determinadas pelo estado da aplicacao.

Os arquivos 02, 07 e 08 permanecem neste pacote apenas como historico das tentativas anteriores e nao devem orientar a implementacao principal.

## 01 — Fundo do cenario

Arquivo: `01-operation-background.png`

- Cena panoramica vazia, escura e horizontalmente repetivel.
- Somente parede modular, piso e luz ambiente.
- Sem vagas demarcadas, carregadores, carros, cabos, batentes ou luzes coloridas.
- Contraste baixo para nao competir com os slots.

## 02 — Modulo de vaga

Arquivo: `02-charging-spot-base.png`

- Uma unica vaga isolada em fundo transparente.
- Painel vertical de parede, luz superior branca, piso da vaga e batente.
- Geometria simetrica e modular para repeticao em carrossel.
- Sem contorno de estado, simbolo no piso, carregador, carro ou cabo.

## 03 — Corpo do carregador

Arquivo: `03-charger-body.png`

- Carregador veicular GoodWe branco e grafite, inspirado no asset oficial fornecido.
- Recorte transparente, vista frontal levemente superior.
- Sem cabo, conector, halo, LED colorido, texto ou sombra de cenario.
- Silhueta limpa para receber overlays de estado.

## 04 — Cabo recolhido

Arquivo: `04-cable-docked.png`

- Somente cabo preto e conector guardado, em fundo transparente.
- Alinhado ao corpo do carregador do arquivo 03.
- Curva compacta e fisicamente plausivel, sem tocar o veiculo.
- Sem brilho ou cor de estado.

## 05 — Cabo conectado

Arquivo: `05-cable-connected.png`

- Somente cabo preto conectado, em fundo transparente.
- Origem alinhada ao carregador do arquivo 03 e destino alinhado a lateral dianteira direita do veiculo do arquivo 06.
- Curva suave, com folga realista no piso, sem cortes nas extremidades.
- Sem carro, carregador, piso, brilho ou cor de estado.

## 06 — Veiculo

Arquivo: `06-charging-vehicle.png`

- Veiculo eletrico branco generico, sem marca, em fundo transparente.
- Vista frontal elevada e centralizada, coerente com o conceito aprovado.
- Porta de carga discretamente definida na lateral dianteira direita.
- Sem cabo, vaga, reflexo de piso, texto ou luz de estado.

## 07 — Palco operacional neutro

Arquivo: `07-operation-stage-neutral-6-bays.png`

- Panorama opaco e continuo, com seis vagas completas na mesma perspectiva.
- Seis carregadores neutros incorporados ao cenario, um para cada vaga.
- Parede modular grafite, iluminacao superior branco-quente, piso tecnico, delimitacao neutra e batentes.
- Sem veiculos, cabos, cores de estado, simbolos, identificadores, metricas ou controles.
- Cada vaga fornece um ponto previsivel para ancorar carro, cabo e overlays dinamicos.

## 08 — Palco intermediario com cinco vagas

Arquivo: `08-operation-stage-reference-5-bays.png`

- Segunda aproximacao, ja reduzida para cinco vagas.
- Corrigiu a repeticao modular, mas ainda regularizou demais a perspectiva da referencia.
- Mantido somente para comparacao; foi substituido pelo arquivo 10.

## 10 — Palco derivado do close-up aprovado

Arquivo: `10-operation-stage-closeup-neutral-5-bays.png`

- Candidato principal para validacao e futura implementacao.
- Derivado diretamente do close-up aprovado para preservar enquadramento, densidade, piso, paredes, carregadores e perspectiva.
- Cinco contornos neutros seguem a geometria das faixas coloridas da referencia.
- Sem carros, cabos conectados, cores de estado, cards, labels, setas ou simbolos de piso.
- Resolucao ampla para recorte e redimensionamento responsivo sem perda visivel.

## Veiculos por vaga

Cada uma das cinco posicoes visuais possui agora um asset transparente proprio, publicado em `apps/admin-web/public/assets/sems/chargegrid/vehicle-bay-a01.png` ate `vehicle-bay-a05.png`. Os angulos progridem de extrema esquerda a extrema direita e nao devem receber `skew` artificial no CSS.

O veiculo somente aparece quando a telemetria confirma `vehicleConnected` ou um estado de conector que necessariamente confirma conexao (`CONNECTED` ou `CHARGING`). Presenca visual nunca pode ser inferida apenas por existir uma sessao, autorizacao ou reserva.

## Cenarios demonstrativos

- A tela abre em `Ocupacao completa`, um cenario derivado em memoria com oito carregadores conectados para validar os cinco angulos e o carrossel.
- O seletor `Telemetria normal` retorna aos carregadores, sessoes e estados persistidos da planta.
- O cenario demonstrativo nao altera a fixture principal nem o `localStorage` e mantém comandos operacionais desativados.
- Com mais de cinco vagas, as setas, as teclas direcionais e o gesto horizontal de trackpad deslocam uma vaga por vez; selecao e deslocamento permanecem interacoes distintas.

## Estado visual do palco

- Os contornos coloridos em SVG foram retirados porque a perspectiva rasterizada do piso nao permitiu alinhamento consistente em todos os viewports.
- Cabos vetoriais e LEDs coloridos sobre o carregador tambem permanecem fora da composicao.
- O estado continua identificavel pelo card textual, pela selecao do slot e pelo simbolo discreto no piso quando nao existe veiculo.
- A cor nunca substitui o label humano do estado.

## Camadas previstas no frontend

1. palco panoramico neutro com cinco vagas e carregadores;
2. simbolo de estado no piso quando a vaga nao possui veiculo;
3. asset do veiculo correspondente a posicao visual, somente com conexao confirmada;
4. textos, metricas, selecao e controles em HTML.

## Encaixe previsto no slot

O palco principal fornece cinco ancoras visuais. As coordenadas dos veiculos sao aferidas sobre o arquivo 10, mantendo o deslocamento do carrossel separado da selecao do carregador.

As proporcoes abaixo sao o ponto de partida para as camadas dinamicas; os arquivos mantem resolucao propria e nao devem ser esticados para o mesmo tamanho.

- `10-operation-stage-closeup-neutral-5-bays`: ocupa toda a area do palco e define a geometria compartilhada.
- `03-charger-body`: nao e necessario sobre o palco principal, pois os corpos neutros ja fazem parte do arquivo 07; permanece util para detalhes isolados.
- `vehicle-bay-a01` a `vehicle-bay-a05`: centralizados na respectiva posicao visual, sem distorcao adicional; quando o carrossel avanca, o asset segue a posicao visivel e nao o numero absoluto da vaga.
- O simbolo de piso nao faz parte do bitmap e acompanha o estado pelo frontend.

## Arquivos gerados nesta versao

| Arquivo | Dimensao | Fundo |
| --- | ---: | --- |
| `01-operation-background.png` | 1672 x 940 | opaco |
| `02-charging-spot-base.png` | 1122 x 1402 | transparente |
| `03-charger-body.png` | 1024 x 1536 | transparente |
| `04-cable-docked.png` | 1024 x 1536 | transparente |
| `05-cable-connected.png` | 1024 x 1536 | transparente |
| `06-charging-vehicle.png` | 1145 x 1374 | transparente |
| `07-operation-stage-neutral-6-bays.png` | 1672 x 940 | opaco |
| `08-operation-stage-reference-5-bays.png` | 1672 x 940 | opaco |
| `10-operation-stage-closeup-neutral-5-bays.png` | 2204 x 713 | opaco |

## Criterios de validacao

- O palco apresenta cinco vagas completas e coerentes com a perspectiva do close-up aprovado.
- Os cinco carregadores estao centralizados em suas respectivas vagas.
- Cada veiculo cabe integralmente na vaga e respeita o angulo da sua posicao visual.
- Vagas sem conexao confirmada permanecem sem veiculo, mesmo que exista autorizacao ou historico de sessao.
- Nenhum cabo vetorial e desenhado sobre o palco.
- Nenhum contorno colorido e sobreposto as linhas neutras do piso.
- As silhuetas permanecem legiveis em aproximadamente 240 a 300 px de largura por slot.
- Nenhum asset carrega informacao de estado que deveria vir do frontend.
