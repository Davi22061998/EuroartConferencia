'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('regras_icms', {
      uf: {
        type: Sequelize.CHAR(2),
        primaryKey: true,
        allowNull: false
      },
      exige_guia: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    });

    const ufsIcms = [
      'AL', 'AM', 'AP', 'BA', 'CE', 'MA', 'PA', 'PB', 
      'PE', 'PI', 'RN', 'RO', 'RR', 'SE', 'TO'
    ];

    const insertData = ufsIcms.map(uf => ({
      uf,
      exige_guia: true
    }));

    await queryInterface.bulkInsert('regras_icms', insertData);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('regras_icms');
  }
};
