// routes/admin.js
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Doctor = require("../models/Doctor");
const User = require("../models/User");
const Appointment = require("../models/Appointment");

const adminAuth = require("../middleware/adminAuth");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@careconnect.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"; // CHANGE THIS
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "careconnect-admin-secret";

// ---------- ADMIN LOGIN PAGE ----------
router.get("/admin/login", (req, res) => {
  res.render("admin/login", { error: null });
});

// ---------- ADMIN LOGIN POST ----------
router.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;

  // Simple dev admin check — replace with a proper admin collection for production.
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ email }, ADMIN_JWT_SECRET, { expiresIn: "8h" });
    res.cookie("adminToken", token, { httpOnly: true });
    return res.redirect("/admin/dashboard");
  }

  return res.render("admin/login", { error: "Invalid credentials" });
});

// ---------- ADMIN LOGOUT ----------
router.get("/admin/logout", (req, res) => {
  res.clearCookie("adminToken");
  res.redirect("/admin/login");
});

// ---------- ADMIN DASHBOARD (list doctors & patients) ----------
router.get("/admin/dashboard", adminAuth, async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ name: 1 }).lean();
    const patients = await User.find({}).sort({ name: 1 }).lean();

    res.render("admin/dashboard", {
      adminEmail: res.locals.admin && res.locals.admin.email,
      doctors,
      patients
    });
  } catch (err) {
    res.send("Error loading admin dashboard: " + err.message);
  }
});

// ---------- DELETE DOCTOR ----------
router.post("/admin/delete-doctor/:id", adminAuth, async (req, res) => {
  try {
    const docId = req.params.id;

    // Delete doctor record
    await Doctor.deleteOne({ _id: docId });

    // Delete appointments associated with this doctor
    await Appointment.deleteMany({ doctor: docId });

    res.redirect("/admin/dashboard");
  } catch (err) {
    res.send("Error deleting doctor: " + err.message);
  }
});

// ---------- DELETE PATIENT ----------
router.post("/admin/delete-patient/:id", adminAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    // Delete user
    await User.deleteOne({ _id: userId });

    // Delete appointments associated with this user
    await Appointment.deleteMany({ user: userId });

    res.redirect("/admin/dashboard");
  } catch (err) {
    res.send("Error deleting patient: " + err.message);
  }
});

module.exports = router;
