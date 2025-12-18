import { Auth0Provider } from "@auth0/auth0-react";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/inter";
import "./index.css";
import { AUTH_MODE } from "@/config/authMode";

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

if (AUTH_MODE !== "PARKED" && (!auth0Domain || !auth0ClientId)) {
  console.warn(
    "[Auth0] Missing VITE_AUTH0_DOMAIN or VITE_AUTH0_CLIENT_ID; Auth0 redirects will not work."
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {AUTH_MODE === "PARKED" ? (
      <App />
    ) : (
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
        }}
      >
        <App />
      </Auth0Provider>
    )}
  </React.StrictMode>
);
