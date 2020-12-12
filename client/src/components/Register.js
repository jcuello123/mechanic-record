import "../App.css";
import { Link } from "react-router-dom";
import { Button, Input } from "@material-ui/core";
import axios from "axios";

function Register() {
  async function register(e) {
    e.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const phone_number = document.getElementById("phone_number").value;
    const first_name = document.getElementById("first_name").value;
    const last_name = document.getElementById("last_name").value;
    let role = document.getElementById("role");
    role =
      role.options[role.selectedIndex].text === "Yes" ? "Employee" : "Customer";

    let color;
    let year;
    let make;
    let model;

    let car;

    if (role === "Customer") {
      color = document.getElementById("color").value;
      year = document.getElementById("year").value;
      make = document.getElementById("make").value;
      model = document.getElementById("model").value;

      car = {
        color: color,
        year: year,
        make: make,
        model: model,
      };
    }

    const user = {
      username: username,
      password: password,
      phone_number: phone_number,
      first_name: first_name,
      last_name: last_name,
      car: car ? car : null,
      role: role,
    };

    const data = await axios.post("http://localhost:1337/register", user);
    const response = data.data;
    console.log(response);
  }

  function handleChange() {
    let role = document.getElementById("role");
    role =
      role.options[role.selectedIndex].text === "Yes" ? "Employee" : "Customer";

    const vehicle_div = document.querySelector(".vehicle");
    if (role === "Employee") {
      vehicle_div.style.display = "none";
    } else {
      vehicle_div.style.display = "block";
    }
  }

  return (
    <div className="App">
      <form>
        <div className="account">
          <h1>Account</h1>

          <label htmlFor="category">Are you an employee?</label>
          <br />
          <select onChange={handleChange} id="role">
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
          <br />

          <label htmlFor="username">Username</label>

          <Input type="text" id="username"></Input>
          <br />

          <label htmlFor="password">Password</label>

          <Input type="password" id="password"></Input>
          <br />

          <label htmlFor="phone_number">Phone number</label>

          <Input type="text" id="phone_number"></Input>
          <br />

          <label htmlFor="first_name">First name</label>

          <Input type="text" id="first_name"></Input>
          <br />

          <label htmlFor="last_name">Last name</label>

          <Input type="text" id="last_name"></Input>
          <br />
        </div>

        <div className="vehicle">
          <h1>Vehicle</h1>

          <label htmlFor="Color">Color</label>
          <Input type="text" id="color"></Input>
          <br />

          <label htmlFor="year">Year</label>
          <Input type="text" id="year"></Input>
          <br />

          <label htmlFor="make">Make</label>
          <Input type="text" id="make"></Input>
          <br />

          <label htmlFor="model">Model</label>
          <Input type="text" id="model"></Input>
          <br />
        </div>

        <Button
          onClick={register}
          variant="contained"
          color="primary"
          id="signup_button"
        >
          Sign up
        </Button>
        <p>
          Back to <Link to="/">login.</Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
