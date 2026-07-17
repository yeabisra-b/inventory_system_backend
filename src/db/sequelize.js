import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Standard regex to pull out your connection details dynamically from your string
const connectionString = process.env.Database_url;
const matches = connectionString.match(/postgres:\/\/([^:]+):([^@]+)@([^:]+):([^/]+)\/(.+)/);

const [_, username, password, host, port, databaseAndQuery] = matches;
const database = databaseAndQuery.split('?')[0];

export const sequelize = new Sequelize(database, username, password, {
  host: host,
  port: port,
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: false
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Now Node is forced to respect this rule
    }
  }
});