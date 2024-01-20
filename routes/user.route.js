const express = require("express");
const {
  updateProfile,
  changePassword,
  resetPassword,
  getAllUsers,
  userData,
} = require("../controllers/user.controller");
const {
  isAuthenticatedUser,
  isAuthenticatedModerator,
} = require("../middlewares/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome to users route." });
});

router.post("/updateProfile", isAuthenticatedUser, updateProfile);
router.post("/changePassword", isAuthenticatedUser, changePassword);
router.post("/resetPassword", resetPassword);

router.get("/getAllUsers", getAllUsers);

// Example protected route
router.get("/protected", isAuthenticatedModerator, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

router.get("/user-data", isAuthenticatedUser, userData);

module.exports = router;
