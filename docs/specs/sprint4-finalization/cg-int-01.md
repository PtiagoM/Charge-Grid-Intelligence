# CG-INT-01 — prova integrada final (unidade-pai)

**Classificação:** BACKEND ONLY · **Status:** DONE — CG-INT-01A e CG-INT-01B concluídas · **Tamanho:** GRANDE · **Risco:** ALTO.

## Objetivo

Provar que laboratório, telemetria, core comercial, previsão, regras, Decision Engine, Admin e PWA convergem sobre as mesmas entidades e persistência.

## Dependências e estado atual

Depende de DASH-03, LAB-02, UI-01 e OPS-01. É somente um agrupador; não possui arquivos próprios.

## Arquivos relevantes

Nenhum arquivo direto; INT-01A e INT-01B definem testes e evidências.

## Execução

Esta unidade não deve ser executada diretamente:

1. [CG-INT-01A — prova automatizada](cg-int-01a.md);
2. [CG-INT-01B — gate visual/manual e evidências](cg-int-01b.md).

## Fora de escopo

Não criar runtime `/demo`, banco paralelo, nova tela, dados financeiros fictícios ou commit com o ID-pai.

## Testes, documentação e commit

Não executar testes ou criar commit para o pai; cada subunidade registra sua evidência.

## Critérios de aceite

INT-01 termina apenas quando A e B passarem. Falha transversal deve ser corrigida na unidade proprietária, não contornada no teste/frontend.

## Condição de parada

Parar qualquer execução direta e encaminhar para A ou B.
