/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

router.post('/', (req, res) => {
	console.log('Request Body:', req.body)
	const { action, timestamp } = req.body
	if (!action || !timestamp) {
		console.log('Invalid Request:', req.body)
		return res.status(400).json({ message: 'Action and timestamp are required.' })
	}

	const query = `INSERT INTO action_logs (action, timestamp) VALUES (?, ?)`
	db.query(query, [action, timestamp], (err, result) => {
		if (err) {
			console.error('Error inserting log:', err)
			return res.status(500).json({ message: 'Error adding log.' })
		}
		res.status(201).json({ message: 'Log added successfully.', logId: result.insertId })
	})
})

router.get('/', (req, res) => {
	const query = `SELECT * FROM action_logs ORDER BY timestamp DESC`
	db.query(query, (err, results) => {
		if (err) {
			console.error('Error retrieving logs:', err)
			return res.status(500).json({ message: 'Error retrieving logs.' })
		}
		res.status(200).json(results)
	})
})

module.exports = router
