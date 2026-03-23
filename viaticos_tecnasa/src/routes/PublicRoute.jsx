// src/routes/PublicRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { userData, checkingSession } = useAuth();


  if (checkingSession) {
    return null;
  }

  // Si ya está logueado: no tiene nada que hacer en /auth/*
  if (userData) {
    const isAdmin = (userData.rol || "").toLowerCase() === "admin";

    //ver si es supervisor
// src/routes/PublicRoute.jsx
    const isSupervisor = (userData.rol || "").toLowerCase() === "supervisor";
    
    //ver si es de departamento de finanzas (ahora por puesto)
    const isFinanzas = (userData.puesto || "").toLowerCase() === "finanzas";

    // If supervisor -> /supervisor/
    if (isSupervisor) {
      return <Navigate to="/admin/supervisor" replace />;
    }

    if (isFinanzas){
      return <Navigate to="/admin/finanzas" replace />;
    }
    
    // Si es admin -> /admin/viaticos
    // Si NO es admin -> /admin/liquidaciones
    return <Navigate to={isAdmin ? "/admin/viaticos" : "/admin/liquidaciones"} replace />;
    //si es supervisor -> /supervisor/ 
   

  }

  // Si NO está logueado -> puede ver la ruta pública (login, reset, etc.)
  return children;
}