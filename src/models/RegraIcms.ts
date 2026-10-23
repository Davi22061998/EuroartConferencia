import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

export interface RegraIcmsAttributes {
  uf: string;
  exige_guia: boolean;
}

export class RegraIcms extends Model<RegraIcmsAttributes> implements RegraIcmsAttributes {
  public declare uf: string;
  public declare exige_guia: boolean;
}

RegraIcms.init(
  {
    uf: { type: DataTypes.CHAR(2), primaryKey: true, allowNull: false },
    exige_guia: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  },
  { sequelize, tableName: 'regras_icms', timestamps: false }
);

export default RegraIcms;