// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as AuthServices from "../service/auth.service";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Al montar, reconstruimos sesión desde /auth/me (cookie httpOnly)
    const init = async () => {
      try {
        const serverUser = await AuthServices.me();
        setUser(serverUser);
      } catch (e) {
        setUser(null);
      } finally {
        setCheckingSession(false);
      }
    };
    init();
  }, []);

  const refreshUser = async () => {
    try {
      const serverUser = await AuthServices.me();
      setUser(serverUser);
      return serverUser;
    } catch (e) {
      setUser(null);
      return null;
    }
  };

  const logout = async () => {
    try {
      await AuthServices.logout();
    } catch (e) {
      console.error("logout error", e);
    } finally {
      setUser(null);
      navigate("/auth/login");
    }
  };

  const hasPermiso = (permisoNombre) => {
    return user?.permisos?.includes(permisoNombre);
  };

  return (
    <AuthContext.Provider
      value={{
        userData: user,
        setUser,
        logout,
        checkingSession,
        hasPermiso,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);