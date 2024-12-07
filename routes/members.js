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
router.post('/upload-proof', upload.single('file'), (req, res) => {
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
	const query = `UPDATE members SET proof = ?, benefitStatus = "Claimed" WHERE id = ?`

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

// POST route to handle file upload
router.post('/upload-proofs', upload.single('file'), (req, res) => {
	const { quarter, memberId } = req.body
	const proofFileName = req.file ? req.file.filename : null

	// Check if the file was uploaded
	if (!proofFileName) {
		return res.status(400).json({ success: false, message: 'No file uploaded.' })
	}

	// Ensure quarter and memberId are provided in the request body
	if (!quarter || !memberId) {
		return res.status(400).json({ success: false, message: 'Quarter and memberId are required.' })
	}

	// SQL query to update the proof and benefitStatus for the given quarter
	const updateQuery = `
        UPDATE members
        SET proof${quarter} = ?, benefitStatus${quarter} = "Claimed"
        WHERE id = ?
    `

	// Perform the database update
	db.query(updateQuery, [proofFileName, memberId], (err, result) => {
		if (err) {
			console.error('Error updating database:', err)
			return res.status(500).json({ success: false, message: 'Database error.' })
		}

		// Successfully updated the database
		return res.json({
			success: true,
			message: `Proof for ${quarter} uploaded and status updated to 'Claimed'!`,
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

// PUT route to update a specific member
router.put('/members-list/:id', (req, res) => {
	const memberId = req.params.id // Extract the member ID from the URL
	const { firstName, lastName, middleName, extension, dob, sex, civilStatus, address, contactNumber, controlNo, purchaseBookletNo, medicineBookletNo, dateIssued } = req.body

	// Check if optional fields are provided, otherwise set them to null
	const updatedPurchaseBookletNo = purchaseBookletNo || null
	const updatedMedicineBookletNo = medicineBookletNo || null
	const updatedDateIssued = dateIssued || null

	// Perform the update query (example for MySQL)
	const query = `
        UPDATE members SET
        firstName = ?, lastName = ?, middleName = ?, extension = ?, dob = ?, sex = ?, civilStatus = ?, address = ?, contactNumber = ?, controlNo = ?, purchaseBookletNo = ?, medicineBookletNo = ?, dateIssued = ?
        WHERE id = ?
    `
	const values = [firstName, lastName, middleName, extension, dob, sex, civilStatus, address, contactNumber, controlNo, updatedPurchaseBookletNo, updatedMedicineBookletNo, updatedDateIssued, memberId]

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

// POST route to create a new financial assistance record
router.post('/financial-assistance', (req, res) => {
	const { benefitType, claimDate, programName, claimer, claimerRelationship } = req.body

	// Perform the insert query (example for MySQL)
	const query = `
        INSERT INTO members (benefitType, claimDate, programName, claimer, claimerRelationship)
        VALUES (?, ?, ?, ?, ?)
    `
	const values = [benefitType, claimDate, programName, claimer, claimerRelationship]

	db.query(query, values, (err, result) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		return res.status(201).json({ message: 'Financial assistance record created successfully.' })
	})
})

// POST route to create a new social pension record
router.post('/social-pension', (req, res) => {
	const { benefitType, claimDateQ1, claimerQ1, relationshipQ1, claimDateQ2, claimerQ2, relationshipQ2, claimDateQ3, claimerQ3, relationshipQ3, claimDateQ4, claimerQ4, relationshipQ4 } = req.body

	// SQL query to insert data
	const query = `
        INSERT INTO members (
            benefitType,
            claimDateQ1, claimerQ1, relationshipQ1,
            claimDateQ2, claimerQ2, relationshipQ2,
            claimDateQ3, claimerQ3, relationshipQ3,
            claimDateQ4, claimerQ4, relationshipQ4
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

	// Values to insert
	const values = [benefitType, claimDateQ1, claimerQ1, relationshipQ1, claimDateQ2, claimerQ2, relationshipQ2, claimDateQ3, claimerQ3, relationshipQ3, claimDateQ4, claimerQ4, relationshipQ4]

	// Execute the query
	db.query(query, values, (err, result) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		return res.status(201).json({ message: 'Social pension record created successfully.' })
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

router.post('/', (req, res) => {
	const {
		firstName,
		lastName,
		middleName,
		extension,
		dob,
		sex,
		civilStatus,
		address,
		contactNumber,
		controlNo,
		purchaseBookletNo,
		medicineBookletNo,
		dateIssued,
		medicalConditions,
		medications,
		guardianFirstName,
		guardianMiddleName,
		guardianLastName,
		guardianEmail,
		guardianContact,
		guardianRelationship,
	} = req.body

	// Ensure all required fields are provided
	if (!firstName || !lastName || !dob) {
		return res.status(400).json({ error: 'First name, last name, and date of birth are required.' })
	}

	// Prepare values for the insert query
	const values = [
		firstName || '',
		lastName || '',
		middleName || '',
		extension || '',
		dob || '',
		sex || '',
		civilStatus || '',
		address || '',
		contactNumber || '',
		controlNo || '',
		purchaseBookletNo || '',
		medicineBookletNo || '',
		dateIssued || null,
		medicalConditions ? medicalConditions.join(',') : '', // Store as a comma-separated string
		medications ? medications.join(',') : '', // Store as a comma-separated string
		guardianFirstName || '',
		guardianMiddleName || '',
		guardianLastName || '',
		guardianEmail || '',
		guardianContact || '',
		guardianRelationship || '',
	]

	// Log the values to debug
	console.log('Inserting member with the following values:')
	console.log(values)
	console.log('Number of values:', values.length)

	// Combine the data into a single query for insertion
	const query = `
        INSERT INTO members (
            firstName, lastName, middleName, extension, dob, sex, civilStatus, address, contactNumber, 
            controlNo, purchaseBookletNo, medicineBookletNo, dateIssued, medicalConditions, medications, 
            guardianFirstName, guardianMiddleName, guardianLastName, guardianEmail, guardianContact, guardianRelationship
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

	// Execute the query to insert the new member and health record
	db.query(query, values, (err, result) => {
		if (err) {
			console.error('Error executing query:', err.message)
			return res.status(500).json({ error: 'Error saving data: ' + err.message })
		}
		const memberId = result.insertId // Retrieve the new member ID
		// Successfully created the member and health record
		res.status(201).json({ message: 'Member and health record added successfully.', memberId: result.insertId })
	})
})

module.exports = router
