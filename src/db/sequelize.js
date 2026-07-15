import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

export const sequelize = new Sequelize(process.env.Database_url, {
  dialect: 'postgres',
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: false
  }
});
