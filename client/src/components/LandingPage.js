import "../App.css";
import { Button } from "@material-ui/core";
import { Link, useHistory } from "react-router-dom";
import React from "react";
import axios from "axios";

function LandingPage() {
  let history = useHistory();

  async function login(e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const user = {
      username: username,
      password: password,
    };
    const data = await axios.post("http://localhost:1337/login", user);
    const response = data.data;
    if (!response.error) {
      console.log(response);
      return history.push("/dashboard");
    }

    //TODO: show error when logging in fails
  }
  return (
    <div className="App">
      <form>
        <input type="text" id="username" />
        <br />
        <input type="password" id="password" />
        <br />
        <Button onClick={login} variant="contained" color="primary">
          Login
        </Button>
        <p>
          Don't have an account? Register <Link to="/register">here.</Link>
        </p>
      </form>
    </div>
  );
}

export default LandingPage;
