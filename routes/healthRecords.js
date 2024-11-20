/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const mysql = require('mysql2')

require('dotenv').config()

const db = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
})

// POST: Add a new health record
router.post('/', (req, res) => {
	const {
		member_id,
		member_name, // New field for member name
		record_date,
		medical_conditions,
		medications,
		guardian_name,
		relationship,
		emergency_contact,
	} = req.body

	const query = `
        INSERT INTO health_records 
        (member_id, member_name, record_date, medical_conditions, medications, guardian_name, relationship, emergency_contact) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

	db.query(
		query,
		[
			member_id,
			member_name, // Include member name in the query
			record_date,
			medical_conditions,
			medications,
			guardian_name,
			relationship,
			emergency_contact,
		],
		(err, result) => {
			if (err) {
				return res.status(500).json({ error: err.message })
			}
			res.status(201).json({
				id: result.insertId,
				message: 'Health record added successfully',
			})
		}
	)
})

router.put('/:id', (req, res) => {
	const healthRecordId = req.params.id
	const {
		member_name,
		record_date,
		medical_conditions,
		medications,
		guardian_name,
		relationship,
		emergency_contact,
	} = req.body

	console.log('Updating record ID:', healthRecordId) // Debug log
	console.log('Request Body:', req.body) // Log the request body

	const query = `
        UPDATE health_records 
        SET member_name = ?, record_date = ?, medical_conditions = ?, medications = ?, guardian_name = ?, relationship = ?, emergency_contact = ? 
        WHERE health_record_id = ?;
    `

	db.query(
		query,
		[
			member_name,
			record_date,
			medical_conditions,
			medications,
			guardian_name,
			relationship,
			emergency_contact,
			healthRecordId,
		],
		(err, result) => {
			if (err) {
				console.error('Database Error:', err) // Log the error
				return res.status(500).json({ error: err.message })
			}
			if (result.affectedRows === 0) {
				return res.status(404).json({ message: 'Record not found' })
			}
			res.status(200).json({
				message: 'Health record updated successfully',
			})
		}
	)
})

// GET: Fetch a specific health record by ID
router.get('/:id', (req, res) => {
	const healthRecordId = req.params.id // Get the ID from the URL

	const query = `
        SELECT hr.*, m.name 
        FROM health_records hr 
        JOIN members m ON hr.member_id = m.id
        WHERE hr.health_record_id = ?
    `

	db.query(query, [healthRecordId], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		if (results.length === 0) {
			return res.status(404).json({ message: 'Record not found' })
		}
		res.status(200).json(results[0]) // Send back the first record found
	})
})

// GET: Fetch all health records (with member names, removed 'allergies')
router.get('/', (req, res) => {
	const query = `
        SELECT hr.*, m.name 
        FROM health_records hr 
        JOIN members m ON hr.member_id = m.id
    `

	db.query(query, (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(200).json(results)
	})
})

// GET: Fetch all health records with optional filtering for recent updates
router.get('/', (req, res) => {
	const { since } = req.query // Get the since parameter if provided
	let query = `
        SELECT hr.*, m.name 
        FROM health_records hr 
        JOIN members m ON hr.member_id = m.id
    `

	if (since) {
		query += ` WHERE hr.record_date >= ?` // Filter for records updated since the given date
	}

	db.query(query, [since ? new Date(since) : null], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(200).json(results)
	})
})

// PUT: Update health record status (Archive or Restore)
router.put('/archive/:id', (req, res) => {
	const healthRecordId = req.params.id
	const { status } = req.body // Get the selected status from the request body

	console.log('Updating record ID:', healthRecordId) // Debug log
	console.log('Selected Status:', status) // Log the status received from the frontend

	const query = `
        UPDATE health_records 
        SET status = ? 
        WHERE health_record_id = ?;
    `

	if (status === 'Active') {
		// Undo the archive, setting the status back to 'Active'
		db.query(query, [status, healthRecordId], (err, result) => {
			if (err) {
				console.error('Database Error:', err) // Log the error
				return res.status(500).json({ error: err.message })
			}
			if (result.affectedRows === 0) {
				return res.status(404).json({ message: 'Record not found' })
			}
			res.status(200).json({
				message: `Health record status updated to 'Active' successfully.`,
			})
		})
	} else {
		// Archive the health record, setting the status to 'Archived'
		db.query(query, [status, healthRecordId], (err, result) => {
			if (err) {
				console.error('Database Error:', err) // Log the error
				return res.status(500).json({ error: err.message })
			}
			if (result.affectedRows === 0) {
				return res.status(404).json({ message: 'Record not found' })
			}
			res.status(200).json({
				message: `Health record archived successfully.`,
			})
		})
	}
})

module.exports = router
