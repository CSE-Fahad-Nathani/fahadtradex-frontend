import { useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useToast } from "./Toast/ToastContext";

function RedirectWithToast() {
  const { showToast } = useToast();

  useEffect(() => {
    showToast("error", "Please login to continue.");
  }, []);

  return <Navigate to="/login" replace />;
}

function PrivateRoute() {
  const isAuthenticated = !!localStorage.getItem("email");
  return isAuthenticated ? <Outlet /> : <RedirectWithToast />;
}

export default PrivateRoute;
