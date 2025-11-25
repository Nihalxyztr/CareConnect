// middleware/uploadPrescription.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure folder "uploads/prescriptions" exists in project root.
const uploadsDir = path.join(__dirname, "../uploads/prescriptions");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Ensure directory exists
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + file.originalname);
    }
});

const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png"
];

const fileFilter = (req, file, cb) => {
    cb(null, allowedTypes.includes(file.mimetype));
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});
