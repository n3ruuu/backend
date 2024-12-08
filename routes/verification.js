const express = require('express')
const bodyParser = require('body-parser')
const nodemailer = require('nodemailer')
const bcrypt = require('bcryptjs')
const mysql = require('mysql2')
const crypto = require('crypto')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
	service: 'Gmail',
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_APP_PASSWORD,
	},
})

// Endpoint to Send Verification Code
router.post('/send-verification-code', (req, res) => {
	const { email } = req.body
	const code = crypto.randomInt(100000, 999999).toString() // Generate a 6-digit code
	const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // Expires in 15 minutes

	// Insert code into the database
	db.query('INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, expires_at = ?', [email, code, expiresAt, code, expiresAt], (err) => {
		if (err) {
			console.error('Database error:', err) // Log the database error
			return res.status(500).send('Error saving verification code.')
		}

		// Send email
		transporter.sendMail(
			{
				from: process.env.EMAIL_USER,
				to: email,
				subject: 'Your Verification Code',
				text: `Your verification code is ${code}. It will expire in 15 minutes.`,
			},
			(mailErr) => {
				if (mailErr) {
					console.error('Email sending error:', mailErr) // Log the email sending error
					return res.status(500).send('Error sending email.')
				}
				res.status(200).send('Verification code sent.')
			}
		)
	})
})

// Endpoint to Verify Code
router.post('/verify-code', (req, res) => {
	const { email, code } = req.body

	db.query('SELECT * FROM verification_codes WHERE email = ? AND code = ? AND expires_at > NOW()', [email, code], (err, results) => {
		if (err) return res.status(500).send('Error verifying code.')
		if (results.length === 0) return res.status(400).send('Invalid or expired code.')

		res.status(200).send('Code verified.')
	})
})

// Endpoint to reset password
router.post('/reset-password', (req, res) => {
	const { email, newPassword } = req.body

	// Check if the email exists in the database
	db.query('SELECT * FROM admins WHERE email = ?', [email], (err, results) => {
		if (err) {
			console.error('Database error:', err)
			return res.status(500).send('Error retrieving user data.')
		}

		if (results.length === 0) {
			return res.status(404).send('User not found.')
		}

		// Update the password (no hashing)
		db.query('UPDATE admins SET password = ? WHERE email = ?', [newPassword, email], (updateErr) => {
			if (updateErr) {
				console.error('Error updating password:', updateErr)
				return res.status(500).send('Failed to reset password.')
			}
			res.status(200).send('Password reset successfully.')
		})
	})
})

module.exports = router
