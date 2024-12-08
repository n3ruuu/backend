/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// Endpoint for login authentication (using username or email)
router.post('/', (req, res) => {
	const { identifier, password } = req.body

	// Validate input fields
	if (!identifier || !password) {
		return res.status(400).json({ message: 'Username/email and password are required.' })
	}

	const query = 'SELECT * FROM admins WHERE username = ? OR email = ?'
	db.query(query, [identifier, identifier], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}

		if (results.length === 0) {
			return res.status(401).json({ message: 'Invalid username/email or password' })
		}

		const user = results[0]

		// For plain password comparison (not recommended for production)
		if (password === user.password) {
			res.status(200).json({
				message: 'Login successful',
				userId: user.id,
				username: user.username,
				email: user.email,
			})
		} else {
			res.status(401).json({ message: 'Invalid username/email or password' })
		}
	})
})

// New endpoint to check if an email exists
router.get('/check-email', (req, res) => {
	const { email } = req.query

	if (!email) {
		return res.status(400).json({ error: 'Email is required' })
	}

	const query = 'SELECT * FROM admins WHERE email = ?'
	db.query(query, [email], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}

		if (results.length > 0) {
			res.status(200).json({ exists: true, message: 'Email found in admins table' })
		} else {
			res.status(404).json({ exists: false, message: 'Email not found in admins table' })
		}
	})
})

module.exports = router
