import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "@fontsource-variable/inter";
import "./index.css";
import ErrorBoundary from "./components/shared/ErrorBoundary";
import ApiErrorToast from "./components/ui/ApiErrorToast";
import "./i18n";
import { applyNorthstarTheme } from "./theme/northstarTheme";

applyNorthstarTheme();

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
      <ApiErrorToast />
    </ErrorBoundary>
  </React.StrictMode>
);
