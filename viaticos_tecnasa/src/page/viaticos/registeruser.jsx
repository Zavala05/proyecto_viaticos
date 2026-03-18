import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { register, show } from "../../service/auth.service.js";
import { useNavigate } from "react-router-dom";
import "../../../public/styles/employees.css"

export default function RegisterUser() {
    const { token } = useAuth();
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [usernmame, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [rol, setRol] = useState("Empleado"); 
    const [puesto, setPuesto] = useState("Tecnico ATM");
    const [showempleado, setShowEmpleado] = useState([]);
    const navigate = useNavigate();
    const [mensajeExito, setMensajeExito] = useState("");
    const [mensajeError, setMensajeError] = useState("");

    const guardar_usuario = async (e) => {
        try {
            e.preventDefault();
            const res = await register(nombre, email, usernmame, password, rol, puesto);
            console.log("Respuesta del registro:", res);
            mostrar_usuario();
            setNombre(""); setEmail(""); setUsername(""); setPassword("");
            setMensajeExito("Usuario registrado exitosamente.");
             setTimeout(() => {
                setMensajeExito("");
            }, 3000);
        } catch(error) {
            console.log("Error al registrar usuario:", error);
            setMensajeError("Error al registrar usuario: " + error.message);
        }
    };

    const mostrar_usuario = async () => {
        try {
            const res = await show();
            console.log("Respuesta al mostrar usuarios:", res);
            setShowEmpleado(res);
        } catch(error) {
            console.log("Error al mostrar usuarios:", error);
            alert("Error al mostrar usuarios: " + error.message);
        }
    };

    useEffect(() => {
        mostrar_usuario();
    }, []);

    return (
        <div className="register-wrapper">
            <div className="register-container">
                
                {/* TARJETA DEL FORMULARIO */}
                
                <div className="register-card fade-in-up">
                    <h2 className="section-title">Registrar Usuario</h2>
                    <form className="register-form" onSubmit={guardar_usuario}>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Nombre</label>
                                <input className="form-input" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Juan Pérez"/>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input className="form-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@empresa.com"/>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Username</label>
                                <input className="form-input" type="text" value={usernmame} onChange={(e) => setUsername(e.target.value)} required placeholder="jperez"/>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"/>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Puesto</label>
                            <select className="form-input select-input" value={puesto} onChange={(e) => setPuesto(e.target.value)} required>
                                <option value="Tecnico ATM">Técnico de ATM</option>
                                <option value="Microsistemas">Microsistemas</option>
                            </select>
                        </div>
                        
                        <button className="btn-primary" type="submit">Registrar Usuario</button>
                    </form>
                    {mensajeExito && <p className="success-message">{mensajeExito}</p>}
                    {mensajeError && <p className="error-message">{mensajeError}</p>}
                </div>

                {/* TARJETA DE LA TABLA */}
                <div className="table-card fade-in-up delay-1">
                    <div className="table-header-flex">
                        <h2 className="section-title">Usuarios Registrados</h2>
                        <button className="btn-secondary" onClick={() => navigate("/admin/viaticos")}>Volver al inicio</button>
                    </div>
                    
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Username</th>
                                    <th>Puesto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {showempleado.map((usuario, index) => (
                                    <tr key={index} className="table-row">
                                        <td>{usuario.nombre}</td>
                                        <td>{usuario.email}</td>
                                        <td>{usuario.username}</td>
                                        <td><span className="badge">{usuario.puesto}</span></td>
                                    </tr>
                                ))}
                                {showempleado.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="empty-state">No hay usuarios registrados aún.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}