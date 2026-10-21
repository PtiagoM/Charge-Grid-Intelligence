# Prompts de geracao — ChargeGrid Operacao v1

Modo utilizado: ferramenta `image_gen` integrada. A imagem conceitual ChargeGrid foi usada como referencia de composicao; os assets SEMS+ existentes do carregador e do veiculo foram usados como referencias de produto.

## 01 — Fundo

Render 3D panoramico de um ambiente interno premium de recarga, vazio, com parede modular grafite, piso tecnico escuro, luzes superiores branco-quente e baixo contraste. Camera frontal elevada igual ao conceito aprovado. Bordas visualmente repetiveis. Sem vagas, batentes, carregadores, carros, cabos, textos, logos, UI ou brilhos coloridos.

## 02 — Vaga

Um unico modulo simetrico de vaga em render 3D, isolado: painel grafite de parede, luz superior branca, piso tecnico em perspectiva e batente baixo. Camera frontal elevada e materiais coerentes com o fundo. Fundo realmente transparente. Sem contorno colorido, simbolo, carregador, veiculo, cabo, texto ou UI.

## 03 — Corpo do carregador

Carregador veicular branco e grafite inspirado no asset GoodWe fornecido, adaptado para a camera e iluminacao da vaga. Somente o corpo, recorte transparente, inteiro e centralizado. Sem cabo, conector, LED colorido, halo, texto, logo, parede, piso ou veiculo.

## 04 — Cabo recolhido

Cabo de recarga preto fosco e conector guardado, em loop compacto e plausivel, alinhado a metade inferior do corpo do carregador. Somente cabo e conector em fundo transparente. A extracao final removeu o suporte gerado na primeira tentativa.

## 05 — Cabo conectado

Cabo de recarga preto fosco com curva em S, partindo do carregador central superior e chegando a porta dianteira direita do veiculo. Somente cabo e conector em fundo transparente, com folga realista e sem cortes. Sem carro, carregador, piso ou cor de estado.

## 06 — Veiculo

Veiculo eletrico crossover branco generico e sem marca, vista frontal elevada, corpo completo, espelhos visiveis e porta de carga discretamente marcada no paralama dianteiro direito. Iluminacao branco-quente compativel com a estacao. Fundo realmente transparente. Sem cabo, vaga, texto, logo ou luz de estado.

## 07 — Palco operacional neutro com seis vagas

Panorama opaco de uma estacao premium de recarga, seguindo de perto a composicao da referencia ChargeGrid. Exatamente seis vagas completas e seis carregadores identicos, centralizados e renderizados em uma unica camera frontal elevada. Parede modular grafite, divisorias verticais, luz branco-quente sobre cada carregador, piso tecnico escuro, vagas trapezoidais e batentes. Sem carros, cabos, cores de estado, simbolos, textos, identificadores, cards, navegacao, logos ou UI. A geometria deve formar um unico ambiente continuo e fornecer ancoras previsiveis para camadas dinamicas no frontend.

Esta geracao substitui a vaga isolada como direcao principal porque elimina as quebras de perspectiva que ocorreriam ao repetir o arquivo 02 lado a lado.

## 08 — Palco intermediario com cinco vagas

Geracao com exatamente cinco vagas e cinco carregadores neutros, usando o conceito completo como referencia. Parede modular grafite, luzes superiores, piso tecnico, contornos trapezoidais neutros e uma unica perspectiva panoramica. Sem carros, cabos, cores, simbolos, textos ou UI. O resultado corrigiu a quantidade de vagas, mas permaneceu regular demais em comparacao ao close-up.

## 10 — Edicao neutra do close-up

Modo `precise-object-edit`. O close-up `CHARGEGRID-OPERATIONS_ESTABLISHMENT-ADMIN_1223x396_SPOT-CAROUSEL-CLOSEUP.png` foi usado como alvo. Foram removidos carros, cabos conectados, cards, textos, setas, cores de estado, simbolos de piso e selecao. Paredes, piso, cinco carregadores, batentes, iluminacao, camera e perspectiva foram preservados. As faixas coloridas foram substituidas por guias grafite neutras no mesmo percurso para receber `paths` SVG no frontend.

## Carros e cabos

Os novos carros gerados nao foram mantidos porque o fundo quadriculado foi rasterizado e a extracao posterior nao produziu alfa real. A direcao final usa o asset transparente oficial do SEMS+, instanciado e transformado por vaga. Cabos conectados e contornos de estado nao sao bitmaps: serao desenhados como curvas SVG calibradas para cada vaga.

## Extracao de fundo

Nos assets da vaga e do veiculo, o primeiro resultado desenhou o padrao quadriculado em pixels. Uma segunda passagem de `background-extraction` removeu todo o quadriculado, preservou geometria, materiais, sombras e camera, e produziu canal alfa real. Corpo e cabos tambem foram verificados quanto ao alfa antes da entrega.
