'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('remessas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      conferencia_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conferencias',
          key: 'id'
        }
      },
      mkp: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      data_importacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('remessas');
  }
};
