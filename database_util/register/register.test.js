require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  PORT: process.env.PGPORT,
});

const {
  isUsernameRegistered,
  isPhonenumberInUse,
  insertNewUser,
  insertNewRole,
  insertCars,
} = require("./register");

const person = {
  phone_number: "222-222-2222",
  username: "test_username2",
  password: "test_password2",
  first_name: "Mickey",
  last_name: "Mouse",
};

const role = "Customer";
const cars = [
  { color: "Blue", year: 2017, make: "Ford", model: "Mustang" },
  { color: "White", year: 1997, make: "Toyota", model: "Supra" },
];

const usernameInDB = "first_customer";
const phonenumberInDB = "111-111-1111";

afterAll(async (done) => {
  await deleteTestUser();
  pool.end();
  done();
});

test("should determine if username exists", async () => {
  const usernameExists = await isUsernameRegistered(person.username, pool);
  expect(usernameExists).toBe(false);

  const usernameExists2 = await isUsernameRegistered(usernameInDB, pool);
  expect(usernameExists2).toBe(true);
});

test("should determine if phone number exists", async () => {
  const phonenumberExists = await isPhonenumberInUse(person.phone_number, pool);
  expect(phonenumberExists).toBe(false);

  const phonenumberExists2 = await isPhonenumberInUse(phonenumberInDB, pool);
  expect(phonenumberExists2).toBe(true);
});

test("should insert a new user into the database", async () => {
  await insertNewUser(
    bcrypt,
    pool,
    person.phone_number,
    person.username,
    person.password,
    person.first_name,
    person.last_name
  );

  const query = {
    text: "SELECT * FROM Person WHERE LOWER(username) = $1;",
    values: [person.username.toLowerCase()],
  };

  let insertedUser = await pool.query(query);
  insertedUser = insertedUser.rows[0];

  //password in db is hashed, so change it to original password for now
  insertedUser.password = person.password;

  expect(insertedUser).toEqual(person);
});

test("should insert user into corresponding role", async () => {
  //customer role
  await insertNewRole(
    uuidv4,
    role,
    pool,
    person.phone_number,
    person.first_name,
    person.last_name
  );

  const personWithRole = {
    customer_id: 1,
    phone_number: person.phone_number,
    first_name: person.first_name,
    last_name: person.last_name,
  };

  const query = {
    text: "SELECT * FROM Customer WHERE phone_number = $1;",
    values: [person.phone_number],
  };

  let insertedUserWithRole = await pool.query(query);
  insertedUserWithRole = insertedUserWithRole.rows[0];

  //dont have access to id with test person so make it equal for comparison
  insertedUserWithRole.customer_id = 1;

  expect(insertedUserWithRole).toEqual(personWithRole);
});

deleteTestUser = async () => {
  const deleteCustomer = {
    text: "DELETE FROM Customer WHERE phone_number = $1;",
    values: [person.phone_number],
  };

  await pool.query(deleteCustomer);

  const deletePerson = {
    text: "DELETE FROM Person WHERE username = $1;",
    values: [person.username],
  };

  await pool.query(deletePerson);
};
