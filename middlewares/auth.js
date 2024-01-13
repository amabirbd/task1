const { PrismaClient } = require("@prisma/client");
const apiResponse = require("../utils/apiResponse");
const httpStatus = require("http-status");

const prisma = new PrismaClient();

const isAuthenticatedUser = async (req, res, next) => {
  if (req.session.user) {
    if (!req.session.user.id) {
      return res.status(401).json({ message: "You are not authenticated." });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found." });
      }

      // console.log(user);

      // Attach user information to the request for later use
      req.user = user;
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error." });
    }
  } else {
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "You are not logged in.",
    });
  }
};

const isAuthenticatedModerator = async (req, res, next) => {
  if (req.session.user) {
    if (!req.session.user.id) {
      return res.status(401).json({ message: "You are not authenticated." });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: req.session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          isVerified: true,
          role: true,
        },
      });

      if (!user) {
        return res.status(401).json({ message: "User not found." });
      }

      // Check if the user has the 'MODERATOR' role
      if (user.role === "MODERATOR") {
        // Attach user information to the request for later use
        req.user = user;
        next();
      } else {
        return res.status(403).json({
          message: "You do not have permission to access this resource.",
        });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error." });
    }
  } else {
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "You are not logged in.",
    });
  }
};
module.exports = { isAuthenticatedUser, isAuthenticatedModerator };
