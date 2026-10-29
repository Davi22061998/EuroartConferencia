Documentação e Arquitetura do Banco de Dados - Euroart Expedição

Este documento detalha a estrutura relacional do sistema de expedição da Euroart, modelada via Sequelize ORM (Node.js) e suportada por um banco de dados relacional (MySQL). O objetivo do modelo é garantir a integridade dos dados logísticos, rastreabilidade operacional (auditoria) e alta precisão na conferência de pesos.

🏗️ Justificativa Arquitetural

A escolha por um banco de dados relacional (SQL) justifica-se pela natureza altamente estruturada das operações de expedição. Cada pacote pertence obrigatoriamente a uma remessa, que pertence a uma conferência, que é gerida por um utilizador. A integridade referencial (Foreign Keys) impede que pacotes fiquem "órfãos" no sistema e garante que o histórico de auditoria seja imutável e preciso.

🗄️ Dicionário de Dados e Justificativas por Tabela

1. Tabela: usuarios

Objetivo: Gerir o acesso ao sistema e manter o registo de quem realizou cada operação.

Justificativa de Negócio: O sistema exige diferentes níveis de acesso. Operadores realizam a conferência padrão, enquanto Administradores têm permissões para forçar a libertação de pacotes bloqueados por divergência de peso e excluir conferências.

Campos Principais:

perfil (VARCHAR): Diferencia regras de negócio (ex: 'admin' vs 'operador').

senha_hash (VARCHAR): Armazena a senha criptografada via Bcrypt por questões de segurança (LGPD/GDPR).

2. Tabela: conferencias

Objetivo: Representar uma sessão de trabalho contínua para uma transportadora específica.

Justificativa de Negócio: Na Euroart, a expedição é agrupada por transportadora. Uma conferência agrupa múltiplas importações (remessas) num único lote lógico até que o camião seja carregado.

Campos Principais:

transportadora (VARCHAR): Define o alvo logístico do lote.

status (VARCHAR): Controla a máquina de estados ('em_andamento', 'interrompida', 'finalizada').

Relacionamentos:

usuario_id (FK): Regista quem iniciou a sessão (Auditoria).

3. Tabela: remessas

Objetivo: Rastrear cada lote de Notas Fiscais (ficheiro JSON) importado para o sistema.

Justificativa de Negócio: Como uma conferência pode durar o dia todo, o operador pode precisar de importar vários ficheiros JSON (lotes de faturamento) para a mesma transportadora. Esta tabela permite reverter/excluir a última importação se o ficheiro estiver errado, sem afetar o resto da conferência.

Campos Principais:

numero_remessa (INT): Identificador sequencial dentro da conferência.

arquivo_nome (VARCHAR): Rastreabilidade do ficheiro de origem.

4. Tabela: pacotes

Objetivo: É a entidade central do sistema, representando a caixa física que será pesada e enviada ao cliente.

Justificativa de Negócio: Armazena o estado individual da validação (Bip a Bip). Regista tanto o peso calculado pelo sistema quanto o peso real lido pela balança (ESP32), além de gerir o bloqueio de segurança após 2 tentativas falhas.

Campos Principais:

chave_acesso e numero_nf (VARCHAR): Chaves primárias de negócio para bipagem e cruzamento de dados fiscais.

status (VARCHAR): 'pendente', 'ok', 'divergente_peso', 'bloqueado', 'liberado_divergente'.

tentativas_peso (INT): Regra de negócio (Trava após 2 falhas).

peso_esperado_g / peso_lido_g (DECIMAL): Dados vitais para a prova de auditoria da expedição.

Relacionamentos:

caixa_id (FK): Associa a tara da embalagem ao pacote.

usuario_liberacao_id (FK): Auditoria de quem foi o supervisor que forçou a aprovação de uma divergência.

5. Tabela: itens_pacotes

Objetivo: Listar os produtos contidos dentro de um pacote específico.

Justificativa de Negócio: Necessário para calcular o peso esperado do pacote de forma dinâmica (Soma da quantidade * peso unitário do SKU).

Campos Principais:

codigo_sku (VARCHAR): Referência do produto.

quantidade (INT): Multiplicador para o peso.

6. Tabela: caixas_embalagens

Objetivo: Catálogo de embalagens de transporte (tara).

Justificativa de Negócio: O peso lido pela balança nunca é igual ao peso dos produtos, pois a caixa de papelão tem peso. Esta tabela cadastra essas embalagens para que a tara seja somada ao peso esperado do pacote.

Campos Principais:

peso_gramas (DECIMAL): A tara da caixa.

codigo_sku (VARCHAR): Código bipado pelo operador antes de pesar a caixa.

7. Tabela: sku_produtos

Objetivo: Catálogo de produtos parametrizados da Euroart.

Justificativa de Negócio: Centraliza a parametrização de pesos e as regras de tolerância. Produtos diferentes podem ter variações de manufatura diferentes, exigindo limites de tolerância personalizados na hora de aprovar o peso na balança.

Campos Principais:

peso_unitario_gramas (DECIMAL): Base de cálculo para o pacote.

tolerancia_peso_porcento (DECIMAL): Margem de erro aceitável (ex: 2.0%) para aprovar a conferência daquele item.

8. Tabela: regras_icms

Objetivo: Regras fiscais estaduais (Tabela de parametrização).

Justificativa de Negócio: Alguns estados (UFs) no Brasil exigem a impressão e anexação de guias de ICMS físicas na caixa. Esta tabela dita o comportamento da interface do utilizador, gerando alertas visuais caso o estado de destino exija a guia.

Campos Principais:

uf (VARCHAR): Sigla do Estado.

exige_guia (TINYINT/BOOLEAN): Flag ativadora da regra.

⏱️ Metadados (Timestamps)

Todas as tabelas do sistema (geridas pelas migrations do Sequelize) possuem, por padrão, os campos createdAt e updatedAt.

Justificativa: Garantir a rastreabilidade temporal. É possível saber exatamente a data e a fração de segundo em que um pacote foi bipado, atualizado ou bloqueado, oferecendo uma trilha de auditoria completa para a Euroart.