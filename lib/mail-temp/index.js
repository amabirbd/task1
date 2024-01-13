const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");
const { transport } = require("../common");

const { DASHBOARD_URL, EMAIL_FROM } = process.env;

const verifySource = fs.readFileSync(
  path.resolve("lib/mail-temp/verify.handlebars"),
  "utf-8"
);
const resetPasswordSource = fs.readFileSync(
  path.resolve("lib/mail-temp/reset.handlebars"),
  "utf-8"
);

const twoFaSource = fs.readFileSync(
  path.resolve("lib/mail-temp/twoFa.handlebars"),
  "utf-8"
);

const subscriptionAddedSource = fs.readFileSync(
  path.resolve("lib/mail-temp/subscriptionAdded.handlebars"),
  "utf-8"
);

const subscriptionUpdatedSource = fs.readFileSync(
  path.resolve("lib/mail-temp/subscriptionUpdated.handlebars"),
  "utf-8"
);

const subscriptionCancelledSource = fs.readFileSync(
  path.resolve("lib/mail-temp/subscriptionCancelled.handlebars"),
  "utf-8"
);

const verifyEmailTemplate = Handlebars.compile(verifySource);
const resetPasswordTemplate = Handlebars.compile(resetPasswordSource);
const twoFaTemplate = Handlebars.compile(twoFaSource);
const subscriptionAddedTemplate = Handlebars.compile(subscriptionAddedSource);
const subscriptionUpdatedTemplate = Handlebars.compile(
  subscriptionUpdatedSource
);
const subscriptionCancelledTemplate = Handlebars.compile(
  subscriptionCancelledSource
);

async function sendEmailVerification({
  firstname,
  lastname,
  email,
  verifyToken,
  id,
}) {
  try {
    const verifyUrl = `${DASHBOARD_URL}/verify?token=${verifyToken}&id=${id}`;

    // Send email with verification url
    await transport.sendMail({
      from: `Enhancivity Team ${EMAIL_FROM}`,
      to: email,
      subject: "Enhancivity | Email verification",
      html: verifyEmailTemplate({
        name: firstname + " " + lastname,
        email,
        verifyToken,
        verifyUrl,
      }),
    });

    return { message: "Verification url sent to your mail" };
  } catch (error) {
    return { error: "Cannot send email please contact with support team." };
  }
}

async function sendResetPassword({ email, resetToken, id }) {
  try {
    const resetUrl = `${DASHBOARD_URL}/reset?resetToken=${resetToken}&id=${id}`;

    await transport.sendMail({
      from: `Enhancivity Team ${EMAIL_FROM}`,
      to: email,
      subject: "Enhancivity | Reset your password",
      html: resetPasswordTemplate({ resetUrl }),
    });

    return { message: "Verification url sent to your mail" };
  } catch (error) {
    throw new Error("Cannot send email please contact with support team.");
  }
}

async function send2FaToken(email, twoFaToken) {
  try {
    await transport.sendMail({
      from: `Enhancivity Team ${EMAIL_FROM}`,
      to: email,
      subject:
        "Enhancivity | Confirm your identity with Two factor authentication",
      html: twoFaTemplate({ twoFaToken }),
    });

    return { message: "Verification url sent to your mail" };
  } catch (error) {
    throw new Error("Cannot send email please contact with support team.");
  }
}

async function sendSubscriptionAdded(
  email,
  subscriptionId,
  planName,
  planCost
) {
  // console.log(email, subscriptionId, planName, planCost);
  try {
    await transport.sendMail({
      from: `Enhancivity Team ${EMAIL_FROM}`,
      to: email,
      subject: "Enhancivity | Subscription added",
      html: subscriptionAddedTemplate({ subscriptionId, planName, planCost }),
    });

    return { message: "Subscription added" };
  } catch (error) {
    throw new Error("Cannot send email please contact with support team.");
  }
}

async function sendSubscriptionUpdated(
  email,
  subscriptionId,
  planName,
  planCost
) {
  try {
    await transport.sendMail({
      from: `Enhancivity Team ${EMAIL_FROM}`,
      to: email,
      subject: "Enhancivity |  Subscription updated",
      html: subscriptionUpdatedTemplate({ subscriptionId, planName, planCost }),
    });

    return { message: "Subscription updated" };
  } catch (error) {
    throw new Error("Cannot send email please contact with support team.");
  }
}

async function sendSubscriptionCancelled(email, subscriptionId) {
  try {
    await transport.sendMail({
      from: `Enhancivity Team ${EMAIL_FROM}`,
      to: email,
      subject: "Enhancivity |  Subscription Cancelled",
      html: subscriptionCancelledTemplate({
        subscriptionId,
      }),
    });

    return { message: "Subscription cancelled" };
  } catch (error) {
    throw new Error("Cannot send email please contact with support team.");
  }
}

module.exports = {
  sendEmailVerification,
  sendResetPassword,
  send2FaToken,
  sendSubscriptionAdded,
  sendSubscriptionUpdated,
  sendSubscriptionCancelled,
};
