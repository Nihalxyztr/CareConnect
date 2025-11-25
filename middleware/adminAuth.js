// middleware/adminAuth.js

const jwt = require("jsonwebtoken");
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "careconnect-admin-secret";

module.exports = function adminAuth(req, res, next) {
  const token = req.cookies.adminToken;
  if (!token) return res.redirect("/admin/login");

  try {
    const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
    res.locals.admin = decoded;
    next();
  } catch (err) {
    res.clearCookie("adminToken");
    return res.redirect("/admin/login");
  }
};
