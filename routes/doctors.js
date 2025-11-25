const express = require("express");
const router = express.Router();
const Doctor = require("../models/Doctor");

// BLOCK DOCTOR FROM ACCESSING THERAPISTS PAGE
function blockDoctor(req, res, next) {
    if (res.locals.doctor) {
        return res.status(403).send("❌ Doctors cannot access this page.");
    }
    next();
}

// Show all doctors (ONLY USERS / GUESTS)
router.get("/therapists", async (req, res) => {
    try {
        const { specialization } = req.query;

        let filter = {};
        if (specialization && specialization.trim() !== "") {
            filter.specialization = specialization;
        }

        const doctors = await Doctor.find(filter).maxTimeMS(5000);

        res.render("therapists", {
            doctors,
            specialization
        });
    } catch (error) {
        console.error("Error loading therapists page:", error);
        res.status(500).send(`
            <h2>Error Loading Page</h2>
            <p>There was an error connecting to the database. Please try again.</p>
            <a href="/">Go back to Home</a>
        `);
    }
});


// Doctor profile page
router.get("/doctor/:id", blockDoctor, async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id).maxTimeMS(5000);
        if (!doctor) return res.send("Doctor not found");

        res.render("doctor-profile", { doctor });
    } catch (error) {
        console.error("Error loading doctor profile:", error);
        res.status(500).send(`
            <h2>Error Loading Page</h2>
            <p>There was an error connecting to the database. Please try again.</p>
            <a href="/therapists">Go back to Doctors</a>
        `);
    }
});

module.exports = router;
