import { DataTypes } from "sequelize";
import sequelize from "../db/mysql.js";

const SimulationState = sequelize.define(
  "SimulationState",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    cashBalance: { type: DataTypes.FLOAT, defaultValue: 10000 }, // Start with $10,000
    holdings: { type: DataTypes.JSON, defaultValue: {} }, // e.g., { "AAPL": 10, "TSLA": 5 }
  },
  {
    timestamps: true,
  }
);

export default SimulationState;
