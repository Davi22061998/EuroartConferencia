# Referência da API (RESTful) - Euroart

A API foi desenvolvida em Node.js com Express e utiliza **JSON Web Tokens (JWT)** no cabeçalho `Authorization: Bearer <token>` para todas as rotas protegidas.

## 🔐 Autenticação
### `POST /api/auth/login`
Autentica o utilizador e devolve o token de sessão.
*   **Body:** `{ "email": "admin@euroart.com", "senha": "123" }`
*   **Retorno (200 OK):** `{ "token": "eyJhbG...", "usuario": { "id": 1, "perfil": "admin" } }`

## 📦 Conferência
### `GET /api/conferencias/ativas`
Retorna a conferência atualmente em andamento ou interrompida.
*   **Header:** `Authorization: Bearer <token>`
*   **Retorno (200 OK):** Objeto da conferência com a lista de pacotes.

### `POST /api/conferencias/bipar`
Principal rota do sistema. Cruza o pacote, a caixa e valida o peso lido na balança.
*   **Header:** `Authorization: Bearer <token>`
*   **Body:** 
    ```json
    {
      "chave_acesso": "35231012345678901234567890123456789012345678",
      "codigo_caixa": "CX-PADRAO-M",
      "peso_lido": 1500.50
    }
    ```
*   **Retorno (200 OK):** `{ "sucesso": true, "status": "ok" }`
*   **Retorno (400 Bad Request - Divergente):** `{ "erro": "Peso divergente", "status": "divergente_peso" }`
*   **Retorno (403 Forbidden - Bloqueado):** `{ "erro": "Pacote bloqueado. Solicite o gerente.", "status": "bloqueado" }`

### `POST /api/conferencias/pacotes/:id/liberar`
**(Apenas Admin)** Liberta um pacote que foi bloqueado após 2 tentativas falhas.
*   **Body:** `{ "justificativa": "Balança descalibrada, peso manual conferido" }`