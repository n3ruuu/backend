/* eslint-disable no-undef */
// routes/members.js
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

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
