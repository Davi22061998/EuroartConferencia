'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('pacotes', {
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
      remessa_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'remessas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      chave_acesso: {
        type: Sequelize.STRING(44),
        allowNull: false,
        unique: true
      },
      numero_nf: {
        type: Sequelize.STRING(20),
        allowNull: false
      },
      razao_social: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      descricao_produto: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      uf: {
        type: Sequelize.CHAR(2),
        allowNull: false
      },
      status: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'pendente'
      },
      possui_guia_icms: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      caixa_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'caixas_embalagem',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      peso_esperado_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      peso_lido_g: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      tentativas_peso: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      justificativa_liberacao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      usuario_liberacao_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      data_conferido: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('pacotes');
  }
};
