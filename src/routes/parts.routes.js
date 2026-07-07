import { Router } from "express";
import {
  getParts,
  getPartByID,
  createPart,
  updatePart,
} from "../controllers/parts.controller.js";

const router = Router();

router.get("/", getParts);
router.get("/:id", getPartByID);
router.post("/", createPart);
router.put("/:id", updatePart);

export default router;
