import { pool } from "../db/db.js";

export const exportBackup = async (req, res) => {
  try {
    const categoriesResult = await pool.query("SELECT * FROM categories");
    const partsResult = await pool.query("SELECT * FROM parts");
    const movementsResult = await pool.query("SELECT * FROM stock_movements");

    const backupData = {
      categories: categoriesResult.rows,
      parts: partsResult.rows,
      stock_movements: movementsResult.rows,
    };

    return res.status(200).json(backupData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to export backup" });
  }
};

export const importBackup = async (req, res) => {
  const client = await pool.connect();
  try {
    const { categories = [], parts = [], stock_movements = [] } = req.body;

    await client.query("BEGIN");

    // Clear existing data in reverse order of dependencies
    await client.query("DELETE FROM stock_movements");
    await client.query("DELETE FROM parts");
    await client.query("DELETE FROM categories");

    // Restore categories
    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, name, description)
         OVERRIDING SYSTEM VALUE
         VALUES ($1, $2, $3)`,
        [cat.id, cat.name, cat.description]
      );
    }
    // Update category sequence so new inserts work
    if (categories.length > 0) {
      await client.query("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))");
    }

    // Restore parts
    for (const part of parts) {
      await client.query(
        `INSERT INTO parts (id, name, description, quantity, unit_price, category_id, is_active, low_bound, created_at, updated_at)
         OVERRIDING SYSTEM VALUE
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          part.id, part.name, part.description, part.quantity, part.unit_price, 
          part.category_id, part.is_active, part.low_bound, part.created_at, part.updated_at
        ]
      );
    }
    if (parts.length > 0) {
      await client.query("SELECT setval('parts_id_seq', (SELECT MAX(id) FROM parts))");
    }

    // Restore stock movements
    for (const mov of stock_movements) {
      await client.query(
        `INSERT INTO stock_movements (id, movement_type, part_id, quantity, reason, unit_price, movement_date)
         OVERRIDING SYSTEM VALUE
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          mov.id, mov.movement_type, mov.part_id, mov.quantity, 
          mov.reason, mov.unit_price, mov.movement_date
        ]
      );
    }
    if (stock_movements.length > 0) {
      await client.query("SELECT setval('stock_movements_id_seq', (SELECT MAX(id) FROM stock_movements))");
    }

    await client.query("COMMIT");
    return res.status(200).json({ message: "Backup imported successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ message: "Failed to import backup" });
  } finally {
    client.release();
  }
};
