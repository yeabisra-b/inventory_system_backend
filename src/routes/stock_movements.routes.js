import { Router } from "express";
import {
  getAllStockMovements,
  getStockMovementByPartID,
  stockIn,
  stockOut,
} from "../controllers/stock_movements.controller.js";

const router = Router();

router.get("/", getAllStockMovements);
router.get("/:id", getStockMovementByPartID);
router.post("/in/", stockIn);
router.post("/out", stockOut);

export default router;
