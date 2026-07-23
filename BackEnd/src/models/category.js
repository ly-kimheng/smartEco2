// models/category.js
// Member 2 — Report categories (used in report form dropdown)

import pool from '../config/database.js';

class Category {
  // Get all available categories
  static async getAll() {
    const [rows] = await pool.execute(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    return rows;
  }

  // Get a single category by ID
  static async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  // Get a category by name (useful for validation)
  static async findByName(name) {
    const [rows] = await pool.execute(
      'SELECT * FROM categories WHERE name = ?',
      [name]
    );
    return rows[0] || null;
  }
}

export default Category;