const express = require("express");
const ApiError = require("./../utils/ApiError");
const apiResponse = require("../utils/apiResponse");
const httpStatus = require("http-status");
const userRoute = require("./user.route");
const authRoute = require("./auth.route");
const discussionRoute = require("./discussion.route");
const replyRoute = require("./reply.route");
const { isAuthenticatedModerator } = require("../middlewares/auth");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Welcome Home." });
});

router.get("/test", isAuthenticatedModerator, (req, res) => {
  console.log(req.user);
  res.json({ message: "Welcome to test." });
});

router.use("/users", userRoute);
router.use("/auth", authRoute);
router.use("/discussion", discussionRoute);
router.use("/reply", replyRoute);

// send back a 404 error for any unknown api request
router.use((req, res, next) => {
  const error = new ApiError(httpStatus.NOT_FOUND);
  return next(error);
});

// convert error to ApiError, if needed
router.use((error, req, res, next) => {
  const status = error.statusCode || res.statusCode || 500;
  // const stack = process.env.NODE_ENVIRONMENT !== "production" ? error.stack : {};
  const stack = error.stack;

  return apiResponse(res, status, error.message, stack);
});

module.exports = router;
