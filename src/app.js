import express from "express";
import cors from "cors";

import categoryRoutes from "./routes/category.routes.js";
import partRoutes from "./routes/parts.routes.js";
import stockRoutes from "./routes/stock_movements.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { pool } from "./db/db.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/categories", categoryRoutes);
app.use("/parts", partRoutes);
app.use("/stock_movements", stockRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/backup", backupRoutes);
app.use("/deleteall", adminRoutes);

app.get("/health", async (req, res) => {
  const startTime = Date.now();
  try {
    await pool.query("SELECT 1");
    return res.status(200).json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: "ok",
        responseTimeMs: Date.now() - startTime,
      },
    });
  } catch (err) {
    return res.status(503).json({
      status: "error",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: "unreachable",
        error: err.message,
      },
    });
  }
});

export default app;
