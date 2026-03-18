import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../service/auth.service.js";
import { useAuth } from "../../context/AuthContext.jsx"; 
import "../../../public/styles/login.css";

export default function Login() {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [mensajeError, setMensajeError] = useState("");

  const { setUser } = useAuth(); 
  const navigate = useNavigate();

  const handlelogin = async (e) => {
    e.preventDefault(); // Al usar un <form>, esto es obligatorio para evitar que recargue la página

    try {
      const data = await login(credentials.username, credentials.password);
      
      if (data) {
        setUser(data);
        setTimeout(() => {
          navigate("/");
        }, 50);
      }
    } catch (error) {
      console.error("Login failed:", error);
      setMensajeError("Credenciales incorrectas. Por favor, inténtalo de nuevo.");

    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="login-title">Bienvenido</h2>
        
        {/* Cambiamos el div por un form para habilitar el "Enter" al escribir */}
        <form className="login-form" onSubmit={handlelogin}>
          <div className="input-group">
            <input
              type="text"
              className="login-input"
              placeholder="Nombre de usuario"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
            />
          </div>
          
          <div className="input-group">
            <input
              type="password"
              className="login-input"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" className="login-btn">
            Iniciar Sesión
          </button>
          {mensajeError && <p className="error-message">{mensajeError}</p>}
          
        </form>
      </div>
    </div>
  );
}