/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const db = require('../db')
require('dotenv').config()

// Endpoint for login authentication (using username or email)
router.post('/', (req, res) => {
	const { identifier, password } = req.body

	// Validate input fields
	if (!identifier || !password) {
		return res.status(400).json({ message: 'Username/email and password are required.' })
	}

	const query = 'SELECT * FROM admins WHERE username = ? OR email = ?'
	db.query(query, [identifier, identifier], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}

		if (results.length === 0) {
			return res.status(401).json({ message: 'Invalid username/email or password' })
		}

		const user = results[0]

		// For plain password comparison (not recommended for production)
		if (password === user.password) {
			res.status(200).json({
				message: 'Login successful',
				userId: user.id,
				username: user.username,
				email: user.email,
			})
		} else {
			res.status(401).json({ message: 'Invalid username/email or password' })
		}
	})
})

// New endpoint to check if an email exists
router.get('/check-email', (req, res) => {
	const { email } = req.query

	if (!email) {
		return res.status(400).json({ error: 'Email is required' })
	}

	const query = 'SELECT * FROM admins WHERE email = ?'
	db.query(query, [email], (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}

		if (results.length > 0) {
			res.status(200).json({ exists: true, message: 'Email found in admins table' })
		} else {
			res.status(404).json({ exists: false, message: 'Email not found in admins table' })
		}
	})
})

const createTableAndInsertDefaultAdmin = () => {
	const createTableQuery = `
	  CREATE TABLE IF NOT EXISTS admins (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(255) NOT NULL,
		password VARCHAR(255) NOT NULL,
		email VARCHAR(255) NOT NULL
	  )
	`;
  
	db.query(createTableQuery, (err, result) => {
	  if (err) {
		console.error('Error creating table:', err.message);
		return;
	  }
	  console.log('Table ensured (created if not exists)');
  
	  // Now, check if the default admin exists
	  const checkAdminQuery = 'SELECT * FROM admins WHERE username = ?';
	  db.query(checkAdminQuery, ['admin'], (err, results) => {
		if (err) {
		  console.error('Error checking admin existence:', err.message);
		  return;
		}
  
		if (results.length === 0) {
		  const insertQuery = 'INSERT INTO admins (username, password, email) VALUES (?, ?, ?)';
		  db.query(insertQuery, ['admin', 'Elderlink2025', 'elderlinkinfo2025@gmail.com'], (err, result) => {
			if (err) {
			  console.error('Error inserting default admin:', err.message);
			  return;
			}
  
			console.log('Default admin inserted successfully');
		  });
		} else {
		  console.log('Default admin already exists');
		}
	  });
	});
  };
  
  // Call the function when the server starts
  createTableAndInsertDefaultAdmin();

module.exports = router
