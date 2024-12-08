/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()
const multer = require('multer')
const path = require('path')
const fs = require('fs')

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

router.post('/social-pension/remove-proof', (req, res) => {
	const { member_id, record_id, file_path } = req.body

	// Delete the file from the server
	fs.unlink(file_path, (err) => {
		if (err) {
			console.error('Error deleting the file:', err)
			return res.status(500).json({ success: false, message: 'Failed to remove the file from the server.' })
		}

		// SQL query to remove the proof and update the status back to "Unclaimed"
		const query = `
            UPDATE social_pension
            SET proof = NULL, status = "Unclaimed"
            WHERE member_id = ? AND id = ?
        `

		db.query(query, [member_id, record_id], (err, results) => {
			if (err) {
				console.error('Error updating the database:', err)
				return res.status(500).json({ success: false, message: 'Failed to update the database.' })
			}

			res.status(200).json({
				success: true,
				message: 'Proof removed and database updated successfully.',
			})
		})
	})
})

router.get('/social-pension/:memberId', (req, res) => {
	const memberId = req.params.memberId

	const query = `
        SELECT id, member_id, quarter, year, amount, status, disbursement_date, claimer, relationship, control_no, full_name, proof
        FROM social_pension
        WHERE member_id = ?
    `

	db.execute(query, [memberId], (err, results) => {
		if (err) {
			console.error('Error retrieving data:', err)
			return res.status(500).json({ error: 'Failed to retrieve data' })
		}
		res.json(results) // Send the retrieved data as a JSON response
	})
})

router.put('/social-pension/:id', (req, res) => {
	const { quarterData } = req.body // Getting quarterData
	const { id } = req.params

	if (!quarterData || !quarterData.length) {
		return res.status(400).json({ message: 'Missing quarter data' })
	}

	// Process each quarter's data
	quarterData.forEach((data, idx) => {
		// Convert empty strings to NULL for the database
		const disbursement_date = data.disbursement_date || null
		const claimer = data.claimer?.trim() || null
		const relationship = data.relationship?.trim() || null

		const query = `
            UPDATE social_pension
            SET 
                disbursement_date = ?, 
                claimer = ?, 
                relationship = ?
            WHERE member_id = ? AND quarter = ?
        `

		db.execute(query, [disbursement_date, claimer, relationship, id, `Q${idx + 1}`], (err, result) => {
			if (err) {
				console.error('Error updating record:', err)
				return res.status(500).json({ message: 'Internal Server Error' })
			}

			if (result.affectedRows === 0) {
				return res.status(404).json({ message: 'Record not found' })
			}
		})
	})

	res.status(200).json({ message: 'Record updated successfully' })
})

router.post('/social-pension', (req, res) => {
	const { member_id, quarterData } = req.body

	// Validate request body
	if (!member_id) {
		return res.status(400).json({ message: 'Missing member ID' })
	}
	if (!quarterData || !quarterData.length) {
		return res.status(400).json({ message: 'Missing quarter data' })
	}

	// SQL query to fetch controlNo (aliased as control_no) and full_name based on member_id
	const memberQuery = `
        SELECT controlNo AS control_no, CONCAT(firstName, ' ', lastName) AS full_name
        FROM members
        WHERE id = ?
    `

	db.execute(memberQuery, [member_id], (err, results) => {
		if (err) {
			console.error('Error fetching member data:', err)
			return res.status(500).json({ message: 'Failed to fetch member data' })
		}

		if (results.length === 0) {
			return res.status(404).json({ message: 'Member not found' })
		}

		const { control_no, full_name } = results[0]

		// SQL query for inserting social pension data
		const query = `
            INSERT INTO social_pension (control_no, member_id, full_name, quarter, status, disbursement_date, claimer, relationship, proof)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `

		// Process and insert each quarter's data
		let errorOccurred = false

		quarterData.forEach((data) => {
			const quarter = data.quarter || null
			const disbursement_date = data.disbursement_date || null
			const claimer = data.claimer || null
			const relationship = data.relationship || null
			const proof = data.proof || null

			db.execute(
				query,
				[
					control_no, // Use control_no from the members table
					member_id,
					full_name,
					quarter,
					'Unclaimed', // Default status
					disbursement_date,
					claimer,
					relationship,
					proof,
				],
				(err) => {
					if (err) {
						console.error('Error inserting record:', err)
						errorOccurred = true
					}
				}
			)
		})

		// Check if there was an error during processing
		if (errorOccurred) {
			return res.status(500).json({ message: 'Failed to insert some or all records' })
		}

		// Respond after processing
		res.status(201).json({ message: 'Social pension records added successfully' })
	})
})

// GET endpoint for social_pension data
router.get('/social-pension', (req, res) => {
	const query = 'SELECT * FROM social_pension' // Modify the query as per your table structure

	db.query(query, (err, results) => {
		if (err) {
			console.error('Error fetching social pension data:', err)
			return res.status(500).json({ error: 'Failed to fetch data' })
		}

		// Send the fetched data as JSON response
		res.status(200).json(results)
	})
})

module.exports = router
