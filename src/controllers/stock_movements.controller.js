import { pool } from "../db/db.js";

export const getAllStockMovements = async (req, res) => {
  try {
    const result = await pool.query(`select * from stock movements`);
    return res.status(200).json(result.rows);
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

    const result = pool.query(
      `select * from stock_movements where part_id = $1 `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "stock movement not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const stockIn = async (req, res) => {
  try {
    const { part_id, quantity, reason } = { ...req.body };

    const result = await pool.query(
      `insert into 
      stock_movements(movement_type,part_id,quantity,reason)
      values('IN',$1,$2,$3) returning *`,
      [part_id, quantity, reason],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const stockOut = async (req, res) => {
  try {
    const { part_id, quantity, reason } = { ...req.body };

    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) AS current_balance 
       FROM stock_movements 
       WHERE part_id = $1`,
      [part_id],
    );

    const currentBalance = Number.parseInt(
      balanceResult.rows[0].current_balance,
      10,
    );

    if (currentBalance < parsedQuantity) {
      return res.status(400).json({
        message: `Insufficient inventory. Available stock: ${currentBalance}, requested: ${parsedQuantity}.`,
      });
    }

    const negated_quantity = Number.parseInt(quantity) * -1;

    const result = await pool.query(
      `insert into 
      stock_movements(movement_type,part_id,quantity,reason)
      values('OUT',$1,$2,$3) returning *`,
      [part_id, negated_quantity, reason],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
