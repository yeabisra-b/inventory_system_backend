import { pool } from "../db/index.js";

export const getAllCategories = async (req, res) => {
  try {
    const result = await pool.query("select * from categories");
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Failed to retrieve categories.",
    });
  }
};

export const getCategory = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await pool.query(`select * from categories where id=$1`,[id]);
    res.status(200).json(result.rows);
  } catch (err) {
    console.log(err);
    result.status(500).json({
      message: "failed to get the category",
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "category name is required" });
    }

    const result = await pool.query(
      `insert into categories(name, description)
       values ($1,$2) 
       returning *;`,
      [name, description],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({
        message: "Category already exists.",
      });
    }

    console.error(err);

    res.status(500).json({
      message: "Failed to create category.",
    });
  }
};
