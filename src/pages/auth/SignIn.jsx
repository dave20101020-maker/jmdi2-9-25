import Login from "@/pages/Login";

export default function SignIn() {
  // Shared AuthGuard routes currently render <SignIn /> when unauthenticated.
  // Ensure this never results in a blank screen.
  return <Login />;
}
