import { useContext } from "react";
import AuthContext, { AuthProvider } from "@/context/AuthContext";

export { AuthProvider };

export function useAuth() {
  return useContext(AuthContext);
}
