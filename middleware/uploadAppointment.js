// middleware/uploadAppointment.js
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const uploadPath = path.join(__dirname, "../uploads/appointmentFiles");

// Ensure folder exists
if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const safe = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
        cb(null, safe);
    }
});

const fileFilter = (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "application/pdf"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only JPG, PNG & PDF allowed."), false);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});
