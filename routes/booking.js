// routes/booking.js
const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

const uploadAppointmentFiles = require("../middleware/uploadAppointment");
const sendEmail = require("../utils/sendEmail");   // ⭐ IMPORT EMAIL SENDER

const TIME_SLOTS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"];

/*
   AUTH & BLOCK DOCTOR
*/
function auth(req, res, next) {
    if (!res.locals.user) return res.redirect("/login");
    next();
}
function blockDoctor(req, res, next) {
    if (res.locals.doctor) {
        return res.status(403).send("❌ Doctors cannot book appointments.");
    }
    next();
}

/* 
   DATE VALIDATION
*/
function validateDate(dateString) {
    const today = new Date();
    const selected = new Date(dateString);

    today.setHours(0,0,0,0);
    selected.setHours(0,0,0,0);

    if (selected < today) return "You cannot book a past date.";
    if (selected.getTime() === today.getTime()) return "Booking starts from tomorrow.";
    if (selected.getDay() === 0) return "Bookings are closed on Sunday.";

    return null;
}

/* 
   BOOK APPOINTMENT (GET)
*/
router.get("/book-appointment", auth, blockDoctor, async (req, res) => {
    try {
        const doctors = await Doctor.find({}).maxTimeMS(5000); // 5 second timeout
        const selectedDoctor = req.query.doctor || null;
        const selectedDate = req.query.date || null;

        let availableSlots = TIME_SLOTS;

        if (selectedDate) {
            const err = validateDate(selectedDate);
            if (err) {
                return res.send(`
                    <script>
                        alert("${err}");
                        window.location.href = "/book-appointment";
                    </script>
                `);
            }
        }

        if (selectedDoctor && selectedDate) {
            const booked = await Appointment.find({
                doctor: selectedDoctor,
                date: selectedDate
            }).maxTimeMS(5000);

            const bookedTimes = booked.map(a => a.time);
            availableSlots = TIME_SLOTS.filter(slot => !bookedTimes.includes(slot));
        }

        res.render("book-appointment", {
            doctors,
            selectedDoctor,
            selectedDate,
            availableSlots
        });
    } catch (error) {
        console.error("Error loading book-appointment page:", error);
        res.status(500).send(`
            <h2>Error Loading Page</h2>
            <p>There was an error connecting to the database. Please try again.</p>
            <a href="/dashboard">Go back to Dashboard</a>
        `);
    }
});

/* 
   BOOK APPOINTMENT (POST)
*/
router.post(
    "/book-appointment",
    auth,
    blockDoctor,
    uploadAppointmentFiles.array("appointmentFiles", 10),
    async (req, res) => {

        const { doctor, date, time, description } = req.body;

        // 1) Date rules
        const dateErr = validateDate(date);
        if (dateErr) {
            return res.send(`
                <script>
                    alert("${dateErr}");
                    window.location.href = "/book-appointment";
                </script>
            `);
        }

        // 2) Only 1 appointment per user per day
        const existingForUser = await Appointment.findOne({
            user: res.locals.user.id,
            date
        });
        if (existingForUser) {
            return res.send(`
                <script>
                    alert("You already have an appointment on this date.");
                    window.location.href = "/dashboard";
                </script>
            `);
        }

        // 3) Slot already taken?
        const exists = await Appointment.findOne({ doctor, date, time });
        if (exists) {
            return res.send(`
                <script>
                    alert("This slot is already booked.");
                    window.location.href = "/book-appointment?doctor=${doctor}&date=${date}";
                </script>
            `);
        }

        // 4) Save uploaded files
        let files = [];
        if (req.files && req.files.length > 0) {
            files = req.files.map(f => ({
                filename: f.filename,
                originalName: f.originalname
            }));
        }

        // 5) Create appointment including description
        const newAppointment = await Appointment.create({
            user: res.locals.user.id,
            doctor,
            date,
            time,
            description,
            appointmentFiles: files
        });

        // 6) ⭐ SEND EMAIL CONFIRMATION
        const doctorData = await Doctor.findById(doctor);

        const emailMessage = `
            <h2>Hello ${res.locals.user.name},</h2>
            <p>Your appointment has been successfully booked!</p>
            <h3>Appointment Details:</h3>
            <p><strong>Doctor:</strong> Dr. ${doctorData.name}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <br>
            <p>Thank you for choosing <strong>CareConnect</strong>.</p>
            <p>We wish you good health! 😊</p>
        `;

        await sendEmail(
            res.locals.user.email,
            "Your Appointment is Confirmed – CareConnect",
            emailMessage
        );

        res.redirect("/dashboard");
    }
);

/* =====================================================
   CANCEL APPOINTMENT
===================================================== */
router.post("/cancel-appointment", auth, async (req, res) => {
    await Appointment.deleteOne({
        _id: req.body.id,
        user: res.locals.user.id
    });

    res.redirect("/dashboard");
});

/* =====================================================
   RESCHEDULE
===================================================== */
router.get("/reschedule/:id", auth, blockDoctor, async (req, res) => {
    const appointment = await Appointment.findOne({
        _id: req.params.id,
        user: res.locals.user.id
    });

    if (!appointment) return res.redirect("/dashboard");

    const doctorId = appointment.doctor;
    const selectedDate = appointment.date;

    const booked = await Appointment.find({
        doctor: doctorId,
        date: selectedDate
    });

    const bookedTimes = booked.map(a => a.time);
    const availableSlots = TIME_SLOTS.filter(slot => !bookedTimes.includes(slot));

    if (availableSlots.length === 0) {
        return res.send(`
            <script>
                alert("No slots available for rescheduling on this date.");
                window.location.href = "/dashboard";
            </script>
        `);
    }

    res.render("reschedule", { appointment, availableSlots });
});

router.post("/reschedule/:id", auth, blockDoctor, async (req, res) => {
    const { date, time } = req.body;

    const dateErr = validateDate(date);
    if (dateErr) {
        return res.send(`
            <script>
                alert("${dateErr}");
                window.location.href = "/dashboard";
            </script>
        `);
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.redirect("/dashboard");

    // user already has another appointment that day?
    const anotherSameDay = await Appointment.findOne({
        user: res.locals.user.id,
        date,
        _id: { $ne: req.params.id }
    });
    if (anotherSameDay) {
        return res.send(`
            <script>
                alert("You already have another appointment on this date.");
                window.location.href = "/dashboard";
            </script>
        `);
    }

    // slot exists?
    const exists = await Appointment.findOne({
        doctor: appointment.doctor,
        date,
        time
    });
    if (exists) {
        return res.send(`
            <script>
                alert("This slot is already booked.");
                window.location.href = "/dashboard";
            </script>
        `);
    }

    await Appointment.updateOne(
        { _id: req.params.id, user: res.locals.user.id },
        { date, time }
    );

    res.redirect("/dashboard");
});

module.exports = router;
