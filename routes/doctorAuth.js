const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");

const router = express.Router();
const JWT_SECRET = "doctor-secret-key"; // different from user secret

// Doctor Register Page
router.get("/doctor-register", (req, res) => {
    res.render("doctor-register");
});

// Doctor Login Page
router.get("/doctor-login", (req, res) => {
    res.render("doctor-login");
});

// Doctor Register Post
router.post("/doctor-register", async (req, res) => {
   const { name, email, password, specialization, experience, rating, location,description } = req.body;


    const hashedPassword = await bcrypt.hash(password, 10);

    await Doctor.create({
        name,
        email,
        password: hashedPassword,
        specialization,
        experience,
        description,
        location
    });

    res.redirect("/doctor-login");
});

// Doctor Login Post
router.post("/doctor-login", async (req, res) => {
    const { email, password } = req.body;

    const doctor = await Doctor.findOne({ email });
    if (!doctor) return res.send("Doctor not found");

    const valid = await bcrypt.compare(password, doctor.password);
    if (!valid) return res.send("Wrong password");

    // Generate doctor token
    const token = jwt.sign(
        { id: doctor._id, name: doctor.name, email: doctor.email },
        JWT_SECRET,
        { expiresIn: "7d" }
    );

    res.cookie("doctorToken", token, { httpOnly: true });
    res.redirect("/doctor-dashboard");
});

// Doctor Logout
router.get("/doctor-logout", (req, res) => {
    res.clearCookie("doctorToken");
    res.redirect("/");
});

module.exports = router;
