/* eslint-disable no-undef */
// routes/members.js
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()
const multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/') // Directory to store uploaded files
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname) // Use the original file name (no timestamp)
	},
})

const upload = multer({ storage })

// router.js or the relevant route file
router.post('/uploa', upload.single('file'), (req, res) => {
	const { memberId } = req.body

	// Ensure the file is uploaded and memberId is provided
	if (!req.file) {
		return res.status(400).json({ error: 'No file uploaded' })
	}

	if (!memberId) {
		return res.status(400).json({ error: 'Member ID is required' })
	}

	const filePath = req.file.filename // Only store the filename, not the full path

	// SQL query to update the database with th filename and se to "Claimed"
	const query = `UPDATE members SE = ? = "Claimed" WHERE id = ?`

	// Execute the query to update the database
	db.query(query, [filePath, memberId], (err, result) => {
		if (err) {
			console.error('Database update failed:', err)
			return res.status(500).json({ error: 'Database update failed' })
		}

		// If the query was successful, return a success message
		if (result.affectedRows > 0) {
			return res.json({ message: 'File uploaded successfully', filePath })
		} else {
			// If no rows were affected, memberId might not be valid
			return res.status(404).json({ error: 'Member not found' })
		}
	})
})

// Endpoint to get all members
router.get('/', (req, res) => {
	const query = 'SELECT * FROM members'
	db.query(query, (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(200).json(results)
	})
})

// PUT route to update a specific member
router.put('/members-list/:id', (req, res) => {
	const memberId = req.params.id // Extract the member ID from the URL
	const { firstName, lastName, middleName, extension, dob, sex, civilStatus, address, contactNumber, controlNo, purchaseBookletNo, medicineBookletNo, dateIssued } = req.body

	// Perform the update query (example for MySQL)
	const query = `
        UPDATE members SET
        firstName = ?, lastName = ?, middleName = ?, extension = ?, dob = ?, sex = ?, civilStatus = ?, address = ?, contactNumber = ?, controlNo = ?, purchaseBookletNo = ?, medicineBookletNo = ?, dateIssued = ?
        WHERE id = ?
    `
	const values = [firstName, lastName, middleName, extension, dob, sex, civilStatus, address, contactNumber, controlNo, purchaseBookletNo, medicineBookletNo, dateIssued, memberId]

	db.query(query, values, (err, result) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		if (result.affectedRows > 0) {
			return res.status(200).json({ message: 'Member updated successfully.' })
		} else {
			return res.status(404).json({ error: 'Member not found.' })
		}
	})
})

// PUT route to update a specific financial assistance record
router.put('/financial-assistance/:id', (req, res) => {
	const memberId = req.params.id // Extract the financial assistance record ID from the URL
	const { benefitType, claimDate, programName, claimer, claimerRelationship } = req.body

	// Perform the update query (example for MySQL)
	const query = `
        UPDATE members SET
        benefitType = ?, 
        claimDate = ?, 
        programName = ?, 
        claimer = ?, 
        claimerRelationship = ? 
        WHERE id = ?
    `
	const values = [benefitType, claimDate, programName, claimer, claimerRelationship, memberId]

	db.query(query, values, (err, result) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		if (result.affectedRows > 0) {
			return res.status(200).json({ message: 'Financial assistance record updated successfully.' })
		} else {
			return res.status(404).json({ error: 'Record not found.' })
		}
	})
})

// PUT route to update a specific member
router.put('/health-records/:id', (req, res) => {
	const memberId = req.params.id // Extract the member ID from the URL
	const { medicalConditions, medications, guardianFirstName, guardianMiddleName, guardianLastName, guardianEmail, guardianContact, guardianRelationship } = req.body

	// Perform the update query (example for MySQL)
	const query = `
        UPDATE members SET
        medicalConditions = ?, medications = ?, guardianFirstName = ?, guardianMiddleName = ?, guardianLastName = ?, guardianEmail = ?, guardianContact = ?, guardianRelationship = ?
        WHERE id = ?
    `
	const values = [
		medicalConditions ? medicalConditions.join(',') : '', // Ensure it's a string for storage
		medications ? medications.join(',') : '', // Ensure it's a string for storage
		guardianFirstName,
		guardianMiddleName,
		guardianLastName,
		guardianEmail,
		guardianContact,
		guardianRelationship,
		memberId,
	]

	db.query(query, values, (err, result) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		if (result.affectedRows > 0) {
			return res.status(200).json({ message: 'Member updated successfully.' })
		} else {
			return res.status(404).json({ error: 'Member not found.' })
		}
	})
})

module.exports = router
