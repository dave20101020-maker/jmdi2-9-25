import { createContext } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
});

export default AuthContext;
