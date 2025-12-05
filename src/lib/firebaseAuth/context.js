import { createContext } from "react";

const AuthContext = createContext({
  user: null,
  initializing: true,
  loading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  signInWithGoogle: async () => {},
  resetPassword: async () => {},
});

export default AuthContext;
