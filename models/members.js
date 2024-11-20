/* eslint-disable no-undef */
// models/member.js
const { Model, DataTypes } = require("sequelize")
const sequelize = require("../database") // Import your database connection

class Member extends Model {}

Member.init(
    {
        name: DataTypes.STRING,
        dob: DataTypes.DATE,
        age: DataTypes.INTEGER,
        gender: DataTypes.STRING,
        address: DataTypes.STRING,
        phone: DataTypes.STRING,
        medical_conditions: DataTypes.STRING,
        medications: DataTypes.STRING,
        allergies: DataTypes.STRING,
        emergency_contact: DataTypes.STRING,
        last_updated: DataTypes.DATE,
    },
    { sequelize, modelName: "member" },
)

module.exports = Member
