const httpStatus = require("http-status");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

const catchAsync = require("../utils/catchAsync");
const apiResponse = require("../utils/apiResponse");

const prisma = new PrismaClient();

const createReply = catchAsync(async (req, res) => {
  try {
    const { text, userId, discussionId } = req.body;

    const reply = await prisma.reply.create({
      data: { text, userId, discussionId },
    });

    return apiResponse(res, httpStatus.CREATED, { data: reply });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while creating a reply",
    });
  }
});

const getAllReply = catchAsync(async (req, res) => {
  try {
    const replies = await prisma.reply.findMany();
    return apiResponse(res, httpStatus.OK, { data: replies });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while fetching all replies",
    });
  }
});

const getReplyById = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;

    const reply = await prisma.reply.findUnique({
      where: { id },
    });

    if (!reply) {
      return apiResponse(res, httpStatus.NOT_FOUND, {
        error: "Reply not found",
      });
    }

    return apiResponse(res, httpStatus.OK, { data: reply });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while fetching a reply by ID",
    });
  }
});

const getAllReplyByDiscussionId = catchAsync(async (req, res) => {
  try {
    const { discussionId } = req.params;

    const replies = await prisma.reply.findMany({
      where: {
        discussionId,
      },
    });

    return apiResponse(res, httpStatus.OK, { data: replies });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while fetching all replies by discussion ID",
    });
  }
});

const updateReply = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    const updatedReply = await prisma.reply.update({
      where: { id },
      data: { text },
    });

    return apiResponse(res, httpStatus.OK, { data: updatedReply });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while updating a reply",
    });
  }
});

const deleteReply = catchAsync(async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.reply.delete({
      where: { id },
    });

    return apiResponse(res, httpStatus.OK, {
      message: "Reply deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while deleting a reply",
    });
  }
});

const createUserReply = catchAsync(async (req, res) => {
  const { text, discussionId } = req.body;
  const userId = req.user.id;
  try {
    const reply = await prisma.reply.create({
      data: { text, userId, discussionId },
    });
    return apiResponse(res, httpStatus.OK, {
      data: reply,
      message: "Reply created and associated with the user",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while creating a user's reply",
    });
  }
});

const updateUserReply = catchAsync(async (req, res) => {
  try {
    const { replyId } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    const updatedReply = await prisma.reply.update({
      where: { id: replyId, userId },
      data: { text },
    });

    return apiResponse(res, httpStatus.OK, {
      data: updatedReply,
      message: "User's reply updated successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while updating a user's reply",
    });
  }
});

const deleteUserReply = catchAsync(async (req, res) => {
  try {
    const replyId = req.params.id;
    const userId = req.user.id;

    await prisma.reply.delete({
      where: { id: replyId, userId },
    });

    return apiResponse(res, httpStatus.OK, {
      message: "User's reply deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while deleting a user's reply",
    });
  }
});

module.exports = {
  getAllReply,
  getReplyById,
  getAllReplyByDiscussionId,
  createReply,
  updateReply,
  deleteReply,
  createUserReply,
  updateUserReply,
  deleteUserReply,
};
