'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skus_produtos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      codigo_sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      nome_produto: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      peso_unitario_gramas: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      tolerancia_peso_porcento: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 2.00
      },
      criado_em: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('skus_produtos');
  }
};
