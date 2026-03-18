// src/routes/PublicRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { userData, checkingSession } = useAuth();

  if (checkingSession) {
    return null;
  }

  // Si ya está logueado: no tiene nada que hacer en /auth/*
  // Lo mandamos siempre al home del admin
  if (userData) {
    return <Navigate to="/admin/viaticos" replace />;
  }

  // Si NO está logueado -> puede ver la ruta pública (login, reset, etc.)
  return children;
}