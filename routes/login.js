/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// Endpoint for login authentication
router.post('/', (req, res) => {
	const { username, password } = req.body

	const query = 'SELECT * FROM admins WHERE username = ?'
	db.query(query, [username], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}

		if (results.length === 0) {
			return res.status(401).json({ message: 'Invalid username or password' })
		}

		const user = results[0]
		// Optionally compare hashed passwords if using bcrypt
		if (password === user.password) {
			res.status(200).json({ message: 'Login successful', userId: user.id })
		} else {
			res.status(401).json({ message: 'Invalid username or password' })
		}
	})
})

module.exports = router
