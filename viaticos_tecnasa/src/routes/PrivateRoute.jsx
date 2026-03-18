// src/routes/PrivateRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PrivateRoute({ children }) {
  const { userData, checkingSession } = useAuth();
  const location = useLocation();

  // Mientras valida sesión, puedes mostrar null o un loader global
  if (checkingSession) {
    return null;
  }

  // Si no hay usuario -> mandar a login con redirect
  if (!userData) {
    const redirectTo = `${location.pathname}${location.search || ""}`;
    return (
      <Navigate
        to={`/auth/login?redirect=${encodeURIComponent(redirectTo)}`}
        replace
      />
    );
  }

  // Si hay usuario -> render normal
  return children;
}