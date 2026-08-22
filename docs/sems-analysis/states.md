# Estados de interface observados

| Estado | Onde foi observado | Classificação/confiança |
| --- | --- | --- |
| autenticado | dashboards dos dois papéis | `OBSERVED`, alta |
| vazio / sem dados | dispositivos do Proprietário, alarmes, diagnóstico IV, bateria | `OBSERVED`, alta |
| populado | dashboard, plantas, dispositivos e alarmes resolvidos da conta A | `OBSERVED`, alta |
| em construção | quatro aparições de plantas próprias entre os papéis | `OBSERVED`, alta |
| em operação | planta compartilhada e inversor da conta A | `OBSERVED`, alta |
| dispositivo inativo | EV Charger | `OBSERVED`, alta |
| sem alarmes ativos | ambos os papéis | `OBSERVED`, alta |
| resolvido | histórico de alarmes da conta A | `OBSERVED`, alta |
| ação desabilitada | gerar comparação sem seleção; analisar bateria sem planta | `OBSERVED`, alta |
| conteúdo dependente de papel/escopo | configuração e planta compartilhada | `OBSERVED`, média |
| loading transitório | contadores inicialmente zerados antes de atualizar | `OBSERVED`, média |
| validação assíncrona pendente | botão Próximo inicialmente desabilitado após preenchimento | `TESTED IN SANDBOX`, alta |
| sucesso de criação | página dedicada `Usina criada com sucesso` | `TESTED IN SANDBOX`, alta |
| falha de dispositivo incompatível | mensagem explícita sem criar ativo | `TESTED IN SANDBOX`, alta |
| confirmação destrutiva | modal Dicas com Cancelar/Confirmar | `TESTED IN SANDBOX`, alta |
| sucesso de exclusão | toast e pesquisa posterior vazia | `TESTED IN SANDBOX`, alta |
| modo de seleção em lote | alarmes adicionam coluna de seleção; confirmação fica desabilitada sem itens | `TESTED IN SANDBOX`, alta |
| compartilhamento vazio | tabela `Sem dados` e CTA Compartilhar | `OBSERVED`, alta |
| relatório zerado | estrutura completa preservada sem geração/consumo | `OBSERVED`, alta |

Criação e exclusão foram confirmadas. Edição de planta, ativação, desativação e arquivamento permanecem `UNKNOWN`; não apareceu uma ação de arquivamento. A edição do EV compartilhado foi visível, mas não abriu formulário nem alterou a rota.

## Estados exigidos no módulo futuro

`INFERRED`, confiança alta a partir dos contratos vigentes. Estes estados não são alegações sobre o SEMS+.

| Domínio | Estados mínimos |
| --- | --- |
| carregador | técnico e comercial separados; disponível, ocupado, restrito, manutenção, falha, offline e desconhecido |
| sessão | criação, pagamento, autorização, início pendente, carregando, fim energético, ociosidade, liquidação, completo e exceções |
| fila | vazia, esperando, chamado, atribuído, expirado e saída |
| energia/demanda | normal, alerta, crítico, dado antigo, dado ausente e recuperação |
| pagamento | pendente, autorizado, pago, reembolso, falha, settlement pendente, disputa e saldo pendente |
| comando | não solicitado, solicitado, aceito, confirmado, falho, expirado e resultado desconhecido |
| incidente | aberto, atribuído, em tratamento, resolvido, duplicado e sem correlação |
| recomendação | disponível, baixa confiança, fallback, indisponível, aceita, adiada, rejeitada e expirada |

Todos os domínios também precisam de loading, vazio, erro, desabilitado, confirmação, sucesso e `FORBIDDEN` quando aplicável.
