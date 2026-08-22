# Fluxos observados e testados

## Autenticação e troca de papel

```text
ABRIR LOGIN → AUTENTICAR → DASHBOARD → MENU DA CONTA → IDENTIFICAR PAPEL → LOGOUT NORMAL
```

- Conta A: login automatizado autorizado, papel `Distribuidor/Instalador`, logout pela interface.
- Conta B: login manual realizado pelo usuário, papel `Proprietário`, sessão preservada ao final.

## Navegação global

```text
SIDEBAR → PÁGINA-RAIZ → FILTROS/TABS → LISTA OU EMPTY STATE
```

Confirmado para plantas, dispositivos, alarmes, relatórios e ferramentas analíticas.

## Navegação contextual de planta

```text
LISTA DE USINAS → PLANTA → TABS CONTEXTUAIS → DISPOSITIVO → DETALHE DO DISPOSITIVO
```

Executado apenas em leitura na conta A. Query strings e identificadores foram removidos da documentação.

## Comparação entre papéis

```text
PAPEL A → INVENTÁRIO VISÍVEL → LOGOUT → PAPEL B → MESMAS ROTAS SEGURAS → COMPARAR ESCOPO
```

Resultado: shell global equivalente, porém dados e configuração efetiva diferentes.

## Mutações

Na Fase 1 não houve mutação. Na Fase 2 foram exercitados apenas dados próprios e fictícios.

### Criar planta comercial

```text
AÇÃO: Nova usina
→ ESTADO ANTERIOR: Proprietário com duas plantas de teste e nenhum dispositivo
→ RESULTADO: wizard Localização → Dados → Organização
→ ESTADO POSTERIOR: CG_ANALYSIS_20260822_F2, Usina C&I, Em construção, sem dispositivo
→ PRÓXIMA AÇÃO: abrir detalhe ou adicionar dispositivo
```

### Validar EV Charger inexistente

```text
AÇÃO: selecionar Carregador veicular + método SN e enviar identificador fictício
→ ESTADO ANTERIOR: planta CG_ANALYSIS_* sem dispositivos
→ RESULTADO: "O tipo de equipamento atual não é suportado"
→ ESTADO POSTERIOR: planta continua sem dispositivos
→ PRÓXIMA AÇÃO: corrigir identificação ou cancelar
```

### Excluir planta própria

```text
AÇÃO: Operações → Excluir → Confirmar
→ ESTADO ANTERIOR: uma planta CG_ANALYSIS_* filtrada e sem dispositivos
→ RESULTADO: toast "Operação realizada com sucesso"
→ ESTADO POSTERIOR: nova pesquisa retorna Todos (0) e Sem dados
→ PRÓXIMA AÇÃO: nenhuma; limpeza concluída
```

### Compartilhar planta — somente leitura do fluxo

```text
Compartilhar → usuário/organização → monitoramento/controle → prazo → salvar
```

O formulário foi aberto e cancelado; nenhum destinatário foi informado e nenhum compartilhamento foi criado.

### Gerar/baixar relatório

```text
Central de relatórios → selecionar planta → estatístico/operacional → ação de download → Tarefa de download
```

A página de tarefas confirma processamento assíncrono, mas a associação causal entre um clique específico e uma linha específica não foi registrada.
