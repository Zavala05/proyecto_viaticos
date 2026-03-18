import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext.jsx";
import AuthRoutes from "./auth.routes.jsx";
import DashboardRoutes from "./dashboard.routes.jsx";
import PrivateRoute from "./PrivateRoute.jsx";
import PublicRoute from "./PublicRoute.jsx";
import FormularioPractica from "../page/practice/practiceform.jsx";
import RegisterUser from "../page/viaticos/registeruser.jsx";

export default function AppRoute() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/auth/login" />} />
          <Route
            path="/auth/*"
            element={
              <PublicRoute>
                <AuthRoutes />
              </PublicRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <PrivateRoute>
                <DashboardRoutes />
              </PrivateRoute>
            }
          />
          <Route path="/practica" element={<FormularioPractica />} />
          
          
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
