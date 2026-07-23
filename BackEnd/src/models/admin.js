/**kimheng's part */

import db from '../config/database.js';

class AdminModel {
  static async findById(id) {
    const [rows] = await db.execute('SELECT * FROM admins WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async findByEmail(email) {
    const [rows] = await db.execute('SELECT * FROM admins WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async getAll() {
    const [rows] = await db.execute('SELECT id, name, email, role, created_at FROM admins');
    return rows;
  }

  static async create({ name, email, password, role = 'admin' }) {
    const [result] = await db.execute(
      'INSERT INTO admins (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return { id: result.insertId, name, email, role };
  }

  // NEW — used by the shared /auth/profile endpoint for admin accounts
  static async update(id, fields) {
    const allowed = ['name', 'email'];
    const updates = [];
    const values = [];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (updates.length === 0) return AdminModel.findById(id);

    values.push(id);
    await db.execute(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`, values);
    return AdminModel.findById(id);
  }

  // NEW — used by the shared /auth/password endpoint for admin accounts
  static async updatePassword(id, newPasswordHash) {
    await db.execute('UPDATE admins SET password = ? WHERE id = ?', [newPasswordHash, id]);
  }
}

export default AdminModel;
