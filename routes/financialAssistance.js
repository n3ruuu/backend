/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// Endpoint to add financial assistance
router.post('/', (req, res) => {
	const {
		member_id,
		member_name,
		benefit_type,
		date_of_claim,
		benefit_status,
		claimer,
		relationship,
	} = req.body

	const query = `
        INSERT INTO financial_assistance (member_id, member_name, benefit_type, date_of_claim, benefit_status, claimer, relationship)
        VALUES (?, ?, ?, ?, ?, ?, ?)`

	db.query(
		query,
		[member_id, member_name, benefit_type, date_of_claim, benefit_status, claimer, relationship],
		(err, result) => {
			if (err) {
				return res.status(500).json({ error: err.message })
			}
			// Return the entire new record
			res.status(201).json({
				financial_assistance_id: result.insertId,
				member_id,
				member_name,
				benefit_type,
				date_of_claim,
				benefit_status,
				claimer,
				relationship,
				message: 'Financial assistance record added successfully',
			})
		}
	)
})

// Endpoint to get all financial assistance records
router.get('/', (req, res) => {
	const query = 'SELECT * FROM financial_assistance'
	db.query(query, (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(200).json(results)
	})
})

// Endpoint to get a specific financial assistance record by ID
router.get('/:id', (req, res) => {
	const financialAssistanceId = req.params.id // Get the ID from the URL parameters

	const query = 'SELECT * FROM financial_assistance WHERE financial_assistance_id = ?'

	db.query(query, [financialAssistanceId], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		if (results.length === 0) {
			return res.status(404).json({ message: 'Financial assistance record not found' })
		}
		res.status(200).json(results[0]) // Return the specific record
	})
})

router.put('/:id', (req, res) => {
	const financialAssistanceId = req.params.id
	const { member_name, benefit_type, date_of_claim, benefit_status, claimer, relationship } =
		req.body

	// Log the updated values
	console.log('Updating financial assistance record with ID:', financialAssistanceId)
	console.log('Updated values:', {
		member_name,
		benefit_type,
		date_of_claim,
		benefit_status,
		claimer,
		relationship,
	})

	const query = `
        UPDATE financial_assistance 
        SET member_name = ?, benefit_type = ?, date_of_claim = ?, benefit_status = ?, claimer = ?, relationship = ?
        WHERE financial_assistance_id = ?`

	db.query(
		query,
		[
			member_name,
			benefit_type,
			date_of_claim,
			benefit_status,
			claimer,
			relationship,
			financialAssistanceId,
		],
		(err, result) => {
			if (err) {
				return res.status(500).json({ error: err.message })
			}
			if (result.affectedRows === 0) {
				return res.status(404).json({ message: 'Financial assistance record not found' })
			}
			res.status(200).json({
				message: 'Financial assistance record updated successfully',
			})
		}
	)
})

router.put('/archive/:id', (req, res) => {
	const { id } = req.params
	const { status } = req.body // Get the status from the request body

	if (!status) {
		return res.status(400).json({ message: 'Status is required.' })
	}

	const query = 'UPDATE financial_assistance SET status = ? WHERE financial_assistance_id = ?'

	db.query(query, [status, id], (error, result) => {
		if (error) {
			console.error('Error archiving financial assistance record:', error)
			return res.status(500).json({ message: 'Error archiving record.' })
		}

		if (result.affectedRows === 0) {
			return res.status(404).json({ message: 'Record not found.' })
		}

		res.status(200).json({ message: 'Record archived successfully.' })
	})
})

module.exports = router
