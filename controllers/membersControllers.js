/* eslint-disable no-undef */
// controllers/membersController.js
const Member = require("../models/member") // Import the Member model

// Function to update member
const updateMemberInDatabase = async (memberId, memberData) => {
    const member = await Member.findByPk(memberId)
    if (!member) {
        throw new Error("Member not found")
    }

    // Update member data
    return await member.update(memberData)
}

module.exports = {
    updateMemberInDatabase,
}
