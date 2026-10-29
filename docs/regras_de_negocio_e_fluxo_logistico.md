# Regras de Negócio e Fluxo Logístico

Este documento consolida as regras de negócio traduzidas para o código do backend da Euroart.

## ⚖️ 1. Fórmula de Validação de Peso
Para que um pacote seja aprovado (`status: ok`), o peso lido pela balança não pode variar para além da tolerância estabelecida no cadastro dos produtos (SKUs).

**Cálculo do Peso Esperado:**
`Peso Esperado = Tara da Caixa (Embalagem) + Σ (Peso Unitário do SKU * Quantidade)`

**Cálculo da Tolerância:**
Se a tolerância do SKU for de `2%`:
`Limite Mínimo = Peso Esperado * 0.98`
`Limite Máximo = Peso Esperado * 1.02`

Para o pacote passar na conferência: `Limite Mínimo <= Peso Lido <= Limite Máximo`.

## 🚦 2. Máquina de Estados do Pacote (Bipagem)
O campo `status` do pacote obedece ao seguinte ciclo de vida:
1.  **pendente**: Estado inicial ao importar o JSON.
2.  **divergente_peso**: Quando a primeira leitura da balança está fora da tolerância. O operador deve retirar e repesar.
3.  **bloqueado**: Se a segunda tentativa falhar, o pacote trava por segurança. Evita fraudes ou envios incorretos insistentes.
4.  **liberado_divergente**: Um utilizador com perfil `admin` insere a sua senha e liberta o pacote assumindo a responsabilidade do erro de peso.
5.  **ok**: Pacote conferido com sucesso (seja de primeira, segunda ou após liberação).

## 📄 3. Regra de ICMS (Guias Físicas)
Certas UFs (Estados) possuem regimes tributários que exigem a anexação da Guia de ICMS (GNRE) colada fisicamente na caixa de transporte.
Se a tabela `regras_icms` indicar `exige_guia = true` para a UF de destino do pacote, a interface exibe um aviso amarelo piscante obrigando o operador a confirmar visualmente a colagem do documento antes da bipagem.