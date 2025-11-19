const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = "careconnect-secret";

// GET login & register pages
router.get("/login", (req, res) => res.render("login"));
router.get("/register", (req, res) => res.render("register"));

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashed
  });

  res.redirect("/login");
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.send("User not found");

  const correct = await bcrypt.compare(password, user.password);
  if (!correct) return res.send("Wrong Credentials");

 const token = jwt.sign(
  { id: user._id, name: user.name, email: user.email },
  JWT_SECRET,
  { expiresIn: "7d" }
);


  res.cookie("token", token, { httpOnly: true });
  res.redirect("/dashboard");
});

// LOGOUT
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.redirect("/");
});




module.exports = router;
