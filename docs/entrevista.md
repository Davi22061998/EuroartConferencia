# Levantamento de Requisitos — Sistema de Conferência Final de Expedição (Euroart)

> **Status:** validado pelo responsável pelo processo.
> As respostas abaixo foram montadas a partir da explicação dele.

**Entrevistado:** Felipe Campelo
**Entrevistador:** Davi Françozo

---

## 1. Objetivo e escopo

Criar uma **conferência final de expedição**: uma rede de proteção aplicada depois que a caixa já foi conferida na mesa, fechada e lacrada. O sistema simula a conferência que o próprio marketplace faria no centro de distribuição dele antes de receber a carga.

**Dentro do escopo:** importar remessas, conferir pacote a pacote (chave de acesso + peso), sinalizar exceções, contar pacotes, gerar a minuta de transporte e produzir indicadores.

**Fora do escopo:** faturamento no Protheus, integração Lexos ↔ Protheus ↔ SEFAZ, geração das etiquetas, conversão dos XMLs em JSON (feita por automação já existente) e separação física.

---

## 2. Entrevista

### Bloco A — Processo atual (antes do sistema)

**1. Como a venda chega até o faturamento?**
A venda acontece no marketplace, e o integrador Lexos a traz para dentro do Protheus. Nesse momento já são gerados o cadastro do cliente (se ele ainda não existir), o pedido de venda com numeração, valor final, produto, dados do cliente e o número do pedido na plataforma de vendas (Amazon, Mercado Livre, Shopee etc.).

**2. Há alguma conferência antes de faturar?**
Sim. Um faturista confere os pedidos antes de empenhar o estoque. Se algo estiver errado, ele ajusta antes de seguir.

**3. Como o faturamento é feito?**
O faturista filtra os pedidos por marketplace no Protheus, libera estoque, empenha e fatura, sempre segregando por marketplace para facilitar a exportação posterior dos documentos.

**4. O que acontece depois do faturamento?**
Ele exporta o range de XMLs (50 a 60 notas) para uma pasta de rede com o nome do marketplace. Nessa pasta há uma automação que transforma o range em **um JSON** com as informações relevantes de cada nota (número da NF, chave de acesso, cliente, transportadora, descrição do produto e UF). Essa automação será alterada para trazer também os dados que faltam, como SKU e quantidade por pacote.

**5. E a separação física?**
O faturista imprime o packlist e leva à logística. A equipe separa cada item por SKU, validade, lote e endereço. Nesse ponto ninguém sabe para quem vai cada item; só se sabe produtos, quantidades e marketplace.

**6. Como é a conferência na mesa?**
O operador abre o Lexos Hub, filtra os pedidos a enviar do marketplace e abre pedido a pedido. Ele bipa o EAN de cada item. Quando termina o pedido, o integrador imprime automaticamente, em impressora térmica, a etiqueta de envio (com CT-e) e a DANFE simplificada. O operador acomoda os produtos, cola as etiquetas, lacra a caixa e ela fica disponível para envio.

**7. Qual é o problema hoje?**
Depois da caixa lacrada não existe mais nenhuma conferência sistêmica. Só há uma checagem manual do pacote contra o romaneio de transporte, sujeita a erro.

### Bloco B — Onde o sistema entra

**8. Em que momento o sistema é usado?**
Depois da mesa de conferência, com a caixa já fechada, etiquetada e lacrada.

**9. Como a conferência começa?**
O operador adiciona ao sistema a remessa (o JSON gerado pela automação). O sistema identifica automaticamente a transportadora e cria a conferência. A transportadora fica atrelada à remessa, o que facilita o controle. Cada marketplace tem uma única transportadora, e os operadores têm um painel que relaciona cada marketplace à sua transportadora.

**10. Como o operador confere cada caixa?**
Ele pega a caixa fechada, posiciona na balança e bipa a chave de acesso da DANFE simplificada. Pesagem e bipagem acontecem no mesmo gesto.

**11. O que o sistema faz na bipagem?**
Cruza se o pacote era esperado naquela remessa, verifica duplicidade, marca como concluído, verifica se o UF exige guia de ICMS, confere o peso, faz a contagem de pacotes e atualiza a lista que vai gerar a minuta.

**12. O que acontece com a caixa depois de validada?**
Ela é segregada no pallet e não é mais mexida até a coleta.

### Bloco C — Tratativas de exceção

**13. O que é a guia de ICMS e o que o operador faz?**
Alguns estados exigem a guia DIFAL de ICMS, com o boleto pago anexado na própria embalagem. Se o sistema apontar que o UF do pacote exige a guia, o operador é sinalizado e precisa anexar o comprovante de pagamento na caixa.

**14. E se o mesmo pacote for lido duas vezes?**
O sistema não contabiliza a segunda leitura da chave de acesso ou do número da NF. Ele exibe um modal informando que o pacote já foi conferido em (data e hora). Assim o operador não manda dois pacotes ao mesmo cliente.

**15. Para que serve a contagem de pacotes?**
Na expedição, para cruzar a quantidade de pedidos do marketplace com a quantidade de pacotes preparados. Isso garante que nada saiu a mais, a menos ou duplicado, e que só saíram clientes que o Lexos integrou no começo. É a garantia final de toda a operação.

**16. O que acontece quando o peso não bate?**
A margem de erro (tolerância) é cadastrada manualmente no próprio sistema. Quando o peso reprova, o sistema informa e pede para abrir a caixa, reconferir e corrigir. Se na segunda tentativa continuar divergente, a caixa é travada e só é liberada com a senha de um superior, com justificativa feita por ele.

### Bloco D — Estrutura dos dados

**17. Qual a relação entre XML, JSON, remessa e conferência?**
- Cada **XML** é uma caixa/pacote.
- Um **JSON** com vários XMLs é uma **remessa**.
- Uma **conferência** agrupa uma ou mais remessas do mesmo marketplace e gera a lista do que deve ser enviado no dia.
- A **minuta** é essa lista, impressa e assinada.

### Bloco E — Minuta

**18. O que é a minuta e como é usada?**
Ela agrupa cada pedido daquele marketplace naquela conferência, linha a linha, indicando se foi validado na conferência final. Já é o documento usado como romaneio de transporte: é impressa e assinada pela expedição e pelo motorista da transportadora.

**19. Como funciona a numeração e o conteúdo exato?**
A minuta tem número sequencial e data, o título da conferência (transportadora + data e hora), total de pacotes, conferidos, remessas importadas, data de finalização e uma tabela com NF, chave de acesso, cliente, produto, UF, status e remessa. Como uma conferência pode ter várias remessas, cada linha mostra se o pacote veio da remessa 1, 2, 3 e assim por diante.

### Bloco F — Peso e indicadores (novidades do sistema)

**20. Como será calculado o peso esperado?**
Cruzando os pesos dos SKUs extraídos dos XMLs na geração do JSON com a tabela de peso dos produtos e o peso da embalagem, chegando ao peso final esperado do pacote.

**21. Como e quando o peso dos produtos será cadastrado?**
O peso de cada SKU e das embalagens, assim como a tolerância, fica em tabelas do banco e é cadastrado manualmente pelo próprio sistema. Depende da pesagem física dos itens na empresa; até lá, os testes usam dados fictícios.

**22. Que indicadores o sistema deve gerar?**
Recorrência de erros, quantidade de envios e outros a definir (por exemplo: volume por marketplace, percentual de duplicidade, envios fora do peso).

### Bloco G — Situações especiais

**a. O operador pode digitar a NF no lugar de bipar a chave de acesso?**
Sim, em casos de guia de ICMS ou de impressão borrada da etiqueta térmica.

**b. O que acontece se o produto não tem peso cadastrado?**
O sistema sinaliza e informa que, para efetivar a conferência, é necessário cadastrar o peso do produto, a embalagem padrão e a margem de tolerância.

**c. Quem compara a contagem de pacotes com os pedidos do marketplace?**
O operador. O total de pedidos do marketplace não é informado ao sistema.

**d. Uma conferência pode receber novas remessas depois de iniciada?**
Sim, quantas forem necessárias.

### Bloco H — Usuários e acesso

**23. Quem usa o sistema?**
Auxiliares de logística, faturistas, supervisor de e-commerce, supervisor de logística e gerente geral. O login é obrigatório, porque cada conferência precisa identificar quem a realizou. O **auxiliar** pode importar remessa, gerar minuta, acessar o dashboard, filtrar pacotes das conferências, navegar entre as conferências e bipar. Os **demais perfis** podem tudo isso e ainda excluir remessas inteiras de uma conferência, excluir pacotes, conceder permissões adicionais a auxiliares e gerenciar perfis.

**24. Vários usuários podem trabalhar juntos?**
Sim. Todos precisam enxergar a mesma conferência, com os dados atualizados para todos.

**25. Quem fecha a conferência (ponto de corte) e o que acontece com pacotes não conferidos?**
Os próprios auxiliares fecham a conferência e geram a minuta quando ela foi 100% realizada (todos os pacotes). Se houver pacotes não conferidos, só um superior pode fechar. Ele escolhe entre excluir os pacotes não conferidos, com justificativa, ou gerar a minuta com a observação "não conferido" nesses pacotes.

---

## 3. Requisitos funcionais

| ID | Requisito |
|----|-----------|
| RF01 | O sistema deve exigir login e senha e registrar o usuário responsável em cada conferência. |
| RF02 | O sistema deve importar uma remessa a partir do JSON gerado pela automação. |
| RF03 | O sistema deve identificar a transportadora a partir do JSON e criar (ou associar) a conferência correspondente. |
| RF04 | Uma conferência deve poder agrupar uma ou mais remessas do mesmo marketplace. |
| RF05 | O sistema deve permitir várias conferências abertas ao mesmo tempo, com interrupção e retomada, sem que uma interfira na outra. |
| RF06 | Todos os usuários devem enxergar a mesma conferência com dados compartilhados. |
| RF07 | O sistema deve registrar a leitura da chave de acesso (ou do número da NF) de cada pacote. |
| RF08 | O sistema deve validar se o pacote lido pertence à remessa da conferência. |
| RF09 | O sistema deve detectar leitura duplicada (chave ou NF), não contabilizá-la e exibir modal com data e hora da conferência anterior. |
| RF10 | O sistema deve sinalizar quando o UF do pacote exigir guia DIFAL de ICMS, avisando o operador para anexar o comprovante na caixa. |
| RF11 | O sistema deve receber o peso da balança no momento da bipagem e compará-lo ao peso esperado. |
| RF12 | O sistema deve calcular o peso esperado somando peso unitário × quantidade de cada SKU do pacote mais o peso da embalagem. |
| RF13 | O sistema deve marcar o pacote como validado quando todas as verificações forem aprovadas. |
| RF14 | O sistema deve exibir a contagem de pacotes conferidos em relação aos esperados da conferência. |
| RF15 | O sistema deve permitir listar os pacotes pendentes de conferência. |
| RF16 | O sistema deve gerar a minuta de transporte em PDF, linha a linha, com o status de validação e campos de assinatura da expedição e do motorista. Cada linha informa a remessa de origem, e o cabeçalho traz número sequencial, nome da conferência, totais e data de finalização. |
| RF17 | O sistema deve permitir cadastrar produtos (SKU, peso unitário, embalagem), embalagens (tipo, peso estimado) e a tolerância de peso. |
| RF18 | O sistema deve manter o histórico das conferências e NFs por cerca de 6 meses. |
| RF19 | O sistema deve gerar indicadores das conferências (recorrência de erros, quantidade de envios, duplicidades, envios fora do peso). |
| RF20 | Quando o peso reprovar, o sistema deve pedir reconferência; na segunda divergência, deve travar o pacote e liberá-lo apenas com a senha de um superior e a justificativa dele. |
| RF21 | O sistema deve permitir digitar o número da NF no lugar de bipar a chave de acesso. |
| RF22 | O sistema deve sinalizar produto sem peso cadastrado e impedir a efetivação da conferência até que peso, embalagem padrão e tolerância sejam cadastrados. |
| RF23 | O sistema deve permitir adicionar remessas a uma conferência já iniciada, em qualquer quantidade. |
| RF24 | O auxiliar deve poder fechar a conferência e gerar a minuta apenas quando todos os pacotes estiverem conferidos. |
| RF25 | Com pacotes não conferidos, só um superior pode fechar a conferência, excluindo esses pacotes (com justificativa) ou gerando a minuta com a observação "não conferido". |
| RF26 | Perfis superiores devem poder excluir remessas inteiras e pacotes de uma conferência. |
| RF27 | Perfis superiores devem poder conceder permissões adicionais a auxiliares e gerenciar perfis. |

## 4. Regras de negócio

| ID | Regra |
|----|-------|
| RN01 | Cada XML representa um pacote; cada JSON representa uma remessa; uma conferência agrupa uma ou mais remessas do mesmo marketplace. |
| RN02 | Uma conferência nunca mistura marketplaces diferentes. |
| RN03 | A segunda leitura de um pacote já conferido não é contabilizada. |
| RN04 | Pacote validado é segregado no pallet e não é mais movimentado até a coleta. |
| RN05 | Peso esperado = Σ(peso unitário × quantidade) + peso da embalagem, dentro da tolerância cadastrada no sistema. |
| RN06 | Os estados que exigem guia DIFAL são fixos e ficam definidos no código do sistema. |
| RN07 | A minuta é o romaneio de transporte e deve ser assinada pela expedição e pelo motorista. |
| RN08 | Toda conferência deve identificar o usuário que a realizou. |
| RN09 | Os dados finalizados ficam disponíveis para consulta por cerca de 6 meses. |
| RN10 | O peso só é aprovado com a tolerância cadastrada; após duas tentativas divergentes, o pacote só é liberado por um superior, com justificativa. |
| RN11 | Sem peso do produto, embalagem padrão e tolerância cadastrados, a conferência não pode ser efetivada. |
| RN12 | O auxiliar só fecha a conferência quando 100% dos pacotes foram conferidos; caso contrário, o fechamento é de um superior. |
| RN13 | A comparação entre a contagem de pacotes e o total de pedidos do marketplace é feita pelo operador. |

## 5. Requisitos não funcionais

| ID | Requisito |
|----|-----------|
| RNF01 | Sistema web, acessível de qualquer local, com banco de dados central (sem armazenamento local no navegador). |
| RNF02 | Atualização compartilhada em tempo real entre os usuários da mesma conferência. |
| RNF03 | Integração com a balança (ESP32) por Wi-Fi, enviando o peso ao servidor. |
| RNF04 | Leitura por leitor de código de barras, sem etapas manuais extras no fluxo. |
| RNF05 | O fluxo deve ser fluido: a conferência final não pode atrasar a operação existente. |
| RNF06 | Dados de clientes usados em demonstrações e documentação devem ser fictícios (LGPD). |
| RNF07 | Minuta com layout adequado para impressão em A4. |

## 6. Pontos em aberto para validação

Nenhum no momento. Os 8 pontos da rodada anterior foram respondidos e incorporados às seções 2, 3 e 4.
