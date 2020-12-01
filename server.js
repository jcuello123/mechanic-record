require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 1337;
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const {
  isUsernameRegistered,
  isPhonenumberInUse,
  insertNewUser,
  insertNewRole,
  insertCars,
} = require("./database_util/register/register");
const { getUser } = require("./database_util/login/login");
const {
  getRefreshToken,
  storeRefreshToken,
} = require("./database_util/token/token");
const jwt = require("jsonwebtoken");
const { verify } = require("./middleware/verifyuser");
const {
  getServicesDoneToCars,
  isCustomer,
  getCarsWorkedOn,
} = require("./database_util/dashboard/dashboard");

//db
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  PORT: process.env.PGPORT,
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/register", async (req, res) => {
  try {
    const {
      phone_number,
      username,
      password,
      first_name,
      last_name,
      role,
      cars,
    } = req.body;

    const usernameExists = await isUsernameRegistered(username, pool);
    if (usernameExists) {
      return res.status(409).json({
        error: "Username already exists.",
      });
    }

    const phonenumberExists = await isPhonenumberInUse(phone_number, pool);
    if (phonenumberExists) {
      return res.status(409).json({
        error: "Phone number is already in use.",
      });
    }

    await insertNewUser(
      bcrypt,
      pool,
      phone_number,
      username,
      password,
      first_name,
      last_name
    );

    await insertNewRole(
      uuidv4,
      role,
      pool,
      phone_number,
      first_name,
      last_name
    );

    if (role === "Customer") {
      insertCars(pool, uuidv4, phone_number, cars, first_name, last_name);
    }

    res.status(200).json({
      phone_number,
      username,
      first_name,
      last_name,
      role,
      cars,
    });
  } catch (error) {
    res.status(500).json({ error: "An error has occured" });
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUser(username, pool);

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    //correct credentials

    let payload = { username: username };
    let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
    });

    const refreshTokenInDB = await getRefreshToken(username, pool);
    if (!refreshTokenInDB) {
      let refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
      await storeRefreshToken(refreshToken, username, pool);
    }

    res.status(200).json({ accessToken: accessToken });
  } catch (error) {
    res.status(500).json({ error: "An error has occured" });
    console.log(error);
  }
});

app.get("/dashboard", verify, async (req, res) => {
  const username = req.body.username;
  let services;
  const isACustomer = await isCustomer(username, pool);
  if (isACustomer) {
    services = await getServicesDoneToCars(username, pool);
  } else {
    //employee logged in
    services = await getCarsWorkedOn(username, pool);
  }
  res.json({ username: username, services: services });
});

app.post("/token", async (req, res) => {
  const username = req.body.username;
  const expiredAccessToken = req.body.token;

  if (!expiredAccessToken || !username) {
    return res.sendStatus(401);
  }

  //this is to ensure the same person is trying to refresh their own token
  let usernameFromExpiredToken;

  jwt.verify(
    expiredAccessToken,
    process.env.ACCESS_TOKEN_SECRET,
    (err, user) => {
      usernameFromExpiredToken = user.username;
      if (err) return res.sendStatus(403);
    }
  );

  const refreshTokenInDB = await getRefreshToken(username, pool);

  if (!refreshTokenInDB) {
    return res.sendStatus(403);
  }

  jwt.verify(
    refreshTokenInDB,
    process.env.REFRESH_TOKEN_SECRET,
    (err, user) => {
      if (err || usernameFromExpiredToken !== user.username) {
        return res.sendStatus(403);
      }
      let payload = { username: username };
      let accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "10m",
      });
      res.json({ accessToken: accessToken });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
