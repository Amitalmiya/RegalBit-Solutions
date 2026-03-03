const express = require("express");
const router = express.Router();

const {
  requestPhoneOtp,
  verifyPhoneOtp,
  requestEmailOtp,
  verifyEmailOtp,
} = require("../controllers/authController");

router.post("/signup/requestphone-otp", requestPhoneOtp);
router.post("/signup/verifyphone-otp", verifyPhoneOtp);

router.post("/signup/requestemail-otp", requestEmailOtp);
router.post("/signup/verifyemail-otp", verifyEmailOtp);



module.exports = router;
