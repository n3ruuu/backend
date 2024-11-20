/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// Add a new event
router.post('/', (req, res) => {
	const { title, date, location, organizer, category } = req.body
	const query =
		'INSERT INTO events (title, date, location, organizer, category) VALUES (?, ?, ?, ?, ?)'
	db.query(query, [title, date, location, organizer, category], (err, result) => {
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
	const { title, date, location, organizer, category } = req.body
	const query =
		'UPDATE events SET title = ?, date = ?, location = ?, organizer = ?, category = ? WHERE id = ?'
	db.query(query, [title, date, location, organizer, category, eventId], (err, result) => {
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
