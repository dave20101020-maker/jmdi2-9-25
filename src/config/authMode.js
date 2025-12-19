// VITE_AUTH_MODE:
// - "PARKED"  => bypass auth (dev only)
// - "ENABLED" => use Auth0 + backend session cookie
export const AUTH_MODE = (
  import.meta.env.VITE_AUTH_MODE || "PARKED"
).toUpperCase();
