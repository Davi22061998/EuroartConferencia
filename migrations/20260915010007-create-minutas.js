'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('minutas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      numero_minuta: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      conferencia_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conferencias',
          key: 'id'
        }
      },
      caminho_arquivo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      data_emissao: {
        type: Sequelize.DATE,
        allowNull: true
      },
      data_expiracao: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('minutas');
  }
};
