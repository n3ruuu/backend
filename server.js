/* eslint-disable no-undef */
const express = require('express')
const cors = require('cors')
const healthRecordsRouter = require('./routes/healthRecords')
const financialAssistanceRouter = require('./routes/financialAssistance')
const eventsRouter = require('./routes/events')
const newsRouter = require('./routes/news')
const membersRouter = require('./routes/members') // Import the new members router
const formsRouter = require('./routes/forms')
const loginRouter = require('./routes/login')
const logRouter = require('./routes/log')
const applicationRouter = require('./routes/application')
const smsRouter = require('./routes/sms') // Import the SMS router
const verificationRouter = require('./routes/verification') // Import the SMS router
const reportsRouter = require('./routes/reports') // Import the SMS router
require('dotenv').config()

const app = express()
const port = 5000

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Use members routes
app.use('/members', membersRouter) // Use members routes
app.use('/health-records', healthRecordsRouter)
app.use('/financial-assistance', financialAssistanceRouter)
app.use('/events', eventsRouter)
app.use('/news', newsRouter)
app.use('/forms', formsRouter)
app.use('/login', loginRouter)
app.use('/log', logRouter)
app.use('/application', applicationRouter)
app.use('/sms', smsRouter)
app.use('/verification', verificationRouter)
app.use('/reports', reportsRouter)

// Start the server
app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`)
})
