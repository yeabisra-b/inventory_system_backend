import { Router } from "express";
import { getDashboardStats, getDailySales } from "../controllers/dashboard.controller.js";

const router = Router();

router.get("/", getDashboardStats);
router.get("/daily-sales", getDailySales);

export default router;
