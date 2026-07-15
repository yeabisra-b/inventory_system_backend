import { Part, Category, StockMovement, sequelize } from "../models/index.js";

export const exportBackup = async (req, res) => {
  try {
    const categories = await Category.findAll({ raw: true });
    const parts = await Part.findAll({ raw: true });
    const stock_movements = await StockMovement.findAll({ raw: true });
    
    const backupData = {
      categories,
      parts,
      stock_movements,
    };

    return res.status(200).json(backupData);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to export backup" });
  }
};

export const importBackup = async (req, res) => {
  try {
    const { categories = [], parts = [], stock_movements = [] } = req.body;

    await sequelize.transaction(async (t) => {
      // Clear existing data (using raw query since TRUNCATE ... CASCADE is easiest)
      await sequelize.query("TRUNCATE TABLE stock_movements, parts, categories RESTART IDENTITY CASCADE", { transaction: t });

      // Restore categories
      for (const cat of categories) {
        await sequelize.query(
          `INSERT INTO categories (id, name, description)
           OVERRIDING SYSTEM VALUE
           VALUES ($1, $2, $3)`,
          { bind: [cat.id, cat.name, cat.description], transaction: t }
        );
      }
      // Update category sequence so new inserts work
      if (categories.length > 0) {
        await sequelize.query("SELECT setval('categories_id_seq', (SELECT MAX(id) FROM categories))", { transaction: t });
      }

      // Restore parts
      for (const part of parts) {
        await sequelize.query(
          `INSERT INTO parts (id, name, description, quantity, unit_price, category_id, is_active, low_bound, created_at, updated_at)
           OVERRIDING SYSTEM VALUE
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          {
            bind: [
              part.id, part.name, part.description, part.quantity, part.unit_price, 
              part.category_id, part.is_active, part.low_bound, part.created_at, part.updated_at
            ],
            transaction: t
          }
        );
      }
      if (parts.length > 0) {
        await sequelize.query("SELECT setval('parts_id_seq', (SELECT MAX(id) FROM parts))", { transaction: t });
      }

      // Restore stock movements
      for (const mov of stock_movements) {
        await sequelize.query(
          `INSERT INTO stock_movements (id, movement_type, part_id, quantity, reason, unit_price, movement_date)
           OVERRIDING SYSTEM VALUE
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          {
            bind: [
              mov.id, mov.movement_type, mov.part_id, mov.quantity, 
              mov.reason, mov.unit_price, mov.movement_date
            ],
            transaction: t
          }
        );
      }
      if (stock_movements.length > 0) {
        await sequelize.query("SELECT setval('stock_movements_id_seq', (SELECT MAX(id) FROM stock_movements))", { transaction: t });
      }
    });

    return res.status(200).json({ message: "Backup imported successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Failed to import backup" });
  }
};
