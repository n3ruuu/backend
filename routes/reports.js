const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
require('dotenv').config()

// Set up multer for file uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Define the folder where the uploaded files will be stored
		cb(null, 'uploads/')
	},
	filename: (req, file, cb) => {
		// Create a unique filename using timestamp and the file's original extension
		cb(null, Date.now() + path.extname(file.originalname))
	},
})

// Initialize multer with the storage configuration
const upload = multer({ storage: storage })

// Handle saving report (including the file path) in the database
router.post('/save-report', upload.single('reportFile'), (req, res) => {
	const { reportName, reportType, createdBy, createdAt, pdfFilePath } = req.body
	const uploadedFile = req.file

	// Log the request body and file to see if it's as expected
	console.log(req.body)
	console.log(uploadedFile)

	// Check if the file is uploaded
	if (!uploadedFile) {
		return res.status(400).json({ error: 'No file uploaded' })
	}

	// Insert the report data and file path into the database
	const query = 'INSERT INTO reports (report_name, report_type, created_by, created_at, pdf_file_path) VALUES (?, ?, ?, ?, ?)'
	db.query(query, [reportName, reportType, createdBy, createdAt, uploadedFile.path], (err, result) => {
		if (err) {
			console.error('Error saving report:', err)
			return res.status(500).json({ error: 'Failed to save report' })
		}

		return res.status(200).json({ message: 'Report saved successfully' })
	})
})

router.get('/get-news', (req, res) => {
	const query = 'SELECT * FROM reports' // Replace with your table name

	db.query(query, (err, result) => {
		if (err) {
			return res.status(500).json({ message: 'Error fetching data' })
		}
		res.json(result) // Sends the data back to the frontend
	})
})

// Endpoint to update the report status to "Archived"
router.put('/archive-report/:id', (req, res) => {
	const reportId = req.params.id

	// Update the status of the report to 'Archived'
	const query = 'UPDATE reports SET status = ? WHERE id = ?'
	db.query(query, ['Archived', reportId], (err, result) => {
		if (err) {
			console.error('Error updating report status:', err)
			return res.status(500).send('Error updating report status')
		}

		// Respond with a success message
		res.status(200).send({ message: 'Report archived successfully' })
	})
})

// API endpoint to set status to 'Active' for a report
router.put('/undo/:id', (req, res) => {
	const { id } = req.params // Extract report ID from the request parameters
	const { status } = req.body // Extract status from the request body

	// Validate the provided status
	if (!status || status !== 'Active') {
		res.status(400).send("Invalid status. Only 'Active' is allowed.")
		return
	}

	// Update the report's status in the database
	const query = 'UPDATE reports SET status = ? WHERE id = ?'
	db.query(query, [status, id], (err, result) => {
		if (err) {
			console.error('Error updating report status:', err)
			res.status(500).send('Server error')
			return
		}

		if (result.affectedRows === 0) {
			res.status(404).send('Report not found')
			return
		}

		res.status(200).send('Report status updated to Active successfully.')
	})
})

module.exports = router
