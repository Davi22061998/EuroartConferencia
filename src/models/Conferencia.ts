import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import Usuario from './Usuario';

export interface ConferenciaAttributes {
  id: number;
  transportadora: string;
  status: 'em_andamento' | 'interrompida' | 'finalizada';
  usuario_id: number;
  data_inicio: Date;
  data_finalizacao?: Date;
}

export interface ConferenciaCreationAttributes extends Optional<ConferenciaAttributes, 'id' | 'data_inicio' | 'data_finalizacao'> {}

export class Conferencia extends Model<ConferenciaAttributes, ConferenciaCreationAttributes> implements ConferenciaAttributes {
  public declare id: number;
  public declare transportadora: string;
  public declare status: 'em_andamento' | 'interrompida' | 'finalizada';
  public declare usuario_id: number;
  public declare data_inicio: Date;
  public declare data_finalizacao?: Date;
}

Conferencia.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    transportadora: { type: DataTypes.STRING(150), allowNull: false },
    status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'em_andamento' },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'usuarios', key: 'id' }
    },
    data_inicio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    data_finalizacao: { type: DataTypes.DATE, allowNull: true }
  },
  { sequelize, tableName: 'conferencias', timestamps: false }
);

Conferencia.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

export default Conferencia;