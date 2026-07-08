import { Router } from "express";
import {
  getParts,
  getPartByID,
  createPart,
  updatePart,
  deletePart,
  searchParts,
} from "../controllers/parts.controller.js";

const router = Router();

router.get("/", getParts);
router.get("/search", searchParts);
router.post("/", createPart);
router.get("/:id", getPartByID);
router.put("/:id", updatePart);
router.delete("/:id", deletePart);

export default router;
