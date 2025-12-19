export const AUTH_MODE = process.env.AUTH_MODE || "PARKED";

export const isAuthParked = () => AUTH_MODE === "PARKED";

export const isAuthEnabled = () => AUTH_MODE === "ENABLED";
