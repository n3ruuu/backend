const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
require('dotenv').config()

// Set up multer for image uploads (optional)
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/') // Folder to store images
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname)) // Unique filename with timestamp
	},
})
const upload = multer({ storage: storage })

// Route to handle the form submission
router.post('/', upload.single('filePath'), async (req, res) => {
	// Changed to 'filePath'
	const { applicantName, formType } = req.body
	const filePath = req.file ? req.file.path : null

	// Validate required fields
	if (!applicantName || !formType) {
		return res.status(400).json({ message: 'Applicant Name and Form Type are required' })
	}

	// Insert the form submission into the database
	try {
		const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ') // MySQL-compatible format
		const query = `
        INSERT INTO application (applicant_name, form_type, file_path, date_submitted, status)
        VALUES (?, ?, ?, ?, 'Pending')
      `

		// The result will be an array, so we access the first element which contains the affected rows
		const [result] = await db
			.promise()
			.query(query, [applicantName, formType, filePath, currentDate])

		// Check if the result contains the insertId
		if (result && result.insertId) {
			res.status(201).json({
				message: 'Form added successfully',
				formId: result.insertId, // Get the insertId from the result
			})
		} else {
			res.status(400).json({
				message: 'Form insertion failed.',
			})
		}
	} catch (error) {
		console.error('Error inserting new form:', error.message)
		res.status(500).json({
			error: 'An error occurred while adding the form.',
		})
	}
})

router.get('/', async (req, res) => {
	try {
		// Query to fetch all form submissions from the database
		const query = 'SELECT * FROM application ORDER BY date_submitted DESC'

		// Execute the query to fetch data
		const [rows] = await db.promise().query(query)

		// If no rows are found, return an empty array
		if (rows.length === 0) {
			return res.status(404).json({
				message: 'No form submissions found.',
			})
		}

		// Return the rows (form submissions)
		res.status(200).json({
			message: 'Form submissions retrieved successfully',
			data: rows,
		})
	} catch (error) {
		console.error('Error fetching form submissions:', error.message)
		res.status(500).json({
			error: 'An error occurred while fetching the form submissions.',
		})
	}
})

router.put('/update/:id', (req, res) => {
	const formId = req.params.id
	const { status } = req.body // Use 'status' as the key

	// Validate the status
	if (!status || !['Pending', 'Approved', 'Rejected', 'Incomplete'].includes(status)) {
		return res.status(400).json({ error: 'Invalid status provided.' })
	}

	const query = `
        UPDATE application
        SET status = ?
        WHERE id = ?
    `

	db.query(query, [status, formId], (err, result) => {
		if (err) {
			console.error('Error updating form status:', err.message)
			return res.status(500).json({
				error: 'An error occurred while updating the form status.',
			})
		}

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'Form not found.' })
		}

		res.status(200).json({
			message: `Form status updated to ${status}.`,
		})
	})
})

module.exports = router
