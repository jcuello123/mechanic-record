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
} = require("./database_util/register");

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
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
