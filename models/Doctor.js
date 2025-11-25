const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    specialization: { type: String, required: true },
    experience: { type: String, required: true },
    rating: { type: Number, default: 4.5 },
    description: { type: String, default: "Experienced certified medical professional." },

    // ⭐ NEW FIELD ADDED
    location: { type: String, required: true }
});

module.exports = mongoose.model("Doctor", doctorSchema);
