const express = require('express')
const router = express.Router()
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

// Route to get the signatory (only one signatory)
router.get("/signatory", (req, res) => {
    db.query("SELECT * FROM signatory LIMIT 1", (err, results) => {
        if (err) {
            console.error("Error fetching signatory:", err);
            return res.status(500).send("Error fetching signatory.");
        }
        res.status(200).json(results);
    });
});

router.post("/signatory", (req, res) => {
    const { name, position } = req.body;

    // Check if a signatory already exists
    db.query("SELECT * FROM signatory LIMIT 1", (err, results) => {
        if (err) {
            console.error("Error checking for existing signatory:", err);
            return res.status(500).send("Error checking signatory.");
        }

        if (results.length > 0) {
            // If signatory exists, update it
            const existingId = results[0].id;
            db.query(
                "UPDATE signatory SET name = ?, position = ? WHERE id = ?",
                [name, position, existingId],
                (err, updateResults) => {
                    if (err) {
                        console.error("Error updating signatory:", err);
                        return res.status(500).send("Error updating signatory.");
                    }
                    res.status(200).json({ id: existingId, name, position });
                }
            );
        } else {
            // If no signatory exists, create a new one
            db.query(
                "INSERT INTO signatory (name, position) VALUES (?, ?)",
                [name, position],
                (err, insertResults) => {
                    if (err) {
                        console.error("Error creating signatory:", err);
                        return res.status(500).send("Error creating signatory.");
                    }
                    res.status(201).json({ id: insertResults.insertId, name, position });
                }
            );
        }
    });
});


router.delete("/signatory/:id", (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM signatory WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Error deleting signatory:", err);
            return res.status(500).send("Error deleting signatory.");
        }
        res.status(200).send("Signatory deleted successfully.");
    });
});


module.exports = router
