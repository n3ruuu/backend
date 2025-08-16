/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
require('dotenv').config()
const db = require('../db')

// Set up multer for image uploads (optional)
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads/') // Folder to store images
	},
	filename: (req, file, cb) => {
		cb(null, Date.now() + path.extname(file.originalname)) // Unique filename with timestamp
	},
})
const upload = multer({ storage: storage })

// Utility function to handle date format (if no date is provided)
function formatDate(date) {
	if (!date) return new Date().toISOString().slice(0, 19).replace('T', ' ') // Return current date if not provided
	return new Date(date).toISOString().slice(0, 19).replace('T', ' ') // Format the provided date
}

// Fetch all active forms
router.get('/', (req, res) => {
	const query = 'SELECT id, title, pdfLink, createdAt, category, status FROM forms'

	db.query(query, (err, results) => {
		if (err) {
			console.error('Error executing query:', err.message)
			return res.status(500).json({
				error: 'An error occurred while fetching forms.',
			})
		}
		res.status(200).json(results)
	})
})

// Delete a form by ID
router.delete('/:id', (req, res) => {
    const formId = req.params.id; // Get the form ID from the route parameter

    // SQL query to delete form from the database
    const query = `DELETE FROM forms WHERE id = ?`;

    db.query(query, [formId], (err, result) => {
        if (err) {
            console.error('Error deleting form:', err.message);
            return res.status(500).json({
                error: 'An error occurred while deleting the form.',
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Form not found.' });
        }

        res.status(200).json({
            message: 'Form deleted successfully.',
        });
    });
});


router.post('/', upload.single('pdf'), (req, res) => {
	console.log('Request Body:', req.body) // Log incoming form fields
	console.log('Uploaded File:', req.file) // Log uploaded file

	// Extract fields from request body
	let { title, createdAt, category } = req.body
	const pdfLink = req.file ? req.file.path : null // File path for uploaded PDF

	// Remove .pdf or .Pdf extension, replace dashes with spaces, and convert to Title Case
	title = title
		.replace(/\.pdf$/i, '') // Remove .pdf or .Pdf (case-insensitive)
		.replace(/-/g, ' ') // Replace dashes with spaces
		.toLowerCase() // Convert all to lowercase
		.replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalize each word
		.trim() // Trim any whitespace

	// Validate required fields
	if (!title || !pdfLink || !category) {
		return res.status(400).json({ error: 'Title, pdfLink, and category are required.' })
	}

	// SQL query to insert form details into the database
	const query = `
        INSERT INTO forms (title, pdfLink, createdAt, category, status) 
        VALUES (?, ?, ?, ?, 'Active')
    `

	const formDate = formatDate(createdAt) // Format the createdAt date

	db.query(query, [title, pdfLink, formDate, category], (err, result) => {
		if (err) {
			console.error('Error inserting new form:', err.message)
			return res.status(500).json({
				error: 'An error occurred while adding the form.',
			})
		}

		res.status(201).json({
			message: 'Form added successfully',
			formId: result.insertId,
		})
	})
})

// Update form title
router.put('/update-title/:id', (req, res) => {
	const formId = req.params.id
	const { newTitle } = req.body // The new title to be updated

	if (!newTitle) {
		return res.status(400).json({ error: 'New title is required.' })
	}

	const query = `
        UPDATE forms 
        SET title = ? 
        WHERE id = ?
    `

	db.query(query, [newTitle, formId], (err, result) => {
		if (err) {
			console.error('Error updating title:', err.message)
			return res.status(500).json({
				error: 'An error occurred while updating the title.',
			})
		}

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'Form not found.' })
		}

		res.status(200).json({
			message: 'Form title updated successfully',
		})
	})
})

router.put('/archive/:id', (req, res) => {
	const formId = req.params.id
	const { newStatus } = req.body // New status from client (either "Active" or "Archived")

	if (!newStatus || !['Active', 'Archived'].includes(newStatus)) {
		return res.status(400).json({ error: 'Invalid status provided.' })
	}

	const query = `
        UPDATE forms 
        SET status = ? 
        WHERE id = ?
    `

	db.query(query, [newStatus, formId], (err, result) => {
		if (err) {
			console.error('Error updating form status:', err.message)
			return res.status(500).json({
				error: 'An error occurred while updating the form status.',
			})
		}

		if (result.affectedRows === 0) {
			return res.status(404).json({ error: 'Form not found.' })
		}

		res.status(200).json({
			message: `Form ${newStatus === 'Archived' ? 'archived' : 'activated'} successfully.`,
		})
	})
})

router.post("/initiatives", upload.single("icon"), (req, res) => {
    const category_name = req.body.category_name; // Access the category name properly
    const icon_path = req.file ? `/uploads/${req.file.filename}` : null; // Get image path after upload

    const query = `INSERT INTO initiatives (category_name, icon_path) VALUES (?, ?)`;

    db.query(query, [category_name, icon_path], (err, result) => {
        if (err) {
            console.error("Error inserting data:", err);
            return res.status(500).json({ message: "Failed to save form" });
        }

        res.status(200).json({ message: "Form saved successfully", data: result });
    });
});

router.delete("/initiatives/:id", (req, res) => {
    const categoryId = req.params.id;

    // First, get the category_name for this initiative
    const getCategoryQuery = `SELECT category_name FROM initiatives WHERE id = ?`;

    db.query(getCategoryQuery, [categoryId], (err, categoryResult) => {
        if (err) {
            console.error("Error fetching category name:", err);
            return res.status(500).json({ message: "Failed to delete category" });
        }

        if (categoryResult.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        const categoryName = categoryResult[0].category_name;

        // Delete the initiative
        const deleteInitiativeQuery = `DELETE FROM initiatives WHERE id = ?`;
        db.query(deleteInitiativeQuery, [categoryId], (err, initiativeResult) => {
            if (err) {
                console.error("Error deleting category:", err);
                return res.status(500).json({ message: "Failed to delete category" });
            }

            // Delete all forms that belong to this category
            const deleteFormsQuery = `DELETE FROM forms WHERE category = ?`;
            db.query(deleteFormsQuery, [categoryName], (err, formsResult) => {
                if (err) {
                    console.error("Error deleting forms for category:", err);
                    return res.status(500).json({ message: "Failed to delete forms for category" });
                }

                res.status(200).json({
                    message: `Category and its ${formsResult.affectedRows} forms deleted successfully`
                });
            });
        });
    });
});



router.get("/initiatives", (req, res) => {
    const query = "SELECT id, category_name, icon_path FROM initiatives";
    
    db.query(query, (err, result) => {
        if (err) {
            console.error("Error fetching categories:", err);
            return res.status(500).json({ message: "Failed to fetch categories" });
        }

        res.status(200).json(result); // Send categories back in response
    });
});



module.exports = router
