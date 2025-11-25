const express = require("express");
const router = express.Router();

router.get("/:appointmentId", (req, res) => {
    const { appointmentId } = req.params;

    // Pass meeting room name to EJS
    res.render("video-call", { roomId: appointmentId });
});

module.exports = router;
