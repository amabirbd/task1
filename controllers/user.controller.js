const httpStatus = require("http-status");
const bcrypt = require("bcrypt");
const { createId } = require("@paralleldrive/cuid2");
const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const catchAsync = require("../utils/catchAsync");
const apiResponse = require("../utils/apiResponse");
const {
  sendEmailVerification,
  sendResetPassword,
  send2FaToken,
} = require("../lib/mail-temp");

const prisma = new PrismaClient();

var speakeasy = require("speakeasy");

const register = catchAsync(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Check if user already exists in the database
  const existedUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (existedUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  if (!password) {
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "Please provide a password",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  // const verifyToken = createId();

  // create a secret for speakeasy otp authentication and save it in the database
  // var secret = speakeasy.generateSecret();

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        // verifyToken,
        // verifyTokenExpiry: new Date(+Date.now() + 1000 * 60 * 60), // 1 hour from now
        // twoFactorSecret: secret.base32,
        isVerified: true,
      },
    });

    // // send email verification
    // const sendMail = await sendEmailVerification(user);
    // if (sendMail.error) {
    //   return res.status(400).json({ error: sendMail.error });
    // }

    return apiResponse(res, httpStatus.OK, {
      data: user,
      message: "Account created",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Something went wrong  while registering  user" });
  }
});

const resendVerificationMail = catchAsync(async (req, res) => {
  const { email } = req.body;

  // Find a user with the given reset token and a reset token expiry that's in the future
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  });

  if (!user) {
    return res.status(400).json({ message: "No User found." });
  }

  // // Resend email verification
  // const sendMail = await sendEmailVerification(user);
  // if (sendMail.error) {
  //   return res.status(400).json({ error: sendMail.error });
  // }

  return apiResponse(res, httpStatus.OK, {
    message: "Please check your email to verify your account",
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;

  // Find a user with the given reset token and a reset token expiry that's in the future
  const user = await prisma.user.findFirst({
    where: {
      verifyToken: token,
      verifyTokenExpiry: {
        gte: new Date(),
      },
    },
  });

  if (!user) {
    return res
      .status(400)
      .json({ message: "Invalid or expired verify token." });
  }

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      isVerified: true,
      verifyToken: null,
    },
  });

  return apiResponse(res, httpStatus.OK, {
    data: { success: true },
    message: "Email verified.",
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password, twofacode } = req.body;

  try {
    // Find the user by their email
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // If the user doesn't exist, return an error
    if (!user) {
      return apiResponse(res, httpStatus.UNAUTHORIZED, {
        message: "Invalid email or password.",
      });
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return apiResponse(res, httpStatus.UNAUTHORIZED, {
        message: "Invalid email or password.",
      });
    }

    if (!user.isVerified) {
      return apiResponse(res, httpStatus.UNAUTHORIZED, {
        message: "Please verify your email.",
      });
    }

    if (user.isTwoFactorEnabled && !twofacode) {
      //create token
      var token = speakeasy.totp({
        secret: user.twoFactorSecret,
        encoding: "base32",
        step: 3600,
      });

      // // send two factor auth token in email
      // const sendMail = await send2FaToken(user.email, token);
      // if (sendMail.error) {
      //   return res.status(400).json({ error: sendMail.error });
      // }
      return apiResponse(res, httpStatus.OK, {
        data: { twofaenabled: true },
        message: "Two factor auth token sent to your email.",
      });
    }

    if (user.isTwoFactorEnabled && twofacode) {
      // Use verify() to check the token against the secret
      var tokenValidates = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: "base32",
        token: twofacode,
        step: 3600,
        window: 6,
      });

      if (!tokenValidates) {
        return apiResponse(res, httpStatus.UNAUTHORIZED, {
          message: "Invalid 2FA token.",
        });
      }
    }

    //set session.user
    req.session.user = user;

    return apiResponse(res, httpStatus.OK, {
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          isKeywordsEmpty: user.isKeywordsEmpty,
          isVerified: user.isVerified,
          isPlanActivated: user.isPlanActivated,
          activatedPlan: user.activatedPlan,
          maxNumberOfEmail: user.maxNumberOfEmail,
          subscribedWith: user.subscribedWith,
        },
      },
      message: "Login successful.",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "Something went wrong while loging in user",
    });
  }
});

const logout = catchAsync(async (req, res) => {
  //set session to null
  req.session.user = null;
  req.session.save(function (err) {
    if (err) next(err);

    // regenerate the session, which is good practice to help
    // guard against forms of session fixation
    req.session.regenerate(function (err) {
      if (err) next(err);
    });
  });

  return apiResponse(res, httpStatus.OK, {
    message: "logged out.",
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const { name, keywords: newKeywords } = req.body;

  // Retrieve the user from the database
  const user = await prisma.user.findUnique({
    where: {
      id: req.user.id,
    },
  });

  if (!user) {
    // Handle the case where the user is not found
    return apiResponse(res, httpStatus.NOT_FOUND, {
      message: "User not found.",
    });
  }

  // Build the data object for updating based on the fields present in the request body
  const updateData = {};

  if (name !== undefined) {
    updateData.name = name;
  }

  if (newKeywords !== undefined && Array.isArray(newKeywords)) {
    // Combine existing keywords with new keywords (remove duplicates)
    const updatedKeywords = Array.from(
      new Set([...user.keywords, ...newKeywords])
    );
    updateData.keywords = updatedKeywords;
  }

  // Update the user with the new data
  const updatedUser = await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: updateData,
    select: {
      name: true,
      email: true,
      keywords: true,
    },
  });

  return apiResponse(res, httpStatus.OK, {
    data: updatedUser,
    message: "Profile updated",
  });
});

const changePassword = catchAsync(async (req, res) => {
  if (req.session.user) {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.session.user.id;

    // Validate input
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return apiResponse(res, httpStatus.BAD_REQUEST, {
        message: "All fields are required.",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return apiResponse(res, httpStatus.BAD_REQUEST, {
        message: "New password and confirm password do not match.",
      });
    }

    try {
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        return apiResponse(res, httpStatus.NOT_FOUND, {
          message: "User not found.",
        });
      }

      // Compare the provided old password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(oldPassword, user.password);

      if (!passwordMatch) {
        return apiResponse(res, httpStatus.UNAUTHORIZED, {
          message: "Invalid old password.",
        });
      }

      // Hash and update the user's password
      const hashedNewPassword = await bcrypt.hash(newPassword, 8);
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedNewPassword,
        },
      });

      return apiResponse(res, httpStatus.OK, {
        message: "Password changed successfully.",
      });
    } catch (error) {
      console.error(error);
      return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
        message: "Error changing password.",
      });
    }
  } else {
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "Please log in to change password.",
    });
  }
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, id } = req.query;
  const { password } = req.body;

  // Find a user with the given reset token and a reset token expiry that's in the future
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token." });
  }

  if (user.resetToken !== token) {
    return res.status(400).json({ message: "Invalid reset token." });
  }

  if (new Date() > user.resetTokenExpiry) {
    return res.status(400).json({ message: "Reset token has been expired." });
  }

  const hashedNewPassword = await bcrypt.hash(password, 8);

  await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedNewPassword,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return apiResponse(res, httpStatus.OK, {
    data: { success: true },
    message: "Your password has been reset.",
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await prisma.user.findMany();

  return apiResponse(res, httpStatus.OK, {
    data: users,
  });
});

const me = catchAsync(async (req, res) => {
  const userId = req.user.id;
  // Find the user by their email
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  // If the user doesn't exist, return an error
  if (!user) {
    return apiResponse(res, httpStatus.UNAUTHORIZED, {
      message: "Not authorized.",
    });
  }

  return apiResponse(res, httpStatus.OK, {
    data: { user },
    message: "User fetched successfully.",
  });
});

const userData = catchAsync(async (req, res) => {
  const userId = req.user.id;
  // Find the user by their email
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
    },
  });

  // If the user doesn't exist, return an error
  if (!user) {
    return apiResponse(res, httpStatus.UNAUTHORIZED, {
      message: "Not authorized.",
    });
  }

  return apiResponse(res, httpStatus.OK, {
    data: { user },
  });
});

module.exports = {
  register,
  resendVerificationMail,
  verifyEmail,
  login,
  logout,
  updateProfile,
  changePassword,
  resetPassword,
  getAllUsers,
  me,
  userData,
};
