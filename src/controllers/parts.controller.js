import { pool } from "../db/db.js";
import { stockIn } from "./stock_movements.controller.js";

export const getParts = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category 
      FROM parts p 
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.id ASC
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const getPartByID = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid part id" });
    }

    const result = await pool.query(`select * from parts where id=$1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "part not found" });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const createPart = async (req, res) => {
  try {
    const { name, description, category_id, unit_price } = req.body;

    const quantity = req.body.quantity === undefined ? 0 : req.body.quantity;
    const low_bound = req.body.low_bound === undefined ? 0 : req.body.low_bound;
    const result = await pool.query(
      `WITH inserted AS (
         insert into parts(name,description,category_id,quantity,unit_price,low_bound)
         values($1,$2,$3,$4,$5,$6)
         returning *
       )
       SELECT i.*, c.name as category
       FROM inserted i
       LEFT JOIN categories c ON i.category_id = c.id`,
      [name, description, category_id, quantity, unit_price, low_bound],
    );
    if (quantity > 0) {
      await pool.query(
        `insert into stock_movements(movement_type, part_id, quantity, reason, unit_price)
         values('IN', $1, $2, 'Initial Stock', $3)`,
        [result.rows[0].id, quantity, unit_price]
      );
    }

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "Part already exists.",
      });
    }

    console.error(err);

    return res.status(500).json({ message: "server error" });
  }
};

export const updatePart = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid Part id" });
    }

    const db_result = await pool.query(`select * from parts where id=$1`, [id]);

    if (db_result.rows.length === 0) {
      return res.status(404).json({ message: "part not found" });
    }

    let {
      name,
      description,
      quantity,
      unit_price,
      category_id,
      category,
      low_bound,
    } = {
      ...db_result.rows[0],
      ...req.body,
    };

    if (category) {
      const category_id_array = await pool.query(
        `select id from categories where name = $1`,
        [category],
      );

      if (category_id_array.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "category with that name doesn't exist" });
      }

      category_id = category_id_array.rows[0].id;
    }

    const validatedName = typeof name === "string" ? name.trim() : "";

    if (!validatedName) {
      return res.status(400).json({ message: "Part name is required" });
    }

    const result = await pool.query(
      `WITH updated AS (
         update parts
         set name = $1,
         description = $2,
         unit_price = $3,
         quantity = $4,
         category_id = $5,
         low_bound = $6,
         updated_at = CURRENT_TIMESTAMP
         where id = $7
         returning *
       )
       SELECT u.*, c.name as category
       FROM updated u
       LEFT JOIN categories c ON u.category_id = c.id`,
      [
        validatedName,
        description,
        unit_price,
        quantity,
        category_id,
        low_bound,
        id,
      ],
    );

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "A part with that name already exists.",
      });
    }
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const deactivatePart = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid part id" });
    }
    const result = await pool.query(
      `update parts
         set is_active = false, updated_at = CURRENT_TIMESTAMP
         where id = $1
          returning *`,
      [id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: "Part not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const activatePart = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid part id" });
    }
    const result = await pool.query(
      `update parts
         set is_active = true, updated_at = CURRENT_TIMESTAMP
         where id = $1
          returning *`,
      [id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: "Part not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    return res.status(500).json({ message: "Internal server error" });
  }
};

export const searchParts = async (req, res) => {
  try {
    const { q, category } = req.query;

    const searchTerm = q?.trim();

    if (!searchTerm) {
      return res.status(400).json({
        message: "Search term is required.",
      });
    }
    let query = `select p.id,
                        p.name,
                        p.description,
                        p.quantity,
                        p.unit_price,
                        p.created_at,
                        p.updated_at,
                        c.id as category_id,
                        c.name as category 
                        from parts p
                        join categories c
                        on p.category_id = c.id
                        where p.name ilike $1 || '%'
                        `;

    let query_parameters = [searchTerm];
    if (category?.trim()) {
      query += ` and c.name = $2`;
      query_parameters.push(category);
    }

    const result = await pool.query(query, query_parameters);

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
