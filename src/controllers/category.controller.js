import { Category } from "../models/index.js";

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll();
    return res.status(200).json(categories);
  } catch (err) {
    console.error(err);
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

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }
    return res.status(200).json(category);
  } catch (err) {
    console.error(err);
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

    const category = await Category.create({ name: validatedName, description });

    return res.status(201).json(category);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
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

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }

    const name = req.body.name !== undefined ? req.body.name : category.name;
    const description = req.body.description !== undefined ? req.body.description : category.description;
    
    const validatedName = typeof name === "string" ? name.trim() : "";

    if (!validatedName) {
      return res.status(400).json({ message: "category name is required" });
    }

    await category.update({ name: validatedName, description });

    return res.status(200).json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ message: "invalid category id" });
    }
    
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: "category not found" });
    }

    await category.destroy();
    
    return res.status(200).json(category);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "server error" });
  }
};
