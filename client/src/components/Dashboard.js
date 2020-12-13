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
    const usernameResponse = await axios.get("http://localhost:1337/username");
    let accessToken = accessTokenResponse.data.accessToken;
    let main_username = usernameResponse.data.username;
    let expired = false;

    setUsername(main_username);

    if (!accessToken) {
      history.push("/");
    }

    jwt.verify(
      accessToken,
      REACT_APP_ACCESS_TOKEN_SECRET,
      async (err, user) => {
        if (err) {
          if (err.message.includes("expired")) {
            expired = true;
          }
        }

        if (expired) {
          const body = {
            username: main_username,
            token: accessToken,
          };

          const response = await axios.post(
            "http://localhost:1337/token",
            body
          );
          accessToken = response.data.refreshedToken;
        } else if (err) {
          history.push("/");
        }
      }
    );

    setToken(accessToken);

    const config = {
      headers: { Authorization: `Bearer ${accessToken}` },
    };

    const body = {
      username: main_username,
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

  const [token, setToken] = useState();
  const [services, setServices] = useState([]);
  const [username, setUsername] = useState();

  return (
    <div className="App">
      <h1>Dashboard</h1>
      <p>Username: {username}</p>
      <h1>Services: </h1>
      {services.map((service, i) => (
        <div key={i}>
          <p>
            {service.color} {service.year} {service.make} {service.model}{" "}
            {service.notes}
          </p>
        </div>
      ))}
    </div>
  );
}

export default Dashboard;
