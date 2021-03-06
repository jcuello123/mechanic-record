getRefreshToken = async (username, pool) => {
  const getToken = {
    text: "SELECT refreshtoken from RefreshTokens WHERE LOWER(username) = $1;",
    values: [username.toLowerCase()],
  };

  const data = await pool.query(getToken);
  if (data.rows[0]) {
    return data.rows[0].refreshtoken;
  }
  return null;
};

storeRefreshToken = async (refreshToken, username, pool) => {
  const storeToken = {
    text: "INSERT INTO RefreshTokens (refreshtoken, username) VALUES($1, $2);",
    values: [refreshToken, username],
  };

  await pool.query(storeToken);
};

module.exports = {
  getRefreshToken,
  storeRefreshToken,
};
