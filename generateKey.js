// generateKey.js
const crypto = require('crypto')

const secretKey = crypto.randomBytes(64).toString('hex')
console.log('Your new JWT secret key:', secretKey)
