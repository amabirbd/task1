const express = require("express");
const ApiError = require("./../utils/ApiError");
const apiResponse = require("../utils/apiResponse");
const httpStatus = require("http-status");
const {
  register,
  verifyEmail,
  login,
  googleSignInOrSignUp,
  logout,
  resendVerificationMail,
} = require("../controllers/user.controller");
const { isAuthenticatedUser } = require("../middlewares/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to users route." });
});

router.post("/register", register);
router.post("/resend-verification-mail", resendVerificationMail);
router.get("/verifyEmail", verifyEmail);

router.post("/login", login);
router.post("/googleSignIn", googleSignInOrSignUp);

router.get("/logout", logout);

module.exports = router;
