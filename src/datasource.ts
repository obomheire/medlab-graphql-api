import { DataSource } from 'typeorm';
import 'dotenv/config';

/**
 * Datasource for typeorm cli
 */
export const migrationsDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT || 3306,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: ['src/**/entities/*.ts'],
  migrations: ['migrations/*.ts'],
});
