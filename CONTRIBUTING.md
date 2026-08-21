# Contribuindo

Antes de alterar o projeto, leia `docs/CURRENT_STATE.md` e a spec da área afetada.

- Use branches focadas: `feat/driver-*`, `feat/admin-*`, `feat/session-*`, `feat/goodwe-*`, `feat/payment-*`, `feat/ai-*`, `fix/*` ou `chore/*`.
- Toda mudança comportamental deve atualizar a spec, os critérios de aceite e as decisões relevantes.
- Não renomeie enums nem altere contratos compartilhados sem revisar Admin, PWA, API, fixtures e documentação.
- Regras críticas de sessão, pagamento, tarifa, fila, ociosidade, demanda e comandos pertencem à API.
- Chaves secretas nunca entram em `VITE_*`, logs, commits ou exemplos preenchidos.
- Integrações externas devem ser descritas com maturidade precisa: real em sandbox, fixture local, mock de provider ou produção.
- A UI não deve mostrar rótulos técnicos como “dados simulados”; essa informação pertence à documentação e aos testes.
- O mapa mobile permanece Google Maps real e o tema da PWA permanece claro por padrão.
- Antes do commit, execute `npm run lint`, `npm run test` e `npm run build` na proporção do risco.
- Preserve alterações locais não relacionadas e faça commits pequenos, explicáveis e verificáveis.
