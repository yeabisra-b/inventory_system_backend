import { pool } from "../db/db.js";

export const getParts = async (req, res) => {
  try {
    const result = await pool.query(`select * from parts`);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
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
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const createPart = async (req, res) => {
  try {
    const { name, description, category, unit_price } = req.body;

    const quantity = req.body.quantity === undefined ? 0 : req.body.quantity;

    const result = await pool.query(
      `insert into 
        parts(name,description,category_id,quantity,unit_price)
        values($1,$2,
        (select id from categories where name = $3),
        $4,$5)
        returning *`,
      [name, description, category, quantity, unit_price],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "Part already exists.",
      });
    }

    console.log(err);

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

    let { name, description, quantity, unit_price, category_id, category } = {
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
      ` update parts
        set name = $1,
        description = $2,
        unit_price = $3,
        quantity = $4,
        category_id = $5,
        updated_at = CURRENT_TIMESTAMP
        where id = $6
        returning *`,
      [validatedName, description, unit_price, quantity, category_id, id],
    );

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "A part with that name already exists.",
      });
    }
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const deletePart = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "Invalid part id" });
    }
    const result = await pool.query(
      `delete from parts
         where id = $1
          returning *`,
      [id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: "Part not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23503") {
      return res.status(409).json({
        message: "Cannot delete a part that has stock movement history.",
      });
    }
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
