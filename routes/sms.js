const express = require('express')
const axios = require('axios')
const router = express.Router()
const mysql = require('mysql2')
require('dotenv').config()

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
})

db.connect((err) => {
	if (err) throw err
	console.log('Connected to the MySQL database')
})

router.post('/', async (req, res) => {
	const { number, message } = req.body
	const apiKey = process.env.SEMAPHORE_API_KEY

	// Input Validation
	if (!number || !message) {
		return res.status(400).json({ error: 'Number and message are required' })
	}

	if (!apiKey) {
		return res.status(500).json({ error: 'Missing Semaphore API Key in environment variables' })
	}

	try {
		// Sending SMS via Semaphore API
		const response = await axios.post('https://api.semaphore.co/api/v4/messages', {
			apikey: apiKey,
			number,
			message,
		})

		// Responding with success
		res.status(200).json({ success: true, data: response.data })
	} catch (error) {
		console.error('Error sending SMS:', error.message || error.response?.data)

		res.status(500).json({
			success: false,
			error: error.response?.data || 'An error occurred while sending SMS',
		})
	}
})

module.exports = router
