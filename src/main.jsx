import React from "react";
import { createRoot } from "react-dom/client";
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

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppSettingsProvider>
      <AuthProvider>
        <GlobalErrorBoundary>
          <App />
          <ApiErrorToast />
        </GlobalErrorBoundary>
      </AuthProvider>
    </AppSettingsProvider>
  </React.StrictMode>
);
