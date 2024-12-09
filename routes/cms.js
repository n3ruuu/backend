const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const db = require('../db')
require('dotenv').config()

// Get all officers
router.get('/officers', (req, res) => {
	db.query('SELECT * FROM officers', (err, result) => {
		if (err) {
			console.error('Error fetching officers:', err)
			res.status(500).send('Error fetching officers')
		} else {
			res.json(result)
		}
	})
})

// Add a new officer
router.post('/officers', (req, res) => {
	const { name, position } = req.body
	db.query('INSERT INTO officers (name, position) VALUES (?, ?)', [name, position], (err, result) => {
		if (err) {
			console.error('Error adding officer:', err)
			res.status(500).send('Error adding officer')
		} else {
			res.json({ message: 'Officer added successfully' })
		}
	})
})

// Delete an officer
router.delete('/officers/:id', (req, res) => {
	const { id } = req.params
	db.query('DELETE FROM officers WHERE id = ?', [id], (err, result) => {
		if (err) {
			console.error('Error deleting officer:', err)
			res.status(500).send('Error deleting officer')
		} else {
			res.json({ message: 'Officer deleted successfully' })
		}
	})
})

// Get all area coordinators
router.get('/area-coordinators', (req, res) => {
	db.query('SELECT * FROM area_coordinators', (err, result) => {
		if (err) {
			console.error('Error fetching area coordinators:', err)
			res.status(500).send('Error fetching area coordinators')
		} else {
			res.json(result)
		}
	})
})

// Add a new area coordinator
router.post('/area-coordinators', (req, res) => {
	const { name, area } = req.body
	db.query('INSERT INTO area_coordinators (name, area) VALUES (?, ?)', [name, area], (err, result) => {
		if (err) {
			console.error('Error adding area coordinator:', err)
			res.status(500).send('Error adding area coordinator')
		} else {
			res.json({ message: 'Area Coordinator added successfully' })
		}
	})
})

// Delete an area coordinator
router.delete('/area-coordinators/:id', (req, res) => {
	const { id } = req.params
	db.query('DELETE FROM area_coordinators WHERE id = ?', [id], (err, result) => {
		if (err) {
			console.error('Error deleting area coordinator:', err)
			res.status(500).send('Error deleting area coordinator')
		} else {
			res.json({ message: 'Area Coordinator deleted successfully' })
		}
	})
})

module.exports = router
