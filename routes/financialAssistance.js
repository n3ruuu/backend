/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()
const multer = require('multer')
const path = require('path')

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

router.get('/', (req, res) => {
	const query = 'SELECT * FROM social_pension'
	db.query(query, (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(200).json(results)
	})
})

router.post('/social-pension/upload-proof', upload.single('proof'), (req, res) => {
	if (!req.file) {
		return res.status(400).json({ success: false, message: 'No file uploaded.' })
	}

	const { member_id, record_id } = req.body

	// The uploaded file's path
	const filePath = req.file.path

	// SQL query to update the `proof` column for the corresponding record
	const query = `
        UPDATE social_pension
        SET proof = ?, status = "Claimed"
        WHERE member_id = ? AND id = ?
    `

	db.query(query, [filePath, member_id, record_id], (err, results) => {
		if (err) {
			console.error('Error updating proof:', err)
			return res.status(500).json({ success: false, message: 'Failed to update the proof in the database.' })
		}

		res.status(200).json({
			success: true,
			message: 'Proof uploaded and database updated successfully.',
			filePath: filePath, // Return the file path if needed
		})
	})
})

module.exports = router
