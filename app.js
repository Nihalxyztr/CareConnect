const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const adminRoutes = require("./routes/admin");
const app = express();
require("dotenv").config();

/* =====================================
   STATIC FILE SERVING
===================================== */

// Serve entire uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Serve healthRecords specifically
app.use("/uploads/healthRecords", 
    express.static(path.join(__dirname, "uploads/healthRecords"))
);

// ⭐ Serve prescriptions (IMPORTANT)
app.use("/uploads/prescriptions",
    express.static(path.join(__dirname, "uploads/prescriptions"))
);

/* =====================================
   TOKENS
===================================== */
const JWT_SECRET = process.env.JWT_SECRET || "careconnect-secret";
const DOCTOR_JWT_SECRET = process.env.DOCTOR_JWT_SECRET || "doctor-secret-key";

app.use(cookieParser());

/* =====================================
   DATABASE
===================================== */
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/careconnect";

mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000, // 45 seconds
  connectTimeoutMS: 10000, // 10 seconds
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => {
    console.log("❌ MongoDB Error:", err.message);
    console.log("💡 Check MongoDB Atlas connection and IP whitelist");
  });

/* =====================================
   VIEW ENGINE
===================================== */
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

/* =====================================
   GLOBAL USER CHECK
===================================== */
app.use((req, res, next) => {
  const token = req.cookies.token;
  try {
    res.locals.user = token ? jwt.verify(token, JWT_SECRET) : null;
  } catch {
    res.locals.user = null;
  }
  next();
});

/* =====================================
   GLOBAL DOCTOR CHECK
===================================== */
app.use((req, res, next) => {
  const doctorToken = req.cookies.doctorToken;
  try {
    res.locals.doctor = doctorToken ? jwt.verify(doctorToken, DOCTOR_JWT_SECRET) : null;
  } catch {
    res.locals.doctor = null;
  }
  next();
});

/* =====================================
   BLOCK DOCTOR FROM USER DASHBOARD
===================================== */
app.use((req, res, next) => {
  if (res.locals.doctor && req.url.startsWith("/dashboard")) {
    return res.redirect("/doctor-dashboard");
  }
  next();
});

/* =====================================
   ROUTES
===================================== */
app.use("/", require("./routes/index"));
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/doctors"));
app.use("/", require("./routes/dashboard"));
app.use("/", require("./routes/booking"));
app.use("/", require("./routes/doctorAuth"));
app.use("/", require("./routes/doctorDashboard"));
app.use("/", adminRoutes);
const videoRoutes = require("./routes/video");
app.use("/video", videoRoutes);

/* =====================================
   SERVER
===================================== */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
