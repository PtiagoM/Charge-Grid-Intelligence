# Critérios de aceite da Driver PWA

## Entrada e identidade

- [x] A raiz pública oferece escanear QR, criar conta e entrar.
- [x] Cadastro coleta motorista e veículo e respeita confirmação de e-mail Supabase.
- [x] Login, restauração e logout usam Supabase quando configurado.
- [ ] Perfis e veículos persistem em tabelas próprias protegidas por RLS.
- [ ] A API valida JWT e autorização para operações críticas.

## QR e visitante

- [x] Câmera lê QR ChargeGrid em contexto seguro.
- [x] Imagem e código manual funcionam quando a câmera não está disponível.
- [x] `/qr/:chargerSlug` apresenta local, vaga, potência, tarifa e ociosidade.
- [x] Visitante segue por checkout, sessão e comprovante sem cadastro.

## Mapa

- [x] Google Maps JavaScript API real substitui qualquer representação fictícia.
- [x] Seis plantas, cards, busca, bounds, geolocalização e marcadores são sincronizados.
- [x] Seleção de marcador não recria a instância do mapa.
- [x] Canvas só aparece após tiles carregados.
- [x] Falha de chave/cota/rede mantém lista utilizável e retry consistente.
- [ ] Credencial Google Cloud definitiva possui billing, cota e referrers de produção validados.

## Pagamento

- [x] Payment Element usa chave publicável de teste.
- [x] A API rejeita chave live e valida entrada/idempotência.
- [x] Cartão cria PaymentIntent com captura manual.
- [x] Pix cria PaymentIntent com captura automática.
- [x] Captura final e reembolso parcial verificam a sessão vinculada.
- [x] Webhook sem assinatura válida responde `400`.
- [x] Webhook assinado aceita os eventos configurados e registra `eventId`/`eventType`.
- [ ] Webhook reconcilia de forma idempotente sessão e pagamento persistidos.
- [ ] Fluxo live, fiscalidade, risco e operação produtiva são homologados.

## Fila, sessão e comprovante

- [x] Motorista pode entrar, ser chamado e sair da fila local.
- [x] Sessão respeita `AUTHORIZED → WAITING_START → STARTING → CHARGING → ENERGY_FINISHED → IDLE_GRACE_PERIOD → IDLE_FEE? → SETTLING → COMPLETED`.
- [x] Nenhuma energia aparece antes de `CHARGING`.
- [x] Comprovante mostra energia, subtotal, ociosidade, total e devolução.
- [ ] Estado de fila e sessão é persistido e coordenado pela API/Supabase.
- [ ] Start/StopCharge real é confirmado pelo adapter GoodWe homologado.

## Aparência, PWA e notificações

- [x] Tema inicial claro e predominantemente branco desde 320 px.
- [x] Tema escuro opcional e persistido.
- [x] Manifest, service worker, safe areas e instalação PWA.
- [x] Permissão de notificação solicitada após gesto explícito.
- [x] Notificação local abre a rota associada.
- [ ] Push remoto entrega eventos quando nenhum cliente está executando.

## Verificação técnica obrigatória

```bash
npm run lint
npm run test
npm run build
```

- Nenhum `.env` ou segredo pode estar versionado.
- Integrações externas devem ser verificadas em navegador real e nos dashboards dos provedores.
- Critérios pendentes não podem ser descritos como produção pronta.

