// routes/dashboard.js
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

const Appointment = require("../models/Appointment");
const User = require("../models/User");

const uploadHealth = require("../middleware/uploadHealth");

// USER auth middleware
function auth(req, res, next) {
    if (!res.locals.user) return res.redirect("/login");
    next();
}

/*
   UPLOAD HEALTH RECORD (WITH DESCRIPTION)
*/
router.post(
    "/dashboard/records/upload",
    auth,
    uploadHealth.single("record"),
    async (req, res) => {
        try {
            // If file was rejected due to invalid type
            if (req.fileValidationError || req.invalidFile) {
                return res.send(`
                    <script>
                        alert("Invalid file type. Please upload PDF, JPG, or PNG files only.");
                        window.location.href = "/dashboard/records";
                    </script>
                `);
            }

            // If no file selected
            if (!req.file) {
                return res.send(`
                    <script>
                        alert("Please select a file to upload.");
                        window.location.href = "/dashboard/records";
                    </script>
                `);
            }

            await User.updateOne(
                { _id: res.locals.user.id },
                {
                    $push: {
                        healthRecords: {
                            filename: req.file.filename,
                            originalName: req.file.originalname,
                            description: req.body.description || "",
                            uploadedAt: new Date()
                        }
                    }
                }
            );

            res.redirect("/dashboard/records");
        } catch (error) {
            console.error("Error uploading health record:", error);
            res.status(500).send(`
                <h2>Upload Error</h2>
                <p>There was an error uploading your file. Please try again.</p>
                <p>Error: ${error.message}</p>
                <a href="/dashboard/records">Go back</a>
            `);
        }
    }
);


/* =====================================
   DELETE HEALTH RECORD
===================================== */
router.post("/dashboard/records/delete", auth, async (req, res) => {
    const { filename } = req.body;

    await User.updateOne(
        { _id: res.locals.user.id },
        { $pull: { healthRecords: { filename } } }
    );

    const filePath = path.join(__dirname, "../uploads/healthRecords", filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }

    res.redirect("/dashboard/records");
});


router.get("/dashboard", auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({
            user: res.locals.user.id,
            isCompleted:false            // <-- only ongoing (upcoming) appointments
        })
            .populate("doctor")
            .populate("user")
            .sort({ date: 1, time: 1 })
            .lean();

        res.render("dashboard/layout", {
            title: "Dashboard",
            page: "pages/home",
            appointments,
            user: res.locals.user
        });

    } catch (err) {
        res.send("Error loading dashboard: " + err.message);
    }
});

/* =====================================
   HEALTH RECORDS PAGE
===================================== */
router.get("/dashboard/records", auth, async (req, res) => {

    const user = await User.findById(res.locals.user.id).lean();

    res.render("dashboard/layout", {
        title: "Health Records",
        page: "pages/record",
        user
    });
});


router.get("/dashboard/consultations", auth, async (req, res) => {
    try {
        const appointments = await Appointment.find({
            user: res.locals.user.id,
            isCompleted:true         // <-- only completed (previous) appointments
        })
            .populate("doctor")
            .populate("user")
            .sort({ "prescription.date": -1, date: -1, time: -1 })
            .lean();

        res.render("dashboard/layout", {
            title: "Consultations",
            page: "pages/consultation",
            user: res.locals.user,
            appointments
        });

    } catch (err) {
        res.send("Error loading consultations: " + err.message);
    }
});

/* =====================================
   USER PROFILE
===================================== */
router.get("/dashboard/profile", auth, async (req, res) => {
    const user = await User.findById(res.locals.user.id).lean();

    res.render("dashboard/layout", {
        title: "Profile",
        page: "pages/profile",
        user
    });
});

/* =====================================
   UPDATE PROFILE + FORCE LOGOUT
===================================== */
router.post("/dashboard/profile", auth, async (req, res) => {
    const { name, phone, age, gender } = req.body;

    await User.updateOne(
        { _id: res.locals.user.id },
        { name, phone, age, gender }
    );

    // Clear token so new info is reloaded on next login/render
    res.clearCookie("token");
    res.redirect("/login");
});
/* =====================================
   DELETE CONSULTATION (Completed Appointment)
===================================== */
router.post("/dashboard/consultations/delete", auth, async (req, res) => {
    try {
        const { id } = req.body;

        await Appointment.deleteOne({ 
            _id: id, 
            user: res.locals.user.id, 
            isCompleted: true 
        });

        res.redirect("/dashboard/consultations");

    } catch (err) {
        res.send("Error deleting consultation: " + err.message);
    }
});


module.exports = router;
