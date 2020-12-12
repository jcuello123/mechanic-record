import "../App.css";
import axios from "axios";
import { React, useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import jwt from "jsonwebtoken";
const { REACT_APP_ACCESS_TOKEN_SECRET } = process.env;

function Dashboard() {
  useEffect(() => {
    getTokenAndServices();
  }, []);

  async function getTokenAndServices() {
    const accessTokenResponse = await axios.get("http://localhost:1337/token");
    const accessToken = accessTokenResponse.data.accessToken;
    let userFromToken;

    if (!accessToken) {
      history.push("/");
    }

    jwt.verify(accessToken, REACT_APP_ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) {
        history.push("/");
      }

      userFromToken = user.username;
    });

    setToken(accessToken);
    setUsername(userFromToken);

    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const body = {
      username: userFromToken,
    };

    const servicesResponse = await axios.post(
      "http://localhost:1337/dashboard",
      body,
      config
    );

    const servicesReceived = servicesResponse.data.services || [];
    setServices(servicesReceived);
  }

  let history = useHistory();

  const [token, setToken] = useState("No token.");
  const [services, setServices] = useState([]);
  const [username, setUsername] = useState("No username");

  return (
    <div className="App">
      <h1>Dashboard</h1>
      <h1>Services: </h1>
      {services.map((service, i) => (
        <div key={i}>
          <p>
            {service.color} {service.year} {service.make} {service.model}{" "}
            {service.notes}
          </p>
        </div>
      ))}
      <p>Username: {username}</p>
    </div>
  );
}

export default Dashboard;
