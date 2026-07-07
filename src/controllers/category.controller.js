import { pool } from "../db/db.js";

export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query("select * from categories");
    return res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Failed to retrieve categories.",
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "invalid category id" });
    }

    const result = await pool.query(`select * from categories where id=$1`, [
      id,
    ]);

    if (!result.rows[0]) {
      return res.status(404).json({ message: "category not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "server error",
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const validatedName = typeof name === "string" ? name.trim() : "";

    if (!validatedName) {
      return res.status(400).json({ message: "category name is required" });
    }

    const result = await pool.query(
      `insert into categories(name, description)
       values ($1,$2) 
       returning *;`,
      [validatedName, description],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "Category already exists.",
      });
    }

    console.error(err);

    return res.status(500).json({
      message: "Failed to create category.",
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "invalid category id" });
    }

    const db_result = await pool.query(`select * from categories where id=$1`, [
      id,
    ]);
    if (db_result.rows.length === 0) {
      return res.status(404).json({ message: "category not found" });
    }
    const { name, description } = { ...db_result.rows[0], ...req.body };
    const validatedName = typeof name === "string" ? name.trim() : "";

    if (!validatedName) {
      return res.status(400).json({ message: "category name is required" });
    }

    const result = await pool.query(
      `update categories
       set name = $1, description = $2 
       where id = $3 
       returning *;`,
      [validatedName, description, id],
    );

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "invalid category id" });
    }
    const result = await pool.query(
      `delete from categories
         where id = $1
          returning *`,
      [id],
    );
    if (!result.rows[0]) {
      return res.status(404).json({ message: "category not found" });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.log(err.code);
    return res.status(500).json({ message: "server error" });
  }
};
