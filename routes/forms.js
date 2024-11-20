/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
require('dotenv').config()
const db = require('../db')

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

// Utility function to handle date format (if no date is provided)
function formatDate(date) {
	if (!date) return new Date().toISOString().slice(0, 19).replace('T', ' ') // Return current date if not provided
	return new Date(date).toISOString().slice(0, 19).replace('T', ' ') // Format the provided date
}

// Fetch all active forms
router.get('/', (req, res) => {
	const query = 'SELECT id, title, pdfLink, createdAt, category, status FROM forms'

	db.query(query, (err, results) => {
		if (err) {
			console.error('Error executing query:', err.message)
			return res.status(500).json({
				error: 'An error occurred while fetching forms.',
			})
		}
		res.status(200).json(results)
	})
})

router.post('/', upload.single('pdf'), (req, res) => {
	console.log('Request Body:', req.body) // Log incoming form fields
	console.log('Uploaded File:', req.file) // Log uploaded file

	// Extract fields from request body
	let { title, createdAt, category } = req.body
	const pdfLink = req.file ? req.file.path : null // File path for uploaded PDF

	// Remove .pdf or .Pdf extension, replace dashes with spaces, and convert to Title Case
	title = title
		.replace(/\.pdf$/i, '') // Remove .pdf or .Pdf (case-insensitive)
		.replace(/-/g, ' ') // Replace dashes with spaces
		.toLowerCase() // Convert all to lowercase
		.replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize each word
		.trim() // Trim any whitespace

	// Validate required fields
	if (!title || !pdfLink || !category) {
		return res.status(400).json({ error: 'Title, pdfLink, and category are required.' })
	}

	// SQL query to insert form details into the database
	const query = `
        INSERT INTO forms (title, pdfLink, createdAt, category, status) 
        VALUES (?, ?, ?, ?, 'Active')
    `

	const formDate = formatDate(createdAt) // Format the createdAt date

	db.query(query, [title, pdfLink, formDate, category], (err, result) => {
		if (err) {
			console.error('Error inserting new form:', err.message)
			return res.status(500).json({
				error: 'An error occurred while adding the form.',
			})
		}

		res.status(201).json({
			message: 'Form added successfully',
			formId: result.insertId,
		})
	})
})

// Update form title
router.put('/update-title/:id', (req, res) => {
	const formId = req.params.id
	const { newTitle } = req.body // The new title to be updated

	if (!newTitle) {
		return res.status(400).json({ error: 'New title is required.' })
	}

	const query = `
        UPDATE forms 
        SET title = ? 
        WHERE id = ?
    `

	db.query(query, [newTitle, formId], (err, result) => {
		if (err) {
			console.error('Error updating title:', err.message)
			return res.status(500).json({
				error: 'An error occurred while updating the title.',
			})
		}

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'Form not found.' })
		}

		res.status(200).json({
			message: 'Form title updated successfully',
		})
	})
})

router.put('/archive/:id', (req, res) => {
	const formId = req.params.id
	const { newStatus } = req.body // New status from client (either "Active" or "Archived")

	if (!newStatus || !['Active', 'Archived'].includes(newStatus)) {
		return res.status(400).json({ error: 'Invalid status provided.' })
	}

	const query = `
        UPDATE forms 
        SET status = ? 
        WHERE id = ?
    `

	db.query(query, [newStatus, formId], (err, result) => {
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
			message: `Form ${newStatus === 'Archived' ? 'archived' : 'activated'} successfully.`,
		})
	})
})

module.exports = router
