import { pool } from "../db/db.js";

export const getAllStockMovements = async (req, res) => {
  try {
    const result = await pool.query(`select * from stock_movements`);
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

    const result = await pool.query(
      `select * from stock_movements where part_id = $1 `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "stock movement not found" });
    }

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const stockIn = async (req, res) => {
  const client = await pool.connect();
  try {
    const { part_id, quantity, reason } = { ...req.body };

    await client.query("BEGIN");

    const result = await client.query(
      `insert into 
      stock_movements(movement_type,part_id,quantity,reason)
      values('IN',$1,$2,$3) returning *`,
      [part_id, quantity, reason],
    );

    const update_quantity = await client.query(
      `update parts set quantity = quantity + $1 where id = $2`,
      [quantity, part_id],
    );

    await client.query("COMMIT");
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);

    if (err.code === "23503") {
      return res.status(400).json({
        message: "Part doesn't exist",
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};

export const stockOut = async (req, res) => {
  const client = await pool.connect();
  try {
    const { part_id, quantity, reason } = { ...req.body };

    await client.query("BEGIN");

    const result = await client.query(
      `insert into 
      stock_movements(movement_type,part_id,quantity,reason)
      values('OUT',$1,$2,$3) returning *`,
      [part_id, quantity, reason],
    );

    const update_quantity = await client.query(
      `update parts set quantity = quantity - $1 where id = $2`,
      [quantity, part_id],
    );

    await client.query("COMMIT");

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);

    if (err.code === "23514") {
      return res.status(400).json({
        message: "Insufficient inventory stock.",
      });
    }
    if (err.code === "23503") {
      return res.status(400).json({
        message: "Part doesn't exist",
      });
    }

    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
};
