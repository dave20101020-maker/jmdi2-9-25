import { useContext } from "react";
import AuthContext from "@/lib/firebaseAuth/context";
export { AuthProvider } from "@/lib/firebaseAuth/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
