import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Se existir a variável DATABASE_URL (usada no Render com o Aiven), liga com SSL.
// Caso contrário, usa as variáveis padrão para rodar localmente na tua máquina.
const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'mysql',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false // Obrigatório para cloud databases aceitarem a conexão
        }
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'euroart_conferencia',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: Number(process.env.DB_PORT) || 3306,
        dialect: 'mysql',
        logging: false, 
      }
    );

export default sequelize;