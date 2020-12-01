require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  PORT: process.env.PGPORT,
});
const {
  getServicesDoneToCars,
  isCustomer,
  getCarsWorkedOn,
} = require("./dashboard");

afterAll((done) => {
  pool.end();
  done();
});

test("should get all services done to cars for specific customer", async () => {
  const servicesToCars = await getServicesDoneToCars("first_customer", pool);
  const servicesToCars2 = await getServicesDoneToCars("customer_test", pool);
  expect(servicesToCars).not.toBe(null);
  expect(servicesToCars2).toBe(null);
});

test("should properly indicate if person is a customer", async () => {
  const isACustomer = await isCustomer("first_customer", pool);
  const isACustomer2 = await isCustomer("first_employee", pool);
  expect(isACustomer).toBe(true);
  expect(isACustomer2).toBe(false);
});

test("should get all cars a specific employee worked on", async () => {
  const carsWorkedOn = await getCarsWorkedOn("first_employee", pool);
  const carsWorkedOn2 = await getCarsWorkedOn("third_employee", pool);
  expect(carsWorkedOn).not.toBe(null);
  expect(carsWorkedOn2).toBe(null);
});
