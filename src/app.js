import express from "express";
import cors from "cors";

import categoryRoutes from "./routes/category.routes.js";
import partRoutes from "./routes/parts.routes.js";
import stockRoutes from "./routes/stock_movements.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import backupRoutes from "./routes/backup.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { sequelize } from "./models/index.js";

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
  try {
    await sequelize.authenticate();
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("Health check DB failure:", err);
    return res.status(503).json({ status: "error" });
  }
});

export default app;
