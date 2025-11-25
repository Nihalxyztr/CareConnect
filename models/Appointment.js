const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },

    date: String,
    time: String,

    description: { type: String, default: "" },

    appointmentFiles: [
        {
            filename: String,
            originalName: String,
            uploadedAt: { type: Date, default: Date.now }
        }
    ],

   
    prescription: {
        text: { type: String, default: "" },
        file: { type: String, default: "" },
        date: Date
    },

    // Only ONE boolean (easy life)
    isCompleted: {
        type: Boolean,
        default: false
    }

}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
