// src/models/user.js
import pool from '../config/database.js';

const TABLE = 'users';

export async function createUser({ name, email, passwordHash }) {
  const [result] = await pool.query(
    `INSERT INTO ${TABLE} (name, email, password, points, created_at)
     VALUES (?, ?, ?, 0, NOW())`,
    [name, email, passwordHash]
  );
  return findUserById(result.insertId);
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query(
    `SELECT * FROM ${TABLE} WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, points, created_at FROM ${TABLE} WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

export async function updateUser(id, fields) {
  const allowed = ['name', 'email'];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) return findUserById(id);

  values.push(id);
  await pool.query(
    `UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return findUserById(id);
}

// NEW — used by changePassword controller
export async function updatePassword(id, newPasswordHash) {
  await pool.query(
    `UPDATE ${TABLE} SET password = ? WHERE id = ?`,
    [newPasswordHash, id]
  );
}