import { isAuthParked } from "../src/utils/authMode.js";

export function authGuard(req, res, next) {
  if (isAuthParked()) {
    return next();
  }

  if (!req.user) {
    return res.status(401).json({ error: "Unauthenticated" });
  }

  return next();
}
