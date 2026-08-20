# Critérios de aceite da Driver PWA

## Entrada e identidade

```text
GIVEN uma pessoa acessando a raiz pelo navegador móvel
WHEN a página abrir
THEN deve oferecer escanear QR, criar conta e entrar sem exigir autenticação
```

```text
GIVEN um novo motorista
WHEN preencher dados válidos, veículo, senha e aceite
THEN deve criar a identidade, respeitar eventual confirmação de e-mail e permitir login
```

```text
GIVEN um motorista autenticado
WHEN sair e entrar novamente
THEN deve recuperar somente sua sessão e seus dados de perfil
```

## QR e mapa

```text
GIVEN permissão de câmera concedida
WHEN um QR ChargeGrid válido entrar no enquadramento
THEN deve abrir o detalhe público do carregador correspondente
```

```text
GIVEN câmera indisponível ou permissão negada
WHEN o visitante selecionar uma imagem ou informar o código
THEN deve conseguir abrir o mesmo detalhe sem ficar bloqueado
```

```text
GIVEN uma chave válida do Google Maps
WHEN o motorista abrir Explorar
THEN deve ver o mapa Google, seis plantas, marcadores avançados e cards sincronizados
```

```text
GIVEN uma busca por nome, endereço ou cidade
WHEN o texto mudar
THEN cards, contagem, bounds e marcadores devem refletir o mesmo filtro
```

```text
GIVEN localização autorizada
WHEN a posição for obtida
THEN as distâncias devem ser recalculadas e os pontos ordenados por proximidade
```

## Pagamento

```text
GIVEN chaves Stripe de teste válidas
WHEN cartão for escolhido e o Payment Element confirmar
THEN a API deve retornar uma autorização com captura manual para o limite selecionado
```

```text
GIVEN uma recarga autorizada no cartão
WHEN a sessão for encerrada
THEN a API deve capturar apenas o total final e emitir o comprovante após a liquidação
```

```text
GIVEN Pix pago no sandbox
WHEN o total final for menor que o limite
THEN a API deve solicitar reembolso parcial da diferença antes do comprovante
```

```text
GIVEN uma chamada de webhook sem assinatura válida
WHEN alcançar `/payments/webhook`
THEN a API deve responder 400 e não alterar o pagamento
```

```text
GIVEN uma chave Stripe live informada por engano
WHEN a API iniciar uma operação financeira
THEN deve recusar a configuração e manter o ambiente restrito ao sandbox
```

## Fila, sessão e comprovante

```text
GIVEN um estabelecimento sem vaga imediata
WHEN um motorista autenticado entrar na fila
THEN deve ver sua posição, estimativa e opção de sair
```

```text
GIVEN a vaga liberada
WHEN o motorista for chamado
THEN deve receber uma janela de dez minutos e uma notificação, se autorizada
```

```text
GIVEN pagamento autorizado
WHEN a sessão evoluir
THEN deve respeitar AUTHORIZED, STARTING, CHARGING, FINISHING, IDLE_GRACE e SETTLED
```

```text
GIVEN liquidação concluída
WHEN o comprovante abrir
THEN deve mostrar energia, duração, subtotal, ociosidade, total e eventual devolução
```

## Aparência, PWA e resiliência

```text
GIVEN um primeiro acesso
WHEN a interface carregar
THEN o tema deve ser claro, predominantemente branco e responsivo desde 320 px
```

```text
GIVEN notificações ainda não decididas
WHEN o motorista tocar em Ativar notificações
THEN o navegador deve pedir permissão e registrar o resultado sem bloquear o app
```

```text
GIVEN uma notificação emitida
WHEN o motorista tocar nela
THEN deve abrir a rota associada em uma janela existente ou nova
```

```text
GIVEN perda de conectividade
WHEN uma nova autorização financeira for tentada
THEN a interface deve bloquear a operação e preservar a navegação já carregada
```

## Verificação técnica

- `npm run lint` sem erros.
- `npm run build` para todos os workspaces sem erros.
- `npm run test` com testes de saúde, validação financeira e webhook aprovados.
- jornada móvel verificada em navegador real nas larguras 390 px e 320 px.
- nenhum segredo ou arquivo `.env` versionado.
