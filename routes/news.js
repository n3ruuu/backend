/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
require('dotenv').config()

const upload = multer({
	storage: multer.diskStorage({
		destination: (req, file, cb) => {
			cb(null, 'uploads/')
		},
		filename: (req, file, cb) => {
			const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
			cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
		},
	}),
})

// Utility function to handle date format (in case a date isn't passed)
function formatDate(date) {
	if (!date) return new Date().toISOString().slice(0, 19).replace('T', ' ') // Return current date if not provided
	return new Date(date).toISOString().slice(0, 19).replace('T', ' ') // Format the provided date
}

// Delete a news article by ID
router.delete('/:id', (req, res) => {
    const { id } = req.params;

    // First, check if the article exists
    const checkExistenceQuery = 'SELECT id FROM news WHERE id = ?';

    db.query(checkExistenceQuery, [id], (err, result) => {
        if (err) {
            console.error('Error checking article existence:', err.message);
            return res.status(500).json({
                error: 'An error occurred while checking if the news article exists.',
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                error: 'News article not found.',
            });
        }

        // Proceed to delete the article
        const deleteQuery = 'DELETE FROM news WHERE id = ?';

        db.query(deleteQuery, [id], (err, result) => {
            if (err) {
                console.error('Error deleting article:', err.message);
                return res.status(500).json({
                    error: 'An error occurred while deleting the news article.',
                });
            }

            res.status(200).json({
                message: 'News article deleted successfully.',
            });
        });
    });
});


// Fetch all active news articles
router.get('/', (req, res) => {
	const query = 'SELECT id, headline, author, body, date, images, status FROM news'

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

// Update to handle multiple images upload
router.post('/', upload.array('images', 5), (req, res) => {
	const { headline, author, body, date } = req.body
	const images = req.files ? req.files.map((file) => file.filename) : []

	// Validate required fields
	if (!headline || !author || !body) {
		return res.status(400).json({ error: 'Headline, author, and body are required.' })
	}

	const query = `
        INSERT INTO news (headline, author, body, date, images, status) 
        VALUES (?, ?, ?, ?, ?, 'Active')
    `

	// Use the provided date or the current date if not specified
	const articleDate = formatDate(date)

	db.query(query, [headline, author, body, articleDate, JSON.stringify(images)], (err, result) => {
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

router.put('/:id', upload.array('images', 5), (req, res) => {
	const { id } = req.params
	const { headline, author, body, date } = req.body
	const images = req.files // req.files will contain the array of uploaded files

	// Validate required fields
	if (!headline || !author || !body) {
		return res.status(400).json({ error: 'Headline, author, and body are required.' })
	}

	db.query('SELECT images FROM news WHERE id = ?', [id], (err, rows) => {
		if (err) {
			console.error('Error fetching current images:', err.message)
			return res.status(500).json({ error: 'An error occurred while fetching the current images.' })
		}

		let finalImages = []
		if (req.files && req.files.length > 0) {
			// Replace current images with new ones if uploaded
			finalImages = req.files.map((file) => file.filename)
		} else {
			// Retain current images if no new images are uploaded
			finalImages = rows[0]?.images ? JSON.parse(rows[0].images) : []
		}

		const query = 'UPDATE news SET headline = ?, author = ?, body = ?, date = ?, images = ? WHERE id = ?'
		const params = [headline, author, body, formatDate(date), JSON.stringify(finalImages), id]

		db.query(query, params, (err, result) => {
			if (err) {
				console.error('Error updating article:', err.message)
				return res.status(500).json({ error: 'An error occurred while updating the news article.' })
			}

			// Fetch and return the updated article
			db.query('SELECT * FROM news WHERE id = ?', [id], (err, rows) => {
				if (err) {
					console.error('Error fetching updated article:', err.message)
					return res.status(500).json({ error: 'An error occurred while fetching the updated news article.' })
				}
				res.status(200).json({
					message: 'News article updated successfully',
					updatedArticle: rows[0],
				})
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
