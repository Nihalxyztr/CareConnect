// utils/sendEmail.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

module.exports = async function sendEmail(to, subject, message) {
    await transporter.sendMail({
        from: `"CareConnect" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html: message
    });
};
