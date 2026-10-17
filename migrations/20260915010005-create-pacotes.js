'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pacotes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      chave_acesso: {
        type: Sequelize.STRING(44),
        allowNull: false,
        unique: true
      },
      remessa_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'remessas',
          key: 'id'
        }
      },
      numero_nf: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      razao_social: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      descricao_produto: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      uf: {
        type: Sequelize.CHAR(2),
        allowNull: true
      },
      status: {
        // valores usados pela aplicação: pendente, ok, duplicado,
        // divergente_peso, sem_guia_icms
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pendente'
      },
      possui_guia_icms: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      peso_esperado_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      peso_lido_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      data_conferido: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('pacotes');
  }
};
