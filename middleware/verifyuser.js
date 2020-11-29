const jwt = require("jsonwebtoken");

verify = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.sendStatus(401);
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err || req.body.username !== user.username) {
      return res.sendStatus(403);
    }
    next();
  });
};

module.exports = {
  verify,
};
