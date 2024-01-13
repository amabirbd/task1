const express = require("express");
const {
  getAllReply,
  getReplyById,
  getAllReplyByDiscussionId,
  createReply,
  updateReply,
  deleteReply,
  createUserReply,
  updateUserReply,
  deleteUserReply,
} = require("../controllers/reply.controller");
const {
  isAuthenticatedUser,
  isAuthenticatedModerator,
} = require("../middlewares/auth");

const router = express.Router();

//public routes
router.get("/", getAllReply);
router.get("/:id", getReplyById);
// Route to get all replies by discussion ID
router.get("/:discussionId", getAllReplyByDiscussionId);

// user route
router.post("/user/create-reply", isAuthenticatedUser, createUserReply);
router.put("/user/update-reply/:id", isAuthenticatedUser, updateUserReply);
router.delete("/user/delete-reply/:id", isAuthenticatedUser, deleteUserReply);

// Routes accessible only to moderators
router.post("/moderator/create-reply", isAuthenticatedModerator, createReply);
router.put(
  "/moderator/update-reply/:id",
  isAuthenticatedModerator,
  updateReply
);
router.delete(
  "/moderator/delete-reply/:id",
  isAuthenticatedModerator,
  deleteReply
);

module.exports = router;
