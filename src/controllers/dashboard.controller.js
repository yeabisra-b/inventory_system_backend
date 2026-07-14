import { pool } from "../db/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    const stats = {};

    // 1. Total active parts
    const partsResult = await pool.query(
      `SELECT count(*) FROM parts WHERE is_active = true`
    );
    stats.total_parts = parseInt(partsResult.rows[0].count, 10);

    // 2. Total categories
    const categoriesResult = await pool.query(
      `SELECT count(*) FROM categories`
    );
    stats.total_categories = parseInt(categoriesResult.rows[0].count, 10);

    // 3. Total stock value
    const valueResult = await pool.query(
      `SELECT sum(quantity * unit_price) as total_value FROM parts WHERE is_active = true`
    );
    stats.total_stock_value = parseFloat(valueResult.rows[0].total_value) || 0;

    // 4. Low stock parts (active parts with quantity <= 5)
    const lowStockResult = await pool.query(
      `SELECT id, name, quantity, unit_price FROM parts WHERE is_active = true AND quantity <= 5 ORDER BY quantity ASC LIMIT 5`
    );
    stats.low_stock_parts = lowStockResult.rows;

    // 5. Recent stock movements
    const recentMovementsResult = await pool.query(
      `SELECT sm.id, sm.movement_type, sm.quantity, sm.movement_date, p.name as part_name 
       FROM stock_movements sm 
       JOIN parts p ON sm.part_id = p.id 
       ORDER BY sm.movement_date DESC LIMIT 5`
    );
    stats.recent_movements = recentMovementsResult.rows;

    return res.status(200).json(stats);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getDailySales = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const limit = parseInt(days, 10);
    
    if (isNaN(limit) || limit <= 0) {
      return res.status(400).json({ message: "Invalid days parameter" });
    }

    const query = `
      SELECT 
        DATE(movement_date) as date, 
        SUM(quantity) as total_quantity, 
        SUM(quantity * unit_price) as total_sales
      FROM stock_movements
      WHERE movement_type = 'OUT'
        AND movement_date >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY DATE(movement_date)
      ORDER BY DATE(movement_date) ASC
    `;

    const result = await pool.query(query, [limit]);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
