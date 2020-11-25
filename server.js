require("dotenv").config();
const { Pool } = require("pg");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 1337;
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

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

    //check if username is in use
    const checkIfUsernameExists = {
      text: "SELECT username FROM Person WHERE LOWER(username) = $1;",
      values: [username.toLowerCase()],
    };

    const usernameExistsResult = await pool.query(checkIfUsernameExists);
    if (usernameExistsResult.rows.length > 0) {
      return res.status(409).json({
        error: "Username already exists.",
      });
    }

    //check if phone number is in use
    const checkIfPhonenumberIsInUse = {
      text: "SELECT phone_number FROM Person WHERE phone_number = $1",
      values: [phone_number],
    };

    const phonenumberExistsResult = await pool.query(checkIfPhonenumberIsInUse);
    if (phonenumberExistsResult.rows.length > 0) {
      return res.status(409).json({
        error: "Phone number is already in use.",
      });
    }

    //insert new user into db
    const hashedPassword = await bcrypt.hash(password, 10);
    const insertNewUser = {
      text:
        "INSERT INTO Person (phone_number, username, password, first_name, last_name) " +
        "VALUES ($1, $2, $3, $4, $5);",
      values: [phone_number, username, hashedPassword, first_name, last_name],
    };

    const newUserResults = await pool.query(insertNewUser);

    //insert depending on role
    const VALUES = "VALUES ($1, $2, $3, $4);";
    const id = uuidv4();
    const insertNewRole = {
      text:
        role === "Customer"
          ? `INSERT INTO Customer (customer_id, phone_number, first_name, last_name) ${VALUES}`
          : role === "Employee"
          ? `INSERT INTO Employee (employee_id, phone_number, first_name, last_name) ${VALUES}`
          : "",
      values: [id, phone_number, first_name, last_name],
    };

    await pool.query(insertNewRole);

    //insert cars
    if (role === "Customer") {
      cars.forEach(async (car) => {
        const car_id = uuidv4();
        const insertCar = {
          text:
            "INSERT INTO Car (car_id, owner, owner_phone_number, color, year, make, model) " +
            "VALUES ($1, $2, $3, $4, $5, $6, $7);",
          values: [
            car_id,
            `${first_name} ${last_name}`,
            phone_number,
            car.color,
            car.year,
            car.make,
            car.model,
          ],
        };
        await pool.query(insertCar);
      });
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
