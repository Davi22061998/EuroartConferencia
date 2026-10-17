'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('embalagens', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tipo: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      peso_estimado_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('embalagens');
  }
};
