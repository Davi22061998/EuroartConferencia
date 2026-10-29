# Integração de Hardware: Balança e ESP32 (IoT)

Este documento descreve a arquitetura de integração entre o sistema web (Node.js) e o hardware de aferição de peso da Euroart, utilizando o microcontrolador ESP32.

## 🔌 Componentes de Hardware
*   **Microcontrolador:** ESP32 (Módulo Wi-Fi e Bluetooth integrado).
*   **Módulo Amplificador:** HX711 (Conversor A/D de 24 bits para balanças).
*   **Sensor de Peso:** Célula de Carga (Load Cell) calibrada para o peso máximo da operação.

## ⚙️ Esquema de Ligação (Wiring)
| Módulo HX711 | Pino ESP32 | Descrição |
| :--- | :--- | :--- |
| VCC | 3.3V | Alimentação |
| GND | GND | Terra |
| DT (Data) | GPIO 21 | Transmissão de Dados |
| SCK (Clock)| GPIO 22 | Pulso de Clock |

*(Nota: Os pinos de dados podem variar conforme a placa, mas devem ser configurados no código C++).*

## 💻 Firmware (C++ / Arduino IDE)
O código no ESP32 utiliza a biblioteca `HX711` (de Bogdan Necula) para leitura e a `HTTPClient` nativa para enviar os dados.

**Fluxo de Funcionamento:**
1.  **Conexão Wi-Fi:** O ESP32 conecta-se à rede local da Euroart.
2.  **Calibração Inicial (Tare):** Ao ligar, o sistema zera a balança.
3.  **Leitura Contínua:** O ESP32 lê o peso em gramas a cada 500ms.
4.  **Transmissão:** Ao estabilizar o peso, o ESP32 faz uma requisição para a nossa API.

### Exemplo de Comunicação com a API
O ESP32 faz um `GET` ou via `WebSocket` (dependendo da versão) para disponibilizar o peso ao frontend.
Se for modelo push (via REST API):
```http
POST /api/balanca/peso
Content-Type: application/json

{
  "balanca_id": "BAL-01",
  "peso_gramas": 1250.50
}
```