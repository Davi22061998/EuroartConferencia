import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface SkuProdutoAttributes {
  id: number;
  codigo_sku: string;
  nome_produto: string;
  peso_unitario_gramas: number;
  tolerancia_peso_porcento: number;
  criado_em?: Date;
}

export interface SkuCreationAttributes extends Optional<SkuProdutoAttributes, 'id' | 'criado_em'> {}

export class SkuProduto extends Model<SkuProdutoAttributes, SkuCreationAttributes> implements SkuProdutoAttributes {
  public declare id: number;
  public declare codigo_sku: string;
  public declare nome_produto: string;
  public declare peso_unitario_gramas: number;
  public declare tolerancia_peso_porcento: number;
  public declare readonly criado_em: Date;
}

SkuProduto.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo_sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    nome_produto: { type: DataTypes.STRING(200), allowNull: false },
    peso_unitario_gramas: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    tolerancia_peso_porcento: { type: DataTypes.DECIMAL(5, 2), defaultValue: 2.00 },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'skus_produtos', timestamps: false }
);

export default SkuProduto;