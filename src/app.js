import express from "express";
import cors from "cors";

import categoryRoutes from "./routes/category.routes.js";
import partRoutes from "./routes/parts.routes.js";
import stockRoutes from "./routes/stock_movements.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/categories", categoryRoutes);
app.use("/parts", partRoutes);
app.use("/stock_movements", stockRoutes);
app.use("/dashboard", dashboardRoutes);

export default app;
