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
router.put('/:id', (req, res) => {
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

module.exports = router
