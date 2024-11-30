const express = require('express')
const router = express.Router()
const multer = require('multer')
const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs')
require('dotenv').config()

// Set up multer for handling image uploads
const upload = multer({ dest: 'uploads/' })

router.post('/send-email', upload.single('image'), async (req, res) => {
	const { message, recipients } = req.body
	const image = req.file // Get the uploaded image file

	// Validate the recipient email
	const recipient = JSON.parse(recipients)[0] // Take the first recipient from the list

	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
		return res.status(400).json({ message: `Invalid email address: ${recipient}` })
	}

	// Set up email transport
	const transporter = nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_APP_PASSWORD,
		},
	})

	// Prepare email details
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: recipient, // Send to a single recipient
		subject: 'Your Subject Here',
		text: message,
		attachments: image
			? [
					{
						filename: path.basename(image.originalname),
						path: image.path,
					},
			  ]
			: [],
	}

	try {
		// Send the email
		await transporter.sendMail(mailOptions)

		// Clean up the uploaded file
		if (image) {
			fs.unlink(image.path, (err) => {
				if (err) console.error('Error deleting file:', err)
			})
		}

		res.status(200).json({ success: true, message: 'Email sent successfully' })
	} catch (error) {
		console.error('Error sending email:', error)
		res.status(500).json({ success: false, message: 'Failed to send email' })
	}
})

module.exports = router
