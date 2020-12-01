require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  PORT: process.env.PGPORT,
});
const jwt = require("jsonwebtoken");
const { getRefreshToken, storeRefreshToken } = require("./token");

afterAll(async (done) => {
  await deleteToken();
  pool.end();
  done();
});

test("should get the refresh token", async () => {
  const token = await getRefreshToken("first_employee", pool);
  expect(token).not.toBe(null);
});

test("should store the refresh token", async () => {
  let payload = { username: "fourth_customer" };
  let refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET);
  await storeRefreshToken(refreshToken, "fourth_customer", pool);

  const token = await getRefreshToken("fourth_customer", pool);
  expect(token).not.toBe(null);
});

deleteToken = async () => {
  const deleteRefreshToken = {
    text: "DELETE FROM RefreshTokens WHERE username = $1;",
    values: ["fourth_customer"],
  };

  await pool.query(deleteRefreshToken);
};
