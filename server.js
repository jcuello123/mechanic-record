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
  insertCar,
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
const yup = require("yup");
const cors = require("cors");

let token = null;
let main_username = null;

//db
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  PORT: process.env.PGPORT,
});

//middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

//routes
app.post("/register", async (req, res) => {
  try {
    const user_schema = yup.object().shape({
      phone_number: yup
        .string()
        .trim()
        .matches(/\d{3}-\d{3}-\d{4}$/)
        .required(),
      username: yup.string().min(3).trim().required(),
      password: yup.string().min(5).required(),
      first_name: yup.string().trim().required(),
      last_name: yup.string().trim().required(),
    });

    const car_schema = yup.object().shape({
      color: yup.string().required(),
      year: yup.number().required(),
      make: yup.string().required(),
      model: yup.string().required(),
    });

    const {
      phone_number,
      username,
      password,
      first_name,
      last_name,
      role,
      car,
    } = req.body;

    const usernameExists = await isUsernameRegistered(username, pool);
    if (usernameExists) {
      res.json({
        error: "Username already exists.",
      });
      return;
    }

    const phonenumberExists = await isPhonenumberInUse(phone_number, pool);
    if (phonenumberExists) {
      res.json({
        error: "Phone number is already in use.",
      });
      return;
    }

    await user_schema.validate({
      phone_number,
      username,
      password,
      first_name,
      last_name,
    });

    if (car) {
      await car_schema.validate(car);
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
      insertCar(pool, uuidv4, phone_number, car, first_name, last_name);
    }

    res.status(200).json({
      phone_number,
      username,
      first_name,
      last_name,
      role,
      car,
    });
  } catch (error) {
    if (error.path) {
      res.json({ error: error.path });
    } else {
      res.status(500).json({ error: "An error has occured" });
    }
    console.log(error);
  }
});

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await getUser(username, pool);

    if (!user) {
      res.json({ error: "Invalid username or password." });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      res.json({ error: "Invalid username or password." });
      return;
    }

    //correct credentials
    main_username = username;
    let payload = { username: username };
    token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
    });

    const refreshToken = await getRefreshToken(username, pool);
    if (!refreshToken) {
      let refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
      await storeRefreshToken(refreshToken, username, pool);
    }

    res.status(200).json({ status: "Successfully logged in." });
  } catch (error) {
    res.status(409).json({ error: "An error has occured" });
    console.log(error);
  }
});

app.post("/dashboard", async (req, res) => {
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

  jwt.verify(
    expiredAccessToken,
    process.env.ACCESS_TOKEN_SECRET,
    (err, user) => {
      if (err) {
        if (err.message.includes("expired")) {
          return;
        }
        return res.sendStatus(403);
      }
    }
  );

  const refreshToken = await getRefreshToken(username, pool);

  if (!refreshToken) {
    return res.sendStatus(403);
  }

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    let payload = { username: username };
    token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10m",
    });
    res.status(200).json({ refreshedToken: token });
  });
});

app.get("/token", (req, res) => {
  res.json({ accessToken: token });
});

app.get("/username", (req, res) => {
  res.json({ username: main_username });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
