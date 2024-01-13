const httpStatus = require("http-status");
const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

const catchAsync = require("../utils/catchAsync");
const apiResponse = require("../utils/apiResponse");

const prisma = new PrismaClient();

const createDiscussion = catchAsync(async (req, res) => {
  const { title, description, userId } = req.body;

  try {
    const discussion = await prisma.discussion.create({
      data: {
        title,
        description,
        userId,
      },
    });

    return apiResponse(res, httpStatus.OK, {
      data: discussion,
      message: "Discussion created successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while creating the discussion",
    });
  }
});

const getAllDiscussion = catchAsync(async (req, res) => {
  try {
    const discussions = await prisma.discussion.findMany({
      include: {
        createdBy: true,
        replies: {
          include: {
            createdBy: true,
          },
        },
      },
    });

    return apiResponse(res, httpStatus.OK, {
      data: discussions,
      message: "Discussions retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while fetching discussions",
    });
  }
});

const getDiscussionById = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const discussion = await prisma.discussion.findUnique({
      where: { id },
      include: {
        createdBy: true,
        replies: {
          include: {
            createdBy: true,
          },
        },
      },
    });

    if (!discussion) {
      return apiResponse(res, httpStatus.NOT_FOUND, {
        error: "Discussion not found",
      });
    }

    return apiResponse(res, httpStatus.OK, {
      data: discussion,
      message: "Discussion retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while fetching the discussion",
    });
  }
});

const updateDiscussion = catchAsync(async (req, res) => {
  const { discussionId } = req.params;
  const { title, description } = req.body;

  try {
    const discussion = await prisma.discussion.update({
      where: { discussionId },
      data: {
        title,
        description,
      },
    });

    return apiResponse(res, httpStatus.OK, {
      data: discussion,
      message: "Discussion updated successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while updating the discussion",
    });
  }
});

const deleteDiscussion = catchAsync(async (req, res) => {
  const { id } = req.params;

  try {
    const discussion = await prisma.discussion.delete({
      where: { id },
    });

    return apiResponse(res, httpStatus.OK, {
      data: discussion,
      message: "Discussion deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while deleting the discussion",
    });
  }
});

const createUserDiscussion = catchAsync(async (req, res) => {
  const { title, description } = req.body;

  const userId = req.user.id;

  try {
    const discussion = await prisma.discussion.create({
      data: {
        title,
        description,
        userId,
      },
    });

    return apiResponse(res, httpStatus.OK, {
      data: discussion,
      message: "Discussion created successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while creating the discussion",
    });
  }
});

const updateUserDiscussion = catchAsync(async (req, res) => {
  const { discussionId } = req.params;
  const { title, description } = req.body;
  const userId = req.user.id;

  try {
    // Check if the discussion belongs to the user
    const discussion = await prisma.discussion.findFirst({
      where: {
        id: discussionId,
        userId,
      },
    });

    if (!discussion) {
      return apiResponse(res, httpStatus.NOT_FOUND, {
        error: "Discussion not found or does not belong to the user",
      });
    }

    // Update the discussion
    const updatedDiscussion = await prisma.discussion.update({
      where: { id: discussionId },
      data: {
        title,
        description,
      },
    });

    return apiResponse(res, httpStatus.OK, {
      data: updatedDiscussion,
      message: "Discussion updated successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while updating the discussion",
    });
  }
});

const deleteUserDiscussion = catchAsync(async (req, res) => {
  const { discussionId } = req.params;
  const userId = req.user.id;

  try {
    const discussion = await prisma.discussion.delete({
      where: { id: discussionId, userId },
    });

    return apiResponse(res, httpStatus.OK, {
      data: discussion,
      message: "Discussion deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while deleting the discussion",
    });
  }
});

module.exports = {
  getAllDiscussion,
  getDiscussionById,
  createDiscussion,
  updateDiscussion,
  deleteDiscussion,
  createUserDiscussion,
  updateUserDiscussion,
  deleteUserDiscussion,
};
