const { promisify } = require("util");
const { randomBytes } = require("crypto");
const { createTransport } = require("nodemailer");

const {
  EMAIL_SERVER_HOST,
  EMAIL_SERVER_PORT,
  EMAIL_SERVER_USER,
  EMAIL_SERVER_PASS,
} = process.env;

async function createHash() {
  const randomBytesPromise = promisify(randomBytes);
  const hash = (await randomBytesPromise(20)).toString("hex");
  return hash;
}

const transport = createTransport({
  host: EMAIL_SERVER_HOST,
  port: EMAIL_SERVER_PORT,
  auth: {
    user: EMAIL_SERVER_USER,
    pass: EMAIL_SERVER_PASS,
  },
  secure: true,
});

module.exports = {
  createHash,
  transport,
};
