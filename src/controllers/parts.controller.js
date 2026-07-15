import { Part, Category, StockMovement } from "../models/index.js";
import { Op } from "sequelize";

export const getParts = async (req, res) => {
  try {
    const parts = await Part.findAll({
      include: [{ model: Category, as: "category", attributes: ["name"] }],
      order: [["id", "ASC"]],
    });
    
    const result = parts.map((p) => {
      const part = p.toJSON();
      part.category = part.category?.name;
      return part;
    });

    return res.status(200).json(result);
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

    const part = await Part.findByPk(id);

    if (!part) {
      return res.status(404).json({ message: "part not found" });
    }

    return res.status(200).json(part);
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

    const validatedName = typeof name === "string" ? name.trim() : "";

    if (!validatedName) {
      return res.status(400).json({ message: "Part name is required" });
    }

    const part = await Part.create({
      name: validatedName,
      description,
      category_id,
      quantity,
      unit_price,
      low_bound,
    });

    if (quantity > 0) {
      await StockMovement.create({
        movement_type: "IN",
        part_id: part.id,
        quantity,
        reason: "Initial Stock",
        unit_price,
      });
    }

    const partWithCategory = await Part.findByPk(part.id, {
      include: [{ model: Category, as: "category", attributes: ["name"] }],
    });

    const result = partWithCategory.toJSON();
    result.category = result.category?.name;

    return res.status(201).json(result);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
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

    const part = await Part.findByPk(id);

    if (!part) {
      return res.status(404).json({ message: "part not found" });
    }

    let {
      name,
      description,
      quantity,
      unit_price,
      category_id,
      category: categoryName,
      low_bound,
    } = req.body;

    if (categoryName) {
      const cat = await Category.findOne({ where: { name: categoryName } });
      if (!cat) {
        return res
          .status(404)
          .json({ message: "category with that name doesn't exist" });
      }
      category_id = cat.id;
    }

    const validatedName = name !== undefined ? name.trim() : part.name;

    if (!validatedName) {
      return res.status(400).json({ message: "Part name is required" });
    }

    await part.update({
      name: validatedName,
      description: description !== undefined ? description : part.description,
      unit_price: unit_price !== undefined ? unit_price : part.unit_price,
      quantity: quantity !== undefined ? quantity : part.quantity,
      category_id: category_id !== undefined ? category_id : part.category_id,
      low_bound: low_bound !== undefined ? low_bound : part.low_bound,
      updated_at: new Date(),
    });

    const partWithCategory = await Part.findByPk(part.id, {
      include: [{ model: Category, as: "category", attributes: ["name"] }],
    });

    const result = partWithCategory.toJSON();
    result.category = result.category?.name;

    return res.status(200).json(result);
  } catch (err) {
    if (err.name === "SequelizeUniqueConstraintError") {
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
    
    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    await part.update({ is_active: false, updated_at: new Date() });
    
    return res.status(200).json(part);
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
    
    const part = await Part.findByPk(id);
    if (!part) {
      return res.status(404).json({ message: "Part not found" });
    }

    await part.update({ is_active: true, updated_at: new Date() });
    
    return res.status(200).json(part);
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

    const where = {
      name: { [Op.iLike]: `%${searchTerm}%` },
    };

    const include = [{ model: Category, as: "category", attributes: ["name"] }];
    
    if (category?.trim()) {
      include[0].where = { name: category.trim() };
    }

    const parts = await Part.findAll({ where, include });

    const result = parts.map((p) => {
      const part = p.toJSON();
      part.category = part.category?.name;
      return part;
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
