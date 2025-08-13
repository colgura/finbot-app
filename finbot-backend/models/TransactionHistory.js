import { DataTypes } from "sequelize";
import sequelize from "../db/mysql.js";

const TransactionHistory = sequelize.define(
  "TransactionHistory",
  {
    userId: { type: DataTypes.INTEGER, allowNull: false },
    stockSymbol: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM("BUY", "SELL"), allowNull: false },
    qty: { type: DataTypes.INTEGER, allowNull: false },
    price: { type: DataTypes.FLOAT, allowNull: false },
  },
  {
    timestamps: true,
  }
);

export default TransactionHistory;
