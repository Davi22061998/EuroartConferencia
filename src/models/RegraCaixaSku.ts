import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import SkuProduto from './SkuProduto';
import CaixaEmbalagem from './CaixaEmbalagem';

export interface RegraCaixaSkuAttributes {
  id: number;
  sku_id: number;
  caixa_id: number;
  qtd_minima: number;
  qtd_maxima: number;
}

export interface RegraCreationAttributes extends Optional<RegraCaixaSkuAttributes, 'id'> {}

export class RegraCaixaSku extends Model<RegraCaixaSkuAttributes, RegraCreationAttributes> implements RegraCaixaSkuAttributes {
  public declare id: number;
  public declare sku_id: number;
  public declare caixa_id: number;
  public declare qtd_minima: number;
  public declare qtd_maxima: number;
}

RegraCaixaSku.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    sku_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'skus_produtos', key: 'id' } },
    caixa_id: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'caixas_embalagem', key: 'id' } },
    qtd_minima: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    qtd_maxima: { type: DataTypes.INTEGER, allowNull: false }
  },
  { sequelize, tableName: 'regras_caixa_sku', timestamps: false }
);

// Relacionamentos
SkuProduto.hasMany(RegraCaixaSku, { foreignKey: 'sku_id', as: 'regras_caixa' });
RegraCaixaSku.belongsTo(SkuProduto, { foreignKey: 'sku_id', as: 'sku' });

CaixaEmbalagem.hasMany(RegraCaixaSku, { foreignKey: 'caixa_id', as: 'regras_sku' });
RegraCaixaSku.belongsTo(CaixaEmbalagem, { foreignKey: 'caixa_id', as: 'caixa' });

export default RegraCaixaSku;