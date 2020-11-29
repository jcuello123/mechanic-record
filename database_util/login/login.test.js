require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  PORT: process.env.PGPORT,
});

const { getUser } = require("./login");

afterAll((done) => {
  pool.end();
  done();
});

test("should return specified user from the database", async () => {
  const first_customer = {
    phone_number: "111-111-1111",
    username: "customer_test",
    password: "customer_test",
    first_name: "customer_test",
    last_name: "customer_test",
  };

  const data = await getUser(first_customer.username, pool);
  user = data.rows[0];
  user.password = first_customer.password;
  expect(user).toEqual(first_customer);
});
