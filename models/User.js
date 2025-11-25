const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    age: { type: String, default: "" },
    gender: { type: String, default: "" },
    healthRecords: [
        {
    filename: String,
    originalName: String,
    description: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now  }
        }
    ]
});

module.exports = mongoose.model("User", userSchema);
