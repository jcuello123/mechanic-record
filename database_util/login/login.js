getUser = async (username, pool) => {
  const getUserInfo = {
    text: "SELECT * From Person WHERE LOWER(username) = $1;",
    values: [username.toLowerCase()],
  };
  const data = await pool.query(getUserInfo);
  return data.rows[0];
};

module.exports = {
  getUser,
};
