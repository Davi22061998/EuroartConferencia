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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      numero_remessa: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      arquivo_nome: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      total_pacotes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      data_importacao: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('remessas');
  }
};
