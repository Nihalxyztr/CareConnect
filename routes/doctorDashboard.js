// routes/doctorDashboard.js
const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

const uploadPrescription = require("../middleware/uploadPrescription");


// Doctor Auth Check
function doctorAuth(req, res, next) {
    if (!res.locals.doctor) return res.redirect("/doctor-login");
    next();
}


/* ============================
   DOCTOR DASHBOARD (Upcoming)
============================ */
router.get("/doctor-dashboard", doctorAuth, async (req, res) => {
    try {
        const doctor = await Doctor.findById(res.locals.doctor.id);

        const appointments = await Appointment.find({
            doctor: doctor._id,
            isCompleted: false
        }).populate("user");

        res.render("doctorDashboard/layout", {
            page: "pages/home",
            doctor,
            appointments
        });

    } catch (err) {
        res.send("Error: " + err.message);
    }
});


/* ============================
   SINGLE APPOINTMENT VIEW
   (Independent route)
============================ */
router.get("/doctor-dashboard/appointment/:appointmentId", doctorAuth, async (req, res) => {
    try {
        const doctorId = res.locals.doctor.id;

        const appointment = await Appointment.findOne({
            _id: req.params.appointmentId,
            doctor: doctorId
        }).populate("user");

        if (!appointment) {
            return res.send("❌ Appointment not found or not assigned to you.");
        }

        const doctor = await Doctor.findById(doctorId);
        
        res.render("doctorDashboard/layout", {
            page: "pages/singleAppointment",
            doctor,
            appointment
        });

    } catch (err) {
        res.send("Error loading appointment: " + err.message);
    }
});


/* ============================
   PATIENT DETAILS (All Appointments)
============================ */
router.get("/doctor-dashboard/patient/:patientId", doctorAuth, async (req, res) => {
    try {
        const doctor = await Doctor.findById(res.locals.doctor.id);
        const patient = await User.findById(req.params.patientId);

        const appointments = await Appointment.find({
            user: patient._id,
            doctor: doctor._id
        })
            .populate("user")
            .populate("doctor");

        res.render("doctorDashboard/layout", {
            page: "pages/patient",
            doctor,
            patient,
            appointments
        });

    } catch (err) {
        res.send("Error: " + err.message);
    }
});


/* ============================
   COMPLETE APPOINTMENT
============================ */
router.post(
    "/doctor-dashboard/complete/:appointmentId",
    doctorAuth,
    uploadPrescription.single("prescriptionFile"),
    async (req, res) => {
        try {
            const text = req.body.text || "";
            const file = req.file ? req.file.filename : "";

            await Appointment.updateOne(
                { _id: req.params.appointmentId },
                {
                    isCompleted: true,
                    prescription: {
                        text,
                        file,
                        date: new Date()
                    }
                }
            );

            res.redirect("/doctor-dashboard");
        } catch (err) {
            res.send("Error: " + err.message);
        }
    }
);


/* ============================
   PAST APPOINTMENTS
============================ */
router.get("/doctor-dashboard/past", doctorAuth, async (req, res) => {
    try {
        const doctor = await Doctor.findById(res.locals.doctor.id);

        const appointments = await Appointment.find({
            doctor: doctor._id,
            isCompleted: true
        }).populate("user");

        res.render("doctorDashboard/layout", {
            page: "pages/past",
            doctor,
            appointments
        });

    } catch (err) {
        res.send("Error: " + err.message);
    }
});


/* ============================
   PROFILE PAGE
============================ */
router.get("/doctor-dashboard/profile", doctorAuth, async (req, res) => {
    const doctor = await Doctor.findById(res.locals.doctor.id);

    res.render("doctorDashboard/layout", {
        page: "pages/profile",
        doctor
    });
});


/* ============================
   UPDATE PROFILE
============================ */
router.post("/doctor-dashboard/profile", doctorAuth, async (req, res) => {
    try {
        const { name, specialization, experience, rating, description } = req.body;

        await Doctor.updateOne(
            { _id: res.locals.doctor.id },
            { name, specialization, experience, rating, description }
        );

        // Refresh doctor session
        res.clearCookie("doctorToken");
        res.redirect("/doctor-login");

    } catch (err) {
        res.send("Error updating profile: " + err.message);
    }
});


/* ============================
   LOGOUT
============================ */
router.get("/logout-doctor", (req, res) => {
    res.clearCookie("doctorToken");
    res.redirect("/doctor-login");
});


module.exports = router;
