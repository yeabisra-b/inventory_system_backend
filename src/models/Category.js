import { DataTypes } from 'sequelize';
import { sequelize } from '../db/sequelize.js';

export const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true, // Corresponds to GENERATED ALWAYS AS IDENTITY
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: false
});
