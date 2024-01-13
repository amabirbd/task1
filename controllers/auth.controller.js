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
  const { name, email, password, keywords } = req.body;

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

  // check if the password is at least 8 characters
  if (password.length < 8) {
    return res
      .status(400)
      .json({ error: "Password must be at least 8 characters" });
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const verifyToken = createId();

  // create a secret for speakeasy otp authentication and save it in the database
  var secret = speakeasy.generateSecret();

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        keywords,
        verifyToken,
        verifyTokenExpiry: new Date(+Date.now() + 1000 * 60 * 60), // 1 hour from now
        twoFactorSecret: secret.base32,
      },
    });

    // send email verification
    const sendMail = await sendEmailVerification(user);
    if (sendMail.error) {
      return res.status(400).json({ error: sendMail.error });
    }

    return apiResponse(res, httpStatus.OK, {
      message: "Please check your email to verify your account",
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

  // Resend email verification
  const sendMail = await sendEmailVerification(user);
  if (sendMail.error) {
    return res.status(400).json({ error: sendMail.error });
  }

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

      // send two factor auth token in email
      const sendMail = await send2FaToken(user.email, token);
      if (sendMail.error) {
        return res.status(400).json({ error: sendMail.error });
      }
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

const enableDisable2fa = catchAsync(async (req, res) => {
  try {
    const { enable2faValue } = req.body;
    const userId = req.user.id;

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isTwoFactorEnabled: enable2faValue,
      },
    });

    return apiResponse(res, httpStatus.OK, {
      message: enable2faValue ? "2fa enabled" : "2fa disabled",
    });
  } catch (err) {
    console.log(err);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "Error while verifying 2FA token.",
    });
  }
});

const verify2fa = catchAsync(async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // Use verify() to check the token against the secret
    var tokenValidates = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: "base32",
      token: token,
      step: 3600,
      window: 6,
    });

    if (tokenValidates) {
      return apiResponse(res, httpStatus.OK, {
        data: { tokenValidates: true },
        message: "2FA tokenValidated.",
      });
    } else {
      return apiResponse(res, httpStatus.UNAUTHORIZED, {
        message: "Invalid 2FA token.",
      });
    }
  } catch (err) {
    console.log(err);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "Error while verifying 2FA token.",
    });
  }
});

const googleSignInOrSignUp = catchAsync(async (req, res) => {
  const { accessToken } = req.body;

  const response = await axios.get(
    `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    }
  );

  const { email, verified_email, name, picture } = response.data;

  if (!verified_email) {
    return apiResponse(res, httpStatus.UNAUTHORIZED, {
      message: "Google Sign In failed.",
    });
  }
  const userInDB = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      isKeywordsEmpty: true,
      isVerified: true,
    },
  });

  if (!userInDB) {
    // Create a new user if not exists
    const user = await prisma.user.create({
      data: {
        name,
        email,
        image: picture,
        isVerified: true,
        accountType: "GOOGLE",
      },
    });
    req.session.user = user;

    return apiResponse(res, httpStatus.OK, {
      message: "Google Sign Up successful.",
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
    });
  } else {
    if (userInDB.accountType === "CREDENTIALS") {
      return apiResponse(res, httpStatus.UNAUTHORIZED, {
        message:
          "Google Sign In failed. Email already exists with credentials.",
      });
    }

    //set session.user
    req.session.user = userInDB;

    return apiResponse(res, httpStatus.OK, {
      data: {
        user: {
          id: userInDB.id,
          name: userInDB.name,
          email: userInDB.email,
          image: userInDB.image,
          isKeywordsEmpty: userInDB.isKeywordsEmpty,
          isVerified: userInDB.isVerified,
          isPlanActivated: userInDB.isPlanActivated,
          activatedPlan: userInDB.activatedPlan,
          maxNumberOfEmail: userInDB.maxNumberOfEmail,
          subscribedWith: userInDB.subscribedWith,
        },
      },
      message: "Google Sign In successful.",
    });
  }

  // Get the JSON with  the user info
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

const forgotPassword = catchAsync(async (req, res) => {
  // email address of the user
  const { email } = req.body;
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const resetToken = createId();

  // Update the user's resetToken and resetTokenExpiry
  const updateUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      resetToken: resetToken,
      resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
    },
  });

  if (updateUser) {
    // send reset token mail

    const sendMail = await sendResetPassword(updateUser);
    if (sendMail.error) {
      return res.status(400).json({ error: sendMail.error });
    }
  }

  return apiResponse(res, httpStatus.OK, {
    message: "Please check your email for reset password link.",
  });
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

const getAllUsers = catchAsync(async (req, res) => {});

const refresh = catchAsync(async (req, res) => {
  const refreshToken = req.body.refreshToken;

  jwt.verify(refreshToken, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // If valid, generate a new access token
    const accessToken = generateAccessToken(user);
    return apiResponse(res, httpStatus.OK, {
      data: { accessToken },
    });
  });
});

const contactUs = catchAsync(async (req, res) => {
  const { name, email, message } = req.body;
  try {
    const contactUs = await prisma.ContactUs.create({
      data: {
        name,
        email,
        message,
      },
    });

    // You can perform additional actions here, e.g., sending an email notification

    return apiResponse(res, httpStatus.OK, {
      data: { success: true },
      message: "We received your message.",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      error: "Something went wrong while registering user",
    });
  }
});

// ------------------------------------
/* Copyright 2015-2016 PayPal, Inc. */

const addKeywords = catchAsync(async (req, res) => {
  try {
    const { keywords } = req.body;

    if (!keywords) {
      return apiResponse(res, httpStatus["500_MESSAGE"], {
        message: "keywords cant be empty.",
      });
    }
    const userId = req.user.id;
    // Find the user by their email
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // If the user doesn't exist, return an error
    if (!user) {
      return apiResponse(res, httpStatus.UNAUTHORIZED, {
        message: "Not authorized.",
      });
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        keywords: keywords,
        isKeywordsEmpty: false,
      },
    });

    return apiResponse(res, httpStatus.OK, {
      data: { user },
      message: "Keywords added successfully.",
    });
  } catch (error) {
    console.error(error);
    return apiResponse(res, httpStatus.INTERNAL_SERVER_ERROR, {
      message: "Something went wrong while loging in user",
    });
  }
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
      image: true,
      isKeywordsEmpty: true,
      isVerified: true,
      isPlanActivated: true,
      activatedPlan: true,
      maxNumberOfEmail: true,
      subscribedWith: true,
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
    message: "Keywords added successfully.",
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
      isPlanActivated: true,
      maxNumberOfEmail: true,
      subscribedWith: true,
      activatedPlan: true,
      isTwoFactorEnabled: true,
      keywords: true,
      accountType: true,
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
  googleSignInOrSignUp,
  logout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  getAllUsers,
  contactUs,
  refresh,
  addKeywords,
  me,
  // generate2fa,
  verify2fa,
  enableDisable2fa,
  userData,
};
