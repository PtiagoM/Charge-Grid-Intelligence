# Regras do Driver PWA

Estas instrucoes complementam o `AGENTS.md` da raiz e se aplicam a tudo em `apps/driver-pwa`.

- Trabalhe no produto movel em `codex/driver-pwa-mobile` ou em uma branch `feature/pwa-*` derivada dela.
- Nao altere `apps/admin-web` em tarefas exclusivas do PWA.
- Preserve comportamento instalavel, rotas diretas, manifest, service worker e compatibilidade com deploy de preview.
- Pagamentos, sessoes, filas e autenticacao que dependam da API devem ser validados em conjunto com `apps/api`.
- Mudancas em contratos compartilhados exigem build do Admin, PWA e API.
- Antes do PR, execute pelo menos o build do PWA, testes relacionados e lint. Antes da integracao em `main`, execute a bateria completa do monorepo.
- Nao inclua secrets, tokens, chaves de mapas ou credenciais em commits, logs ou artifacts.

