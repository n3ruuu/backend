const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// --- Default Data ---
const defaultOfficers = [
	{ name: 'Engr. Ruperto DJ. Celis', position: 'President' },
	{ name: 'Ma. Gracia B. Javier', position: 'Vice President' },
	{ name: 'Esmeralda T. Soriano', position: 'Secretary' },
	{ name: 'Rosario M. Pengson', position: 'Treasurer' },
	{ name: 'Irma R. Reyes', position: 'Auditor' },
	{ name: 'Lydia F. Hufano', position: 'P.R.O.' },
	{ name: 'Celia SP. Mendiola', position: 'Adviser' },
]

const defaultCoordinators = [
	{ name: 'Josephine G. Julian', area: 'Barangay Kapitolyo' },
	{ name: 'Leni T. Salonga', area: 'Felicisima Village' },
	{ name: 'Lydia F. Hufano', area: 'Felicisima Village' },
	{ name: 'Edna H. Celis', area: 'San Felipe Subd.' },
	{ name: 'Carmencita C. Lopez', area: 'San Felipe Subd.' },
	{ name: 'Loreto S. Salazar', area: 'San Felipe Subd.' },
	{ name: 'Flaviano D. Sajulga', area: 'Mojon P1 to P3' },
	{ name: 'Amado G. Carating', area: 'Mojon P1 to P3' },
	{ name: 'Marilyn J. Reyes', area: 'San Jose Subd.' },
	{ name: 'Margareth Herrera', area: 'Golden Grain Villas' },
	{ name: 'Atanacio Chica Jr.', area: 'Other Areas' },
]

// --- Officers ---
router.get('/officers', (req, res) => {
	db.query('SELECT * FROM officers', (err, result) => {
		if (err) {
			console.error('Error fetching officers:', err)
			return res.status(500).send('Error fetching officers')
		}

		if (result.length === 0) {
			// Insert default officers if table is empty
			const values = defaultOfficers.map((o) => [o.name, o.position])
			db.query('INSERT INTO officers (name, position) VALUES ?', [values], (err2) => {
				if (err2) {
					console.error('Error inserting default officers:', err2)
					return res.status(500).send('Error inserting default officers')
				}
				res.json(defaultOfficers)
			})
		} else {
			res.json(result)
		}
	})
})

router.post('/officers', (req, res) => {
	const { name, position } = req.body
	db.query('INSERT INTO officers (name, position) VALUES (?, ?)', [name, position], (err, result) => {
		if (err) {
			console.error('Error adding officer:', err)
			return res.status(500).send('Error adding officer')
		}
		res.json({ id: result.insertId, name, position })
	})
})

router.delete('/officers/:id', (req, res) => {
	const { id } = req.params
	db.query('DELETE FROM officers WHERE id = ?', [id], (err, result) => {
		if (err) {
			console.error('Error deleting officer:', err)
			return res.status(500).send('Error deleting officer')
		}
		res.json({ message: 'Officer deleted successfully' })
	})
})

// --- Area Coordinators ---
router.get('/area-coordinators', (req, res) => {
	db.query('SELECT * FROM area_coordinators', (err, result) => {
		if (err) {
			console.error('Error fetching area coordinators:', err)
			return res.status(500).send('Error fetching area coordinators')
		}

		if (result.length === 0) {
			// Insert default coordinators if table is empty
			const values = defaultCoordinators.map((c) => [c.name, c.area])
			db.query('INSERT INTO area_coordinators (name, area) VALUES ?', [values], (err2) => {
				if (err2) {
					console.error('Error inserting default coordinators:', err2)
					return res.status(500).send('Error inserting default coordinators')
				}
				res.json(defaultCoordinators)
			})
		} else {
			res.json(result)
		}
	})
})

router.post('/area-coordinators', (req, res) => {
	const { name, area } = req.body
	db.query('INSERT INTO area_coordinators (name, area) VALUES (?, ?)', [name, area], (err, result) => {
		if (err) {
			console.error('Error adding area coordinator:', err)
			return res.status(500).send('Error adding area coordinator')
		}
		res.json({ id: result.insertId, name, area })
	})
})

router.delete('/area-coordinators/:id', (req, res) => {
	const { id } = req.params
	db.query('DELETE FROM area_coordinators WHERE id = ?', [id], (err, result) => {
		if (err) {
			console.error('Error deleting area coordinator:', err)
			return res.status(500).send('Error deleting area coordinator')
		}
		res.json({ message: 'Area Coordinator deleted successfully' })
	})
})

// --- Signatory ---
router.get('/signatory', (req, res) => {
	db.query('SELECT * FROM signatory LIMIT 1', (err, results) => {
		if (err) {
			console.error('Error fetching signatory:', err)
			return res.status(500).send('Error fetching signatory.')
		}
		res.status(200).json(results)
	})
})

router.post('/signatory', (req, res) => {
	const { name, position } = req.body
	db.query('SELECT * FROM signatory LIMIT 1', (err, results) => {
		if (err) return res.status(500).send('Error checking signatory.')
		if (results.length > 0) {
			const existingId = results[0].id
			db.query('UPDATE signatory SET name = ?, position = ? WHERE id = ?', [name, position, existingId], (err2) => {
				if (err2) return res.status(500).send('Error updating signatory.')
				res.status(200).json({ id: existingId, name, position })
			})
		} else {
			db.query('INSERT INTO signatory (name, position) VALUES (?, ?)', [name, position], (err2, insertRes) => {
				if (err2) return res.status(500).send('Error creating signatory.')
				res.status(201).json({ id: insertRes.insertId, name, position })
			})
		}
	})
})

router.delete('/signatory/:id', (req, res) => {
	const { id } = req.params
	db.query('DELETE FROM signatory WHERE id = ?', [id], (err) => {
		if (err) return res.status(500).send('Error deleting signatory.')
		res.status(200).send('Signatory deleted successfully.')
	})
})

module.exports = router
