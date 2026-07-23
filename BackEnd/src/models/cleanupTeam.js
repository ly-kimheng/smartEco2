import pool from '../config/database.js';

const TABLE = 'cleanup_team';

async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT * FROM ${TABLE} WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, name, email, district, role, created_at FROM ${TABLE} WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function getAll() {
  const [rows] = await pool.query(
    `SELECT id, name, email, district, role, created_at FROM ${TABLE} ORDER BY name ASC`
  );
  return rows;
}

// NEW — lets a cleanup crew member edit their own name (email is fixed by admin on assignment)
async function update(id, fields) {
  const allowed = ['name', 'email'];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) return findById(id);

  values.push(id);
  await pool.query(
    `UPDATE ${TABLE} SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  return findById(id);
}

// NEW — used by changePassword controller
async function updatePassword(id, newPasswordHash) {
  await pool.query(
    `UPDATE ${TABLE} SET password = ? WHERE id = ?`,
    [newPasswordHash, id]
  );
}

export default { findByEmail, findById, getAll, update, updatePassword };