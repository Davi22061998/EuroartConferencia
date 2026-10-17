'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('produtos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      sku: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      codigo_xml: {
        type: Sequelize.STRING(60),
        allowNull: true
      },
      descricao: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      peso_unitario_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      embalagem_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'embalagens',
          key: 'id'
        }
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('produtos');
  }
};
