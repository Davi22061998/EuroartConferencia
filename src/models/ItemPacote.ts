import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Pacote from './Pacote';

export interface ItemPacoteAttributes {
  id: number;
  pacote_id: number;
  codigo_sku: string;
  descricao_produto?: string;
  quantidade: number;
}

export interface ItemPacoteCreationAttributes extends Optional<ItemPacoteAttributes, 'id'> {}

export class ItemPacote extends Model<ItemPacoteAttributes, ItemPacoteCreationAttributes> implements ItemPacoteAttributes {
  public declare id: number;
  public declare pacote_id: number;
  public declare codigo_sku: string;
  public declare descricao_produto?: string;
  public declare quantidade: number;
}

ItemPacote.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    pacote_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'pacotes', key: 'id' }
    },
    codigo_sku: { type: DataTypes.STRING(100), allowNull: false },
    descricao_produto: { type: DataTypes.STRING(255), allowNull: true },
    quantidade: { type: DataTypes.INTEGER, allowNull: false }
  },
  { sequelize, tableName: 'itens_pacote', timestamps: false }
);

Pacote.hasMany(ItemPacote, { foreignKey: 'pacote_id', as: 'itens' });
ItemPacote.belongsTo(Pacote, { foreignKey: 'pacote_id', as: 'pacote' });

export default ItemPacote;