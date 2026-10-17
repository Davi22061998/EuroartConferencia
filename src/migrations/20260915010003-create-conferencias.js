'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('conferencias', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      transportadora: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      data_inicio: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      data_finalizacao: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('conferencias');
  }
};
