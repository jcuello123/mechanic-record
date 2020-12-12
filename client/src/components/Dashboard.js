import "../App.css";
import axios from "axios";
import { React, useState } from "react";
import { useHistory } from "react-router-dom";
import jwt from "jsonwebtoken";
const { REACT_APP_ACCESS_TOKEN_SECRET } = process.env;

function Dashboard() {
  let history = useHistory();

  const [token, setToken] = useState("Empty");

  async function getToken() {
    const response = await axios.get("http://localhost:1337/token");
    const accessToken = response.data.accessToken;

    if (!accessToken) {
      history.push("/");
    }

    jwt.verify(accessToken, REACT_APP_ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        history.push("/");
      }
    });

    setToken(accessToken);
  }
  getToken();

  return (
    <div className="App">
      <h1>Dashboard</h1>
      <p>{token}</p>
    </div>
  );
}

export default Dashboard;
