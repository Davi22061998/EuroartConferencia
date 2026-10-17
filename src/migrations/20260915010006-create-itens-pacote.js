'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('itens_pacote', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      pacote_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'pacotes',
          key: 'id'
        }
      },
      produto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'produtos',
          key: 'id'
        }
      },
      quantidade: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('itens_pacote');
  }
};
