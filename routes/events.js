/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const nodemailer = require('nodemailer')
const db = require('../db')
require('dotenv').config()

// Set up multer for handling image uploads
const upload = multer({ dest: 'uploads/' })

router.post('/send-email', upload.single('image'), (req, res) => {
	const { message, recipients } = req.body
	const image = req.file // Get the uploaded image file

	// Parse and sanitize recipient emails
	let recipientList = []
	try {
		recipientList = JSON.parse(recipients).map((email) => email.trimEnd())
	} catch (error) {
		console.error('Invalid recipients format:', error)
		return res.status(400).json({ message: 'Invalid recipient list format.' })
	}

	// Validate email addresses
	const invalidEmails = recipientList.filter((email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
	if (invalidEmails.length > 0) {
		return res.status(400).json({ message: `Invalid email addresses: ${invalidEmails.join(', ')}` })
	}

	// Set up email transport
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_APP_PASSWORD,
		},
	})

	// Prepare email details
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: recipientList,
		subject: 'Subject of the Email', // You can make this dynamic if needed
		text: message,
		attachments: image
			? [
					{
						filename: path.basename(image.originalname),
						path: image.path, // Path to the uploaded image
					},
			  ]
			: [],
	}

	// Send the email
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.error('Error sending email:', error)
			return res.status(500).json({ message: 'Failed to send email' })
		}
		console.log('Email sent: ' + info.response)
		res.status(200).json({ message: 'Email sent successfully' })
	})
})

// Add a new event
router.post('/', (req, res) => {
	const { title, description, date, time, location, organizer, category, recurrence } = req.body
	const query = 'INSERT INTO events (title, description, date, time, location, organizer, category, recurrence) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
	db.query(query, [title, description, date, time, location, organizer, category, recurrence], (err, result) => {
		if (err) return res.status(500).json({ error: err.message })
		res.status(201).json({
			id: result.insertId,
			message: 'Event added successfully',
		})
	})
})

// Get all events
router.get('/', (req, res) => {
	const query = 'SELECT * FROM events'
	db.query(query, (err, results) => {
		if (err) return res.status(500).json({ error: err.message })
		res.status(200).json(results)
	})
})

// Update an event
router.put('/:id', (req, res) => {
	const eventId = req.params.id
	const { title, description, date, time, location, organizer, category, recurrence } = req.body
	const query = 'UPDATE events SET title = ?, description = ?, date = ?, time = ?, location = ?, organizer = ?, category = ?, recurrence = ? WHERE id = ?'
	db.query(query, [title, description, date, time, location, organizer, category, recurrence, eventId], (err, result) => {
		if (err) return res.status(500).json({ error: err.message })
		if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found' })
		res.status(200).json({ message: 'Event updated successfully' })
	})
})

// Archive (soft delete) or undo archive an event
router.put('/archive/:id', (req, res) => {
	const eventId = req.params.id
	const { status } = req.body

	// Check if we are undoing the archive (status is 'Active')
	if (status === 'Active') {
		const query = 'UPDATE events SET status = ? WHERE id = ?'
		db.query(query, [status, eventId], (err, result) => {
			if (err) return res.status(500).json({ error: err.message })
			if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found' })
			res.status(200).json({ message: 'Event status updated to Active' })
		})
	} else {
		// Archive the event (status is 'Archived')
		const query = 'UPDATE events SET status = ? WHERE id = ?'
		db.query(query, [status, eventId], (err, result) => {
			if (err) return res.status(500).json({ error: err.message })
			if (result.affectedRows === 0) return res.status(404).json({ message: 'Event not found' })
			res.status(200).json({ message: 'Event archived successfully' })
		})
	}
})

module.exports = router
