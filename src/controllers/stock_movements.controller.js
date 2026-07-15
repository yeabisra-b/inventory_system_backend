import { sequelize, StockMovement, Part } from "../models/index.js";
import { QueryTypes } from "sequelize";

export const getAllStockMovements = async (req, res) => {
  try {
    const query = `
      SELECT
        sm.id,
        sm.part_id,
        p.name          AS part_name,
        sm.movement_type,
        sm.quantity,
        sm.reason,
        sm.unit_price,
        sm.movement_date,
        SUM(
          CASE sm.movement_type
            WHEN 'IN'  THEN  sm.quantity
            WHEN 'OUT' THEN -sm.quantity
          END
        ) OVER (
          PARTITION BY sm.part_id
          ORDER BY sm.movement_date, sm.id
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS remaining_stock
      FROM stock_movements sm
      JOIN parts p ON p.id = sm.part_id
      ORDER BY sm.movement_date DESC, sm.id DESC
    `;
    
    // We use sequelize.query for window functions which are complex to map in pure ORM syntax
    const movements = await sequelize.query(query, { type: QueryTypes.SELECT });
    return res.status(200).json(movements);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getStockMovementByPartID = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid Part id" });
    }

    const movements = await StockMovement.findAll({
      where: { part_id: id }
    });

    if (movements.length === 0) {
      return res.status(404).json({ message: "stock movement not found" });
    }

    return res.status(200).json(movements);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const stockIn = async (req, res) => {
  try {
    const { part_id, quantity, reason } = req.body;

    const movement = await sequelize.transaction(async (t) => {
      const part = await Part.findByPk(part_id, { transaction: t });
      
      if (!part) {
        throw new Error("PartNotFound");
      }

      const newMovement = await StockMovement.create({
        movement_type: 'IN',
        part_id,
        quantity,
        reason,
        unit_price: part.unit_price
      }, { transaction: t });

      part.quantity += quantity;
      await part.save({ transaction: t });

      const result = newMovement.toJSON();
      result.part_name = part.name;
      result.remaining_stock = part.quantity;
      return result;
    });

    return res.status(201).json(movement);
  } catch (err) {
    if (err.message === "PartNotFound") {
      return res.status(400).json({ message: "Part doesn't exist" });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const stockOut = async (req, res) => {
  try {
    const { part_id, quantity, reason } = req.body;

    const movement = await sequelize.transaction(async (t) => {
      const part = await Part.findByPk(part_id, { transaction: t });
      
      if (!part) {
        throw new Error("PartNotFound");
      }

      if (part.quantity < quantity) {
        throw new Error("InsufficientStock");
      }

      const newMovement = await StockMovement.create({
        movement_type: 'OUT',
        part_id,
        quantity,
        reason,
        unit_price: part.unit_price
      }, { transaction: t });

      part.quantity -= quantity;
      await part.save({ transaction: t });

      const result = newMovement.toJSON();
      result.part_name = part.name;
      result.remaining_stock = part.quantity;
      return result;
    });

    return res.status(201).json(movement);
  } catch (err) {
    if (err.message === "InsufficientStock" || err.name === "SequelizeDatabaseError") {
      return res.status(400).json({ message: "Insufficient inventory stock." });
    }
    if (err.message === "PartNotFound") {
      return res.status(400).json({ message: "Part doesn't exist" });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
