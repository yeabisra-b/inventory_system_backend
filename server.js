import dotenv from "dotenv";
import app from "./src/app.js";
import { sequelize } from "./src/models/index.js";

dotenv.config();

const port = process.env.port || 3000;

try {
  await sequelize.sync();
  console.log("Database synced successfully with Sequelize.");
  
  app.listen(port, () => {
    console.log(`listening on port ${port}`);
  });
} catch (error) {
  console.error("Unable to connect to the database:", error);
}
