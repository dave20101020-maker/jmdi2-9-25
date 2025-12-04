import { createContext } from "react";

const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  signInWithEmail: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
  refreshUser: () => null,
});

export default AuthContext;
