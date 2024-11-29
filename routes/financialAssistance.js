/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()
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

module.exports = router
