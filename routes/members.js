/* eslint-disable no-undef */
// routes/members.js
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// Endpoint to add a member
router.post('/', (req, res) => {
	const { idNo, name, dob, gender, address, phone, age } = req.body
	const query =
		'INSERT INTO members (idNo, name, dob, gender, address, phone, age) VALUES (?, ?, ?, ?, ?, ?, ?)'
	db.query(query, [idNo, name, dob, gender, address, phone, age], (err, result) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(201).json({
			id: result.insertId,
			message: 'Member added successfully',
		})
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

// Endpoint to update a member
router.put('/:id', (req, res) => {
	const memberId = req.params.id
	const updatedMemberData = req.body

	const query =
		'UPDATE members SET idNo = ?, name = ?, dob = ?, gender = ?, address = ?, phone = ?, age = ? WHERE id = ?'
	db.query(
		query,
		[
			updatedMemberData.idNo,
			updatedMemberData.name,
			updatedMemberData.dob,
			updatedMemberData.gender,
			updatedMemberData.address,
			updatedMemberData.phone,
			updatedMemberData.age,
			memberId,
		],
		(err, result) => {
			if (err) {
				return res.status(500).json({ error: err.message })
			}
			if (result.affectedRows === 0) {
				return res.status(404).json({ message: 'Member not found' })
			}
			res.status(200).json({ id: memberId, ...updatedMemberData })
		}
	)
})

// Endpoint to archive (soft delete) or undo archive a member
router.put('/archive/:id', (req, res) => {
	const memberId = req.params.id
	const { status } = req.body

	// Check if we are undoing the archive (status is 'Active')
	if (status === 'Active') {
		// Undo the archive, setting the status back to 'Active'
		const query = 'UPDATE members SET status = ? WHERE id = ?'
		db.query(query, [status, memberId], (err, result) => {
			if (err) return res.status(500).json({ error: err.message })
			if (result.affectedRows === 0) return res.status(404).json({ message: 'Member not found' })
			res.status(200).json({ message: 'Member status updated to Active' })
		})
	} else {
		// Archive the member (status is 'Archived')
		const query = 'UPDATE members SET status = ? WHERE id = ?'
		db.query(query, [status, memberId], (err, result) => {
			if (err) return res.status(500).json({ error: err.message })
			if (result.affectedRows === 0) return res.status(404).json({ message: 'Member not found' })
			res.status(200).json({ message: 'Member archived successfully' })
		})
	}
})

// Endpoint to search members by name
router.get('/search', (req, res) => {
	const searchTerm = req.query.q || ''
	const query = 'SELECT id, name FROM members WHERE name LIKE ?'

	db.query(query, [`%${searchTerm}%`], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(200).json(results)
	})
})

module.exports = router
