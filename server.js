const express = require("express");
const { PrismaClient } = require("@prisma/client");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const bodyParser = require("body-parser");

require("dotenv").config();
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

const pgSession = new PgSession({
  // Add your PostgreSQL connection options here
  conString: process.env.DATABASE_URL,
  // ttl: 86400, //time to live (in seconds)
  pruneSessionInterval: 86400,
});

app.use(
  session({
    store: pgSession,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 },
    // cookie: { secure: true },
  })
);

// Use JSON parser for parsing payloads as JSON on all non-webhook routes.
app.use((req, res, next) => {
  if (req.originalUrl === "/stripe/webhook") {
    next();
  } else {
    bodyParser.json()(req, res, next);
  }
});

app.use(
  cors({
    origin: process.env.DASHBOARD_URL,
    credentials: true,
  })
);

app.use(express.json());

const routes = require("./routes");

app.use(routes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
