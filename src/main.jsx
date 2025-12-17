import React from "react";
import { createRoot } from "react-dom/client";
import { Auth0Provider } from "@auth0/auth0-react";
import App from "./App";
import "@fontsource-variable/inter";
import "./index.css";
import { AppSettingsProvider } from "@/context/AppSettingsContext.jsx";
import GlobalErrorBoundary from "./components/shared/ErrorBoundary";
import ApiErrorToast from "./components/ui/ApiErrorToast";
import "./i18n";
import { applyNorthstarTheme } from "./theme/northstarTheme";
import { AuthProvider } from "@/hooks/useAuth";

applyNorthstarTheme();

const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const auth0Audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const enableAuth0 = Boolean(auth0Domain && auth0ClientId);

const appTree = (
  <AppSettingsProvider>
    <AuthProvider>
      <GlobalErrorBoundary>
        <App />
        <ApiErrorToast />
      </GlobalErrorBoundary>
    </AuthProvider>
  </AppSettingsProvider>
);

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {enableAuth0 ? (
      <Auth0Provider
        domain={auth0Domain}
        clientId={auth0ClientId}
        authorizationParams={{
          redirect_uri: window.location.origin,
          audience: auth0Audience,
        }}
      >
        {appTree}
      </Auth0Provider>
    ) : (
      appTree
    )}
  </React.StrictMode>
);
