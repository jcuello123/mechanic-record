isUsernameRegistered = async (username, pool) => {
  const checkIfUsernameExists = {
    text: "SELECT username FROM Person WHERE LOWER(username) = $1;",
    values: [username.toLowerCase()],
  };

  const usernameCheckResult = await pool.query(checkIfUsernameExists);
  if (usernameCheckResult.rows.length > 0) {
    return true;
  }
  return false;
};

isPhonenumberInUse = async (phone_number, pool) => {
  const checkIfPhonenumberIsInUse = {
    text: "SELECT phone_number FROM Person WHERE phone_number = $1",
    values: [phone_number],
  };

  const phonenumberCheckResult = await pool.query(checkIfPhonenumberIsInUse);
  if (phonenumberCheckResult.rows.length > 0) {
    return true;
  }
  return false;
};

insertNewUser = async (
  bcrypt,
  pool,
  phone_number,
  username,
  password,
  first_name,
  last_name
) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  const insertNewUser = {
    text:
      "INSERT INTO Person (phone_number, username, password, first_name, last_name) " +
      "VALUES ($1, $2, $3, $4, $5);",
    values: [phone_number, username, hashedPassword, first_name, last_name],
  };

  await pool.query(insertNewUser);
};

insertNewRole = async (
  uuidv4,
  role,
  pool,
  phone_number,
  first_name,
  last_name
) => {
  
  const VALUES = "VALUES ($1, $2, $3, $4);";
  const id = uuidv4();
  const addRole = {
    text:
      role === "Customer"
        ? `INSERT INTO Customer (customer_id, phone_number, first_name, last_name) ${VALUES}`
        : role === "Employee"
        ? `INSERT INTO Employee (employee_id, phone_number, first_name, last_name) ${VALUES}`
        : "",
    values: [id, phone_number, first_name, last_name],
  };

  await pool.query(addRole);
};

insertCars = (pool, uuidv4, phone_number, cars, first_name, last_name) => {
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
};

module.exports = {
  isUsernameRegistered,
  isPhonenumberInUse,
  insertNewUser,
  insertNewRole,
  insertCars,
};
