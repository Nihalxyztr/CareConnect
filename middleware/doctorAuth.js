const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor");

const DOCTOR_JWT_SECRET = "doctor-secret-key";

module.exports = async (req, res, next) => {
    try {
        const token = req.cookies.doctorToken;
        if (!token) {
            return res.redirect("/doctor-login");
        }

        const decoded = jwt.verify(token, DOCTOR_JWT_SECRET);
        req.doctor = decoded;
        res.locals.doctor = decoded;
        next();

    } catch (err) {
        return res.redirect("/doctor-login");
    }
};
