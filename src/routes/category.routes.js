import { Router } from "express";
import { getAllCategories ,getCategory ,createCategory} from "../controllers/category.controller.js";

const router = Router();

router.get("/",getAllCategories);
router.get("/:id",getCategory);
router.post("/",createCategory);

export default router;