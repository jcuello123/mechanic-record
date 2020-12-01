getServicesDoneToCars = async (username, pool) => {
  const getServices = {
    text:
      "SELECT color, year, make, model, type, serviced_by, notes, date, cost FROM Service JOIN " +
      "Car ON Service.car_id = Car.car_id JOIN Person ON Car.owner_phone_number = " +
      "Person.phone_number WHERE LOWER(username) = $1;",
    values: [username.toLowerCase()],
  };

  const data = await pool.query(getServices);
  let services = data.rows.length > 0 ? data.rows : null;

  return services;
};

isCustomer = async (username, pool) => {
  const checkIfIsCustomer = {
    text:
      "SELECT Customer.phone_number FROM Customer JOIN Person ON " +
      "Customer.phone_number = Person.phone_number WHERE LOWER(username) = $1;",
    values: [username.toLowerCase()],
  };

  const data = await pool.query(checkIfIsCustomer);
  const isCustomer = data.rows[0] ? true : false;
  return isCustomer;
};

getCarsWorkedOn = async (username, pool) => {
  const getCars = {
    text:
      "SELECT (Customer.first_name || ' ' || Customer.last_name) as customer,color, year, " +
      "make, model, type, notes, date, cost FROM Service " +
      "JOIN Car ON Service.car_id = Car.car_id " +
      "JOIN Person ON Service.serviced_by = Person.first_name || ' ' || Person.last_name " +
      "JOIN Customer ON Car.owner_phone_number = Customer.phone_number " +
      "WHERE LOWER(username) = $1;",
    values: [username.toLowerCase()],
  };

  const data = await pool.query(getCars);
  let services = data.rows.length > 0 ? data.rows : null;

  return services;
};

module.exports = {
  getServicesDoneToCars,
  isCustomer,
  getCarsWorkedOn,
};
