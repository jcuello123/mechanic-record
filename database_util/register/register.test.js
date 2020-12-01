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

const person_customer = {
  phone_number: "222-222-2222",
  username: "test_username2",
  password: "test_password2",
  first_name: "Mickey",
  last_name: "Mouse",
};

const person_employee = {
  phone_number: "789-789-7890",
  username: "first_employee",
  password: "amazingpassword",
  first_name: "Mark",
  last_name: "Jil",
};

const role = "Customer";
const role2 = "Employee";
const usernameInDB = "first_customer";
const phonenumberInDB = "111-111-1111";

afterAll(async (done) => {
  await deleteTestUser();
  pool.end();
  done();
});

test("should determine if username exists", async () => {
  const usernameExists = await isUsernameRegistered(
    person_customer.username,
    pool
  );
  expect(usernameExists).toBe(false);

  const usernameExists2 = await isUsernameRegistered(usernameInDB, pool);
  expect(usernameExists2).toBe(true);
});

test("should determine if phone number exists", async () => {
  const phonenumberExists = await isPhonenumberInUse(
    person_customer.phone_number,
    pool
  );
  expect(phonenumberExists).toBe(false);

  const phonenumberExists2 = await isPhonenumberInUse(phonenumberInDB, pool);
  expect(phonenumberExists2).toBe(true);
});

test("should insert a new user into the database", async () => {
  await insertNewUser(
    bcrypt,
    pool,
    person_customer.phone_number,
    person_customer.username,
    person_customer.password,
    person_customer.first_name,
    person_customer.last_name
  );

  const query = {
    text: "SELECT * FROM Person WHERE LOWER(username) = $1;",
    values: [person_customer.username.toLowerCase()],
  };

  let insertedUser = await pool.query(query);
  insertedUser = insertedUser.rows[0];

  //password in db is hashed, so change it to original password for now
  insertedUser.password = person_customer.password;

  expect(insertedUser).toEqual(person_customer);
});

test("should insert user into corresponding role", async () => {
  //customer role
  await insertNewRole(
    uuidv4,
    role,
    pool,
    person_customer.phone_number,
    person_customer.first_name,
    person_customer.last_name
  );

  const customer = {
    customer_id: 1,
    phone_number: person_customer.phone_number,
    first_name: person_customer.first_name,
    last_name: person_customer.last_name,
  };

  const query = {
    text: "SELECT * FROM Customer WHERE phone_number = $1;",
    values: [person_customer.phone_number],
  };

  let insertedCustomer = await pool.query(query);
  insertedCustomer = insertedCustomer.rows[0];

  //dont have access to id with test person so make it equal for comparison
  insertedCustomer.customer_id = 1;

  //employee
  await insertNewRole(
    uuidv4,
    role2,
    pool,
    person_employee.phone_number,
    person_employee.first_name,
    person_employee.last_name
  );

  const employee = {
    employee_id: 1,
    phone_number: person_employee.phone_number,
    first_name: person_employee.first_name,
    last_name: person_employee.last_name,
  };

  const getEmployee = {
    text: "SELECT * FROM Employee WHERE phone_number = $1;",
    values: [employee.phone_number],
  };

  let insertedEmployee = await pool.query(getEmployee);
  insertedEmployee = insertedEmployee.rows[0];

  //dont have access to id with test person so make it equal for comparison
  insertedEmployee.employee_id = 1;

  expect(insertedCustomer).toEqual(customer);
  expect(insertedEmployee).toEqual(employee);
});

test("should insert cars", async () => {
  const cars = [
    { color: "Blue", year: 2017, make: "Ford", model: "Mustang" },
    { color: "White", year: 1997, make: "Toyota", model: "Supra" },
  ];

  await insertCars(
    pool,
    uuidv4,
    "111-111-1111",
    cars,
    "customer_test",
    "customer_test"
  );

  const getCars = {
    text:
      "SELECT color, year, make, model FROM Car WHERE owner_phone_number = $1;",
    values: ["111-111-1111"],
  };

  const data = await pool.query(getCars);
  const carsInDB = data.rows;

  setTimeout(() => {
    expect(carsInDB.length).toBe(2);
  }, 500);
});

deleteTestUser = async () => {
  const deleteCustomer = {
    text: "DELETE FROM Customer WHERE phone_number = $1;",
    values: [person_customer.phone_number],
  };

  await pool.query(deleteCustomer);

  const deleteEmployee = {
    text: "DELETE FROM Employee WHERE phone_number = $1;",
    values: [person_employee.phone_number],
  };

  await pool.query(deleteEmployee);

  const deletePerson = {
    text: "DELETE FROM Person WHERE username = $1;",
    values: [person_customer.username],
  };

  await pool.query(deletePerson);

  const deleteCars = {
    text: "DELETE FROM Car WHERE owner_phone_number = $1;",
    values: ["111-111-1111"],
  };

  await pool.query(deleteCars);
};
