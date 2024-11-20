/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
require('dotenv').config()

// Set up multer for image uploads
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/') // Folder to store images
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname)) // Unique filename with timestamp
	},
})
const upload = multer({ storage: storage })

// Utility function to handle date format (in case a date isn't passed)
function formatDate(date) {
	if (!date) return new Date().toISOString().slice(0, 19).replace('T', ' ') // Return current date if not provided
	return new Date(date).toISOString().slice(0, 19).replace('T', ' ') // Format the provided date
}

// Fetch all active news articles
router.get('/', (req, res) => {
	const query = 'SELECT id, headline, author, body, date, image, status FROM news'

	db.query(query, (err, results) => {
		if (err) {
			console.error('Error executing query:', err.message)
			return res.status(500).json({
				error: 'An error occurred while fetching news articles.',
			})
		}
		res.status(200).json(results)
	})
})

// Add a new news article with image upload
router.post('/', upload.single('image'), (req, res) => {
	const { headline, author, body, date } = req.body
	const image = req.file ? req.file.filename : null // Store filename if image is uploaded

	// Validate required fields
	if (!headline || !author || !body) {
		return res.status(400).json({ error: 'Headline, author, and body are required.' })
	}

	const query = `
        INSERT INTO news (headline, author, body, date, image, status) 
        VALUES (?, ?, ?, ?, ?, 'Active')
    `

	// Use the provided date or the current date if not specified
	const articleDate = formatDate(date)

	db.query(query, [headline, author, body, articleDate, image], (err, result) => {
		if (err) {
			console.error('Error inserting new article:', err.message)
			return res.status(500).json({
				error: 'An error occurred while adding the news article.',
			})
		}
		res.status(201).json({
			message: 'News article added successfully',
			articleId: result.insertId,
		})
	})
})

// Edit a news article by ID
router.put('/:id', upload.single('image'), (req, res) => {
	const { id } = req.params
	const { headline, author, body, date } = req.body
	const image = req.file ? req.file.filename : null

	// Validate required fields
	if (!headline || !author || !body) {
		return res.status(400).json({ error: 'Headline, author, and body are required.' })
	}

	// Build the query and parameters dynamically, allowing image to be optional
	let query = 'UPDATE news SET headline = ?, author = ?, body = ?, date = ?'
	const params = [headline, author, body, formatDate(date)] // Format the date

	if (image) {
		query += ', image = ?'
		params.push(image)
	}
	query += ' WHERE id = ?'
	params.push(id)

	db.query(query, params, (err, result) => {
		if (err) {
			console.error('Error updating article:', err.message)
			return res.status(500).json({
				error: 'An error occurred while updating the news article.',
			})
		}
		// Optionally fetch the updated news article after the update
		db.query('SELECT * FROM news WHERE id = ?', [id], (err, rows) => {
			if (err) {
				console.error('Error fetching updated article:', err.message)
				return res.status(500).json({
					error: 'An error occurred while fetching the updated news article.',
				})
			}
			res.status(200).json({
				message: 'News article updated successfully',
				updatedArticle: rows[0],
			})
		})
	})
})

// Archive or undo a news article by ID
router.put('/archive/:id', (req, res) => {
	const { id } = req.params

	// First, check the current status of the news article
	const checkStatusQuery = 'SELECT status FROM news WHERE id = ?'

	db.query(checkStatusQuery, [id], (err, result) => {
		if (err) {
			console.error('Error checking article status:', err.message)
			return res.status(500).json({
				error: 'An error occurred while checking the news article status.',
			})
		}

		if (result.length === 0) {
			return res.status(404).json({
				error: 'News article not found.',
			})
		}

		const currentStatus = result[0].status
		let updateQuery
		let message

		if (currentStatus === 'Active') {
			// If it's currently active, archive the article
			updateQuery = "UPDATE news SET status = 'Archived' WHERE id = ?"
			message = 'News article archived successfully.'
		} else {
			// If it's already archived, set the status to Active (undo archive)
			updateQuery = "UPDATE news SET status = 'Active' WHERE id = ?"
			message = 'News article status set to Active.'
		}

		// Update the article's status
		db.query(updateQuery, [id], (err, result) => {
			if (err) {
				console.error('Error updating article status:', err.message)
				return res.status(500).json({
					error: 'An error occurred while updating the news article status.',
				})
			}

			res.status(200).json({
				message: message,
			})
		})
	})
})

module.exports = router
