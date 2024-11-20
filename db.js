// db.js
const { Sequelize } = require('sequelize')
require('dotenv').config()

// Create a Sequelize instance and connect to the database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
	host: process.env.DB_HOST,
	dialect: 'mysql', // specify MySQL as the database dialect
	logging: false, // You can enable or disable SQL logging here
})

sequelize
	.authenticate()
	.then(() => {
		console.log('Database connected successfully')
	})
	.catch((err) => {
		console.error('Database connection failed:', err.message)
	})

module.exports = sequelize
