import express from "express";
import { sequelize } from "../models/index.js";

const router = express.Router();

// Destructive endpoint to clear all data
router.delete("/", async (req, res) => {
  try {
    await sequelize.query(
      "TRUNCATE TABLE stock_movements, parts, categories RESTART IDENTITY CASCADE"
    );
    res.json({ message: "All database records have been deleted successfully." });
  } catch (error) {
    console.error("Error resetting database:", error);
    res.status(500).json({ error: "Failed to reset database" });
  }
});

export default router;
