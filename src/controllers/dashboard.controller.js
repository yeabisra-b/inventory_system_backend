import { Part, Category, StockMovement, sequelize } from "../models/index.js";
import { Op, QueryTypes } from "sequelize";

export const getDashboardStats = async (req, res) => {
  try {
    const stats = {};

    stats.total_parts = await Part.count({ where: { is_active: true } });
    
    stats.total_categories = await Category.count();

    const valueResult = await Part.findAll({
      attributes: [[sequelize.literal("SUM(quantity * unit_price)"), "total_value"]],
      where: { is_active: true },
      raw: true,
    });
    stats.total_stock_value = parseFloat(valueResult[0].total_value) || 0;

    stats.low_stock_parts = await Part.findAll({
      attributes: ["id", "name", "quantity", "low_bound", "unit_price"],
      where: {
        is_active: true,
        quantity: {
          [Op.lte]: sequelize.col("low_bound"),
        },
      },
      order: [["quantity", "ASC"]],
      limit: 50,
      raw: true,
    });

    const recentMovements = await StockMovement.findAll({
      include: [{ model: Part, as: "part", attributes: ["name"] }],
      attributes: ["id", "movement_type", "quantity", "movement_date"],
      order: [["movement_date", "DESC"]],
      limit: 50,
    });
    
    stats.recent_movements = recentMovements.map((m) => {
      const rm = m.toJSON();
      rm.part_name = rm.part?.name;
      delete rm.part;
      return rm;
    });

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
        AND movement_date >= CURRENT_DATE - INTERVAL '1 day' * :limit
      GROUP BY DATE(movement_date)
      ORDER BY DATE(movement_date) ASC
    `;

    const result = await sequelize.query(query, {
      replacements: { limit },
      type: QueryTypes.SELECT,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
