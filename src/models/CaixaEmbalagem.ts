import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface CaixaEmbalagemAttributes {
  id: number;
  codigo_sku: string;
  nome: string;
  peso_gramas: number;
  descricao?: string | null;
  criado_em?: Date;
}

export interface CaixaCreationAttributes extends Optional<CaixaEmbalagemAttributes, 'id' | 'criado_em'> {}

export class CaixaEmbalagem extends Model<CaixaEmbalagemAttributes, CaixaCreationAttributes> implements CaixaEmbalagemAttributes {
  public declare id: number;
  public declare codigo_sku: string;
  public declare nome: string;
  public declare peso_gramas: number;
  public declare descricao?: string | null;
  public declare readonly criado_em: Date;
}

CaixaEmbalagem.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    codigo_sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    peso_gramas: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    descricao: { type: DataTypes.STRING(255), allowNull: true },
    criado_em: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  },
  { sequelize, tableName: 'caixas_embalagem', timestamps: false }
);

export default CaixaEmbalagem;