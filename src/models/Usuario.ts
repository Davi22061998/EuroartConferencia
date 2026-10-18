import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface UsuarioAttributes {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: 'admin' | 'conferente';
  criado_em?: Date;
}

export interface UsuarioCreationAttributes extends Optional<UsuarioAttributes, 'id' | 'criado_em'> {}

export class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  public declare id: number;
  public declare nome: string;
  public declare email: string;
  public declare senha_hash: string;
  public declare perfil: 'admin' | 'conferente';
  public declare readonly criado_em: Date;
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
    },
    senha_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    perfil: {
      type: DataTypes.ENUM('admin', 'conferente'),
      allowNull: false,
      defaultValue: 'conferente',
    },
    criado_em: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'usuarios',
    timestamps: false,
  }
);

export default Usuario;