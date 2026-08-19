# Contribuindo

- Use branches focadas: `feat/driver-*`, `feat/admin-*`, `feat/session-*`, `feat/goodwe-*`, `feat/payment-*`, `feat/ai-*`, `fix/*` ou `chore/*`.
- Toda feature deve ter spec em `docs/specs/<nome>` antes de alterar comportamento.
- Prefira PRs pequenos, testáveis e com uma responsabilidade clara.
- Não renomeie enums nem altere contratos compartilhados sem revisar Admin, PWA, API, demo e documentos superiores.
- Não adicione dependências ou abstrações sem uma necessidade atual e justificável.
- Regras críticas de sessão, pagamento, tarifa, fila, ociosidade, demanda e comandos pertencem à API, não aos frontends.
- Capacidade simulada deve continuar identificada como simulada; não alegue integração real GoodWe, gateway ou IA.
