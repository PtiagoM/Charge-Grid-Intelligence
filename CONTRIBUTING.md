# Contribuindo

Antes de alterar o projeto, leia [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md), [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) e a especificacao da area afetada. Agentes de IA tambem devem obedecer aos arquivos `AGENTS.md` da raiz e do aplicativo alterado.

## Principios

- Nunca desenvolva diretamente na `main`.
- Use branches focadas: `feature/admin-*`, `feature/pwa-*`, `fix/*`, `chore/*` ou `docs/*`.
- Toda mudanca comportamental deve atualizar a spec, os criterios de aceite e as decisoes relevantes.
- Prefira PRs pequenos, testaveis e com uma responsabilidade clara.
- Nao misture mudancas de Admin e PWA sem uma necessidade de integracao documentada.
- Nao renomeie enums nem altere contratos compartilhados sem revisar Admin, PWA, API, fixtures e documentacao.
- Nao adicione dependencias ou abstracoes sem uma necessidade atual e justificavel.
- Regras criticas de sessao, pagamento, tarifa, fila, ociosidade, demanda e comandos pertencem a API, nao aos frontends.
- Chaves secretas nunca entram em `VITE_*`, logs, commits ou exemplos preenchidos.
- Integracoes externas devem indicar sua maturidade real: sandbox, fixture local, mock de provider ou producao.
- A interface nao deve exibir rotulos tecnicos como "dados simulados"; essa informacao pertence a documentacao e aos testes.
- O mapa mobile permanece Google Maps real e o tema do PWA permanece claro por padrao enquanto essa decisao estiver vigente na spec.
- Capacidade simulada deve continuar identificada como simulada na documentacao; nao alegue integracao real GoodWe, gateway ou IA.

## Antes de publicar

1. Revise o diff e os arquivos preparados.
2. Execute lint, testes e build na proporcao do risco.
3. Use Conventional Commits com o produto no escopo.
4. Abra Pull Request usando o template do repositorio.
5. Aguarde os checks e a decisao humana de merge.
6. Preserve alteracoes locais nao relacionadas e mantenha commits pequenos, explicaveis e verificaveis.

