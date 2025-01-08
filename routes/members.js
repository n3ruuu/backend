<<<<<<< HEAD
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

router.put('/undo/:id', (req, res) => {
	const { id } = req.params

	// Begin the transaction (optional, but useful for ensuring atomicity)
	const queryMembers = 'UPDATE members SET status = "Active" WHERE id = ?'
	const queryPension = 'UPDATE social_pension SET memberStatus = "Active" WHERE id = ?'

	// Update the members table
	db.query(queryMembers, [id], (err, result) => {
		if (err) {
			console.error('Error updating members:', err)
			return res.status(500).json({ error: 'Failed to update member status' })
		}

		// Update the social_pension table after the members table
		db.query(queryPension, [id], (err, result) => {
			if (err) {
				console.error('Error updating social_pension:', err)
				return res.status(500).json({ error: 'Failed to update social_pension status' })
			}

			return res.status(200).json({ message: 'Member status updated to Active and social_pension status updated' })
		})
	})
})

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

// PUT route to update member status
router.put('/archive/:id', (req, res) => {
	const { id } = req.params // Get member ID from the URL parameter
	const { reason } = req.body // Get the reason from the request body

	// Ensure reason is one of the valid options
	const validReasons = ['Deceased', 'Relocated', 'Inactive']

	if (!validReasons.includes(reason)) {
		return res.status(400).json({ error: 'Invalid reason for archiving' })
	}

	// Start a transaction to ensure both updates happen atomically
	db.beginTransaction((err) => {
		if (err) {
			return res.status(500).json({ error: 'Error starting transaction' })
		}

		// Update the status in the members table
		const updateMemberQuery = 'UPDATE members SET status = ? WHERE id = ?'
		db.query(updateMemberQuery, [reason, id], (err, result) => {
			if (err) {
				return db.rollback(() => {
					res.status(500).json({ error: 'Error updating member status' })
				})
			}

			if (result.affectedRows === 0) {
				return db.rollback(() => {
					res.status(404).json({ error: 'Member not found' })
				})
			}

			// Now update the memberStatus in the social_pension table
			const updatePensionQuery = 'UPDATE social_pension SET memberStatus = ? WHERE member_id = ?'
			db.query(updatePensionQuery, [reason, id], (err, result) => {
				if (err) {
					return db.rollback(() => {
						res.status(500).json({ error: 'Error updating member status in social_pension' })
					})
				}

				// Commit the transaction if both updates were successful
				db.commit((err) => {
					if (err) {
						return db.rollback(() => {
							res.status(500).json({ error: 'Error committing transaction' })
						})
					}

					res.status(200).json({ message: 'Member archived successfully' })
				})
			})
		})
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
		status,
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
		status || 'Active',
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
            guardianFirstName, guardianMiddleName, guardianLastName, guardianEmail, guardianContact, guardianRelationship, status
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

router.post('/import-csv', (req, res) => {
	const data = req.body // Assuming the data comes in JSON format
	console.log('CSV data being imported:', data) // Log the incoming data

	const query = `
        INSERT INTO members (
            firstName, lastName, middleName, extension, dob, sex, civilStatus, address, 
            contactNumber, controlNo, purchaseBookletNo, medicineBookletNo, dateIssued, 
            medicalConditions, medications, guardianFirstName, guardianMiddleName, 
            guardianLastName, guardianEmail, guardianContact, guardianRelationship
        ) VALUES ?
    `

	const values = data.map((row) => [
		row.firstName,
		row.lastName,
		row.middleName,
		row.extension,
		row.dob,
		row.sex,
		row.civilStatus,
		row.address,
		row.contactNumber,
		row.controlNo,
		row.purchaseBookletNo,
		row.medicineBookletNo,
		row.dateIssued,
		row.medicalConditions,
		row.medications,
		row.guardianFirstName,
		row.guardianMiddleName,
		row.guardianLastName,
		row.guardianEmail,
		row.guardianContact,
		row.guardianRelationship,
	])

	db.query(query, [values], (err, result) => {
		if (err) {
			console.error('Error inserting data:', err)
			return res.status(500).send('Error inserting data')
		}

		// Assuming you want to return the inserted data with generated ids
		const insertedMembers = result.insertId
			? values.map((val, idx) => ({
					...val, // Spread the inserted row
					id: result.insertId + idx, // Assuming insertId returns the first inserted row id
			  }))
			: []

		res.status(200).send({ message: 'CSV data imported successfully', members: insertedMembers })
	})
})

router.post('/register', upload.array('requirements', 3), (req, res) => {
	const {
	  firstName,
	  lastName,
	  middleName,
	  extension,
	  dob,
	  sex,
	  civilStatus,
	  placeOfBirth,
	  occupation,
	  address,
	  contactNumber,
	  nameOfSpouse,
	  education,
	  guardianFirstName,
	  guardianMiddleName,
	  guardianLastName,
	  guardianEmail,
	  guardianContact,
	  guardianRelationship,
	  applicationType,
	} = req.body;
  
	// Collect the filenames of the uploaded files
	const requirement1 = req.files[0] ? req.files[0].filename : null;
	const requirement2 = req.files[1] ? req.files[1].filename : null;
	const requirement3 = req.files[2] ? req.files[2].filename : null;
  
	// Set default applicationStatus to 'pending'
	const applicationStatus = 'Pending';
  
	// SQL query to insert data into the database
	const query = `
	  INSERT INTO registrations (
		firstName, lastName, middleName, extension, dob, sex, civilStatus, placeOfBirth, occupation, address, contactNumber,
		nameOfSpouse, education, guardianFirstName, guardianMiddleName, guardianLastName, guardianEmail, guardianContact,
		guardianRelationship, applicationType, requirement1, requirement2, requirement3, applicationStatus
	  ) VALUES (?, ? , ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`;
  
	// Values to insert
	const values = [
	  firstName, lastName, middleName, extension, dob, sex, civilStatus, placeOfBirth, occupation, address, contactNumber,
	  nameOfSpouse, education, guardianFirstName, guardianMiddleName, guardianLastName, guardianEmail, guardianContact,
	  guardianRelationship, applicationType, requirement1, requirement2, requirement3, applicationStatus
	];
  
	// Execute the query
	db.query(query, values, (err, result) => {
	  if (err) {
		console.error('Error inserting data into database:', err);
		return res.status(500).json({ error: 'Failed to submit registration' });
	  }
	  return res.status(201).json({ message: 'Registration successful' });
	});
  });

  // Endpoint to get all members
router.get('/registrations', (req, res) => {
	const query = 'SELECT * FROM registrations'
	db.query(query, (err, results) => {
		if (err) {
			return res.status(500).json({ error: err.message })
		}
		res.status(200).json(results)
	})
})
  
module.exports = router
=======
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

router.put('/undo/:id', (req, res) => {
	const { id } = req.params

	// Begin the transaction (optional, but useful for ensuring atomicity)
	const queryMembers = 'UPDATE members SET status = "Active" WHERE id = ?'
	const queryPension = 'UPDATE social_pension SET memberStatus = "Active" WHERE id = ?'

	// Update the members table
	db.query(queryMembers, [id], (err, result) => {
		if (err) {
			console.error('Error updating members:', err)
			return res.status(500).json({ error: 'Failed to update member status' })
		}

		// Update the social_pension table after the members table
		db.query(queryPension, [id], (err, result) => {
			if (err) {
				console.error('Error updating social_pension:', err)
				return res.status(500).json({ error: 'Failed to update social_pension status' })
			}

			return res.status(200).json({ message: 'Member status updated to Active and social_pension status updated' })
		})
	})
})

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

// PUT route to update member status
router.put('/archive/:id', (req, res) => {
	const { id } = req.params // Get member ID from the URL parameter
	const { reason } = req.body // Get the reason from the request body

	// Ensure reason is one of the valid options
	const validReasons = ['Deceased', 'Relocated', 'Inactive']

	if (!validReasons.includes(reason)) {
		return res.status(400).json({ error: 'Invalid reason for archiving' })
	}

	// Start a transaction to ensure both updates happen atomically
	db.beginTransaction((err) => {
		if (err) {
			return res.status(500).json({ error: 'Error starting transaction' })
		}

		// Update the status in the members table
		const updateMemberQuery = 'UPDATE members SET status = ? WHERE id = ?'
		db.query(updateMemberQuery, [reason, id], (err, result) => {
			if (err) {
				return db.rollback(() => {
					res.status(500).json({ error: 'Error updating member status' })
				})
			}

			if (result.affectedRows === 0) {
				return db.rollback(() => {
					res.status(404).json({ error: 'Member not found' })
				})
			}

			// Now update the memberStatus in the social_pension table
			const updatePensionQuery = 'UPDATE social_pension SET memberStatus = ? WHERE member_id = ?'
			db.query(updatePensionQuery, [reason, id], (err, result) => {
				if (err) {
					return db.rollback(() => {
						res.status(500).json({ error: 'Error updating member status in social_pension' })
					})
				}

				// Commit the transaction if both updates were successful
				db.commit((err) => {
					if (err) {
						return db.rollback(() => {
							res.status(500).json({ error: 'Error committing transaction' })
						})
					}

					res.status(200).json({ message: 'Member archived successfully' })
				})
			})
		})
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
		status,
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
		status || 'Active',
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
            guardianFirstName, guardianMiddleName, guardianLastName, guardianEmail, guardianContact, guardianRelationship, status
        ) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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

router.post('/import-csv', (req, res) => {
	const data = req.body // Assuming the data comes in JSON format
	console.log('CSV data being imported:', data) // Log the incoming data

	const query = `
        INSERT INTO members (
            firstName, lastName, middleName, extension, dob, sex, civilStatus, address, 
            contactNumber, controlNo, purchaseBookletNo, medicineBookletNo, dateIssued, 
            medicalConditions, medications, guardianFirstName, guardianMiddleName, 
            guardianLastName, guardianEmail, guardianContact, guardianRelationship
        ) VALUES ?
    `

	const values = data.map((row) => [
		row.firstName,
		row.lastName,
		row.middleName,
		row.extension,
		row.dob,
		row.sex,
		row.civilStatus,
		row.address,
		row.contactNumber,
		row.controlNo,
		row.purchaseBookletNo,
		row.medicineBookletNo,
		row.dateIssued,
		row.medicalConditions,
		row.medications,
		row.guardianFirstName,
		row.guardianMiddleName,
		row.guardianLastName,
		row.guardianEmail,
		row.guardianContact,
		row.guardianRelationship,
	])

	db.query(query, [values], (err, result) => {
		if (err) {
			console.error('Error inserting data:', err)
			return res.status(500).send('Error inserting data')
		}

		// Assuming you want to return the inserted data with generated ids
		const insertedMembers = result.insertId
			? values.map((val, idx) => ({
					...val, // Spread the inserted row
					id: result.insertId + idx, // Assuming insertId returns the first inserted row id
			  }))
			: []

		res.status(200).send({ message: 'CSV data imported successfully', members: insertedMembers })
	})
})

router.post('/register', upload.single('form_path'), (req, res) => {
	const formPath = req.file ? req.file.path : null // Store the file path from the uploaded file

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
		guardianFirstName,
		guardianMiddleName,
		guardianLastName,
		guardianEmail,
		guardianContact,
		guardianRelationship,
	} = req.body

	// Add the formPath to the insert query
	const query = `
      INSERT INTO members (
        firstName, lastName, middleName, extension, dob, sex, civilStatus, address, contactNumber, guardianFirstName, guardianMiddleName, guardianLastName, 
        guardianEmail, guardianContact, guardianRelationship, form_path, status
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `

	const values = [
		firstName,
		lastName,
		middleName,
		extension,
		dob,
		sex,
		civilStatus,
		address,
		contactNumber,
		guardianFirstName,
		guardianMiddleName,
		guardianLastName,
		guardianEmail,
		guardianContact,
		guardianRelationship,
		formPath, // Add the form path here
		'Pending', // Default status
	]

	db.query(query, values, (err, result) => {
		if (err) {
			console.error('Error executing query:', err)
			return res.status(500).json({ error: 'Error saving data: ' + err.message })
		}
		res.status(201).json({ message: 'Member added successfully' })
	})
})

module.exports = router
>>>>>>> cd42158bcfa8d63c76778226cfd7bbb2b2d414bf
