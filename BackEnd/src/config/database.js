// config/database.js
// Shared — MySQL connection pool used by all members
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import mysql from 'mysql2/promise';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '..', '.env') });
const useSSL = process.env.DB_SSL === 'true';
const caPath = process.env.DB_SSL_CA_PATH
  ? join(__dirname, '..', '..', process.env.DB_SSL_CA_PATH)
  : null;
const sslConfig = caPath && fs.existsSync(caPath)
  ? { ca: fs.readFileSync(caPath), rejectUnauthorized: true }
  : { rejectUnauthorized: false };

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: 'Z',
  ...(useSSL ? { ssl: sslConfig } : {}),
});
export const dbConnectionConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ...(useSSL ? { ssl: sslConfig } : {}),
};

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const sslMode = !useSSL ? 'off' : sslConfig.rejectUnauthorized ? 'verified (CA)' : 'encrypted, unverified';
    console.log(
      `MySQL connected successfully (${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}, ssl=${sslMode})`
    );
    connection.release();
  } catch (error) {
    console.error('MySQL connection failed:', error.message);
  }
}

export default pool;