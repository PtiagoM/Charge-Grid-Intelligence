# Contribuindo

Leia [docs/DEVELOPMENT_WORKFLOW.md](docs/DEVELOPMENT_WORKFLOW.md) antes de criar uma branch ou Pull Request. Agentes de IA tambem devem obedecer aos arquivos `AGENTS.md` da raiz e do aplicativo alterado.

## Principios

- Nunca desenvolva diretamente na `main`.
- Use branches focadas: `feature/admin-*`, `feature/pwa-*`, `fix/*`, `chore/*` ou `docs/*`.
- Toda feature deve ter especificacao em `docs/specs/<nome>` antes de alterar comportamento relevante.
- Prefira PRs pequenos, testaveis e com uma responsabilidade clara.
- Nao misture mudancas de Admin e PWA sem uma necessidade de integracao documentada.
- Nao renomeie enums nem altere contratos compartilhados sem revisar Admin, PWA, API, demo e documentacao.
- Nao adicione dependencias ou abstracoes sem uma necessidade atual e justificavel.
- Regras criticas de sessao, pagamento, tarifa, fila, ociosidade, demanda e comandos pertencem a API, nao aos frontends.
- Capacidade simulada deve continuar identificada como simulada; nao alegue integracao real GoodWe, gateway ou IA.

## Antes de publicar

1. Revise o diff e os arquivos preparados.
2. Execute a validacao proporcional ao escopo.
3. Use Conventional Commits com o produto no escopo.
4. Abra Pull Request usando o template do repositorio.
5. Aguarde os checks e a decisao humana de merge.

