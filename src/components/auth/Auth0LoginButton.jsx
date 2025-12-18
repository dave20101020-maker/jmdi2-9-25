import { useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import NSButton from "@/components/ui/NSButton";
import { AUTH_MODE } from "@/config/authMode";

function Auth0LoginButtonInner() {
  const { loginWithRedirect, isLoading } = useAuth0();

  const handleLogin = useCallback(async () => {
    try {
      await loginWithRedirect();
    } catch (error) {
      console.error("Auth0 login failed", error);
    }
  }, [loginWithRedirect]);

  return (
    <NSButton
      type="button"
      variant="outline"
      size="lg"
      fullWidth
      onClick={handleLogin}
      loading={isLoading}
    >
      Continue with Auth0
    </NSButton>
  );
}

export default function Auth0LoginButton() {
  if (AUTH_MODE === "PARKED") return null;

  const enabled = import.meta.env.VITE_ENABLE_AUTH0 === "true";
  const auth0Domain = import.meta.env.VITE_AUTH0_DOMAIN;
  const auth0ClientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

  if (!enabled) return null;
  if (!auth0Domain || !auth0ClientId) return null;

  return <Auth0LoginButtonInner />;
}
