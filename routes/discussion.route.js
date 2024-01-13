const express = require("express");
const {
  getAllDiscussion,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  createUserDiscussion,
  updateUserDiscussion,
  deleteUserDiscussion,
} = require("../controllers/discussion.controller");
const {
  isAuthenticatedUser,
  isAuthenticatedModerator,
} = require("../middlewares/auth");

const router = express.Router();

//public routes
router.get("/", getAllDiscussion);
router.get("/:id", getDiscussionById);

// user route
router.post(
  "/user/create-discussion",
  isAuthenticatedUser,
  createUserDiscussion
);
router.put(
  "/user/update-discussion/:id",
  isAuthenticatedUser,
  updateUserDiscussion
);
router.delete(
  "/user/delete-discussion/:id",
  isAuthenticatedUser,
  deleteUserDiscussion
);

// Routes accessible only to moderators
router.post(
  "/moderator/create-discussion",
  isAuthenticatedModerator,
  createDiscussion
);
router.put(
  "/moderator/update-discussion/:id",
  isAuthenticatedModerator,
  updateDiscussion
);
router.delete(
  "/moderator/delete-discussion/:id",
  isAuthenticatedModerator,
  deleteDiscussion
);

module.exports = router;
