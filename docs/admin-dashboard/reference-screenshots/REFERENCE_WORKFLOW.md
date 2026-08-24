# Workflow continuo de referencias visuais

Este fluxo permite reconstruir o Admin em ciclos curtos enquanto novas referencias do SEMS+ sao adicionadas.

1. O usuario adiciona prints e downloads brutos em `inbox/`, sem precisar organizar nomes ou pastas.
2. O agente identifica perfil, tela, viewport, estado e funcao do asset.
3. Arquivos identificados sao movidos para `inbox/catalogued/` e recebem nomes descritivos no padrao registrado no `README.md`.
4. O `MANIFEST.md` e atualizado sem reproduzir dados pessoais visiveis nas capturas.
5. Somente assets necessarios e publicaveis sao copiados para `apps/admin-web/public/assets/sems/`; prints brutos permanecem locais e ignorados pelo Git.
6. Uma tela entra em implementacao quando houver referencia suficiente para definir sua composicao principal. Estados internos podem ser refinados em rodadas seguintes.
7. A camada ChargeGrid deve aparecer dentro da linguagem do SEMS+, preservando capacidades, regras de dominio e rastreabilidade existentes.
8. Durante esta fase, a validacao usa build, lint, testes unitarios de dominio quando afetado e E2E focal das jornadas alteradas. Nao criar snapshots ou baselines visuais antes da aprovacao explicita do produto.

Quando um asset essencial estiver ausente, o agente registra a lacuna e solicita apenas o arquivo especifico necessario, sem bloquear outras telas que ja possuam evidencia suficiente.
