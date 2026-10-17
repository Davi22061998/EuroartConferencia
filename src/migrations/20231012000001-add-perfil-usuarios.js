'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('usuarios', 'perfil', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'auxiliar'
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('usuarios', 'perfil');
  }
};