import { Router } from "express";
import {
  getParts,
  getPartByID,
  createPart,
  updatePart,
  deactivatePart,
  activatePart,
  searchParts,
} from "../controllers/parts.controller.js";

const router = Router();

router.get("/", getParts);
router.get("/search", searchParts);
router.post("/", createPart);
router.get("/:id", getPartByID);
router.put("/:id", updatePart);
router.patch("/:id/deactivate", deactivatePart);
router.patch("/:id/activate", activatePart);

export default router;
