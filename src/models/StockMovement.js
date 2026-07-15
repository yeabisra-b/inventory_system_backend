import { DataTypes } from 'sequelize';
import { sequelize } from '../db/sequelize.js';
import { Part } from './Part.js';

export const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  part_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Part,
      key: 'id'
    }
  },
  movement_type: {
    type: DataTypes.ENUM('IN', 'OUT'),
    allowNull: false,
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  reason: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  movement_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stock_movements',
  timestamps: false
});

// Associations
Part.hasMany(StockMovement, { foreignKey: 'part_id' });
StockMovement.belongsTo(Part, { foreignKey: 'part_id', as: 'part' });
