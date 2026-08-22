# Navegação

## Shell global

`OBSERVED` — confiança alta.

- sidebar escura recolhível com sete entradas-raiz;
- header com escopo/organização, busca, alarmes, atalhos, idioma e avatar;
- título de página no topo do conteúdo;
- tema escuro observado após autenticação e tema claro observado no login;
- menu da conta como popover, com papel, modo de visualização, configurações pessoais, downloads e logout.

## Navegação global

| Entrada | Rota segura | Relação |
| --- | --- | --- |
| Painel | `#/` | visão agregada da conta |
| Lista de usinas | `#/station_monitor` | entrada para detalhe contextual da planta |
| Lista de dispositivos | `#/device_monitor` | visão transversal por tipo de dispositivo |
| Central de alarmes | `#/alarm_center` | alarmes ativos e resolvidos |
| Central de relatórios | `#/report_center` | relatórios e downloads |
| Ferramentas de análise | submenu | três ferramentas especializadas |
| Centro de serviço | `#/sevices` | suporte, manuais, notícias e agente de IA |

## Navegação contextual

- O detalhe da planta é alcançado pela lista e usa tabs internas.
- O detalhe do dispositivo é alcançado a partir da planta e preserva o contexto da usina.
- A planta própria de teste apresentou a tab `Atualização do dispositivo`; a planta compartilhada em operação não apresentou essa tab.
- O app `SEMS+ Configuração` usa shell e rotas próprias sob `/configure/#/`.

## Diferenças por papel

- `Distribuidor/Instalador`: organização explícita no menu, opção do agente de IA e acesso observado a informações organizacionais, usuários e logs.
- `Proprietário`: menu mais simples; ao abrir o app de configuração, o conteúdo observado foi de assinaturas, sem a mesma gestão organizacional da conta A.
- Ambos: mesmo conjunto de sete entradas-raiz e acesso às três ferramentas de análise.

## Rotas e privacidade

Rotas contextuais continham identificadores codificados. A documentação conserva apenas o caminho base com `?<redacted>` e nunca registra query strings reais.

## Resultados do aprofundamento

- O tema muda globalmente sem alterar a rota e foi restaurado ao estado inicial após o teste.
- A criação usa breadcrumb `Lista de usinas / Nova usina` e uma página de sucesso intermediária.
- O CTA da página de sucesso leva diretamente a `Adicionar novo dispositivo` dentro do contexto da planta.
- A presença de uma planta C&I introduziu segmentação `Usina residencial`/`Usina C&I` no dashboard do Proprietário.
- Relatórios usam árvore lateral de seleção e tabs estatístico/operacional.
- `Tarefa de download` funciona como destino separado para trabalhos assíncronos.
- `Gestão da organização` é um menu expansível cujo submenu muda por papel.
