import { Router } from "express";
import {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.get("/", getAllCategories);
router.get("/:id", getCategory);
router.post("/", createCategory);
router.put("/update", updateCategory);
router.delete("/:id", deleteCategory);

export default router;
