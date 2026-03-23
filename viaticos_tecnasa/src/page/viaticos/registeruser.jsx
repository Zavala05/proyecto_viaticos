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
    const [supervisor, setSupervisor] = useState("");
    const [showempleado, setShowEmpleado] = useState([]);
    const navigate = useNavigate();
    const [mensajeExito, setMensajeExito] = useState("");
    const [mensajeError, setMensajeError] = useState("");

    const guardar_usuario = async (e) => {
        e.preventDefault();
        setMensajeError("");
        setMensajeExito("");

        // Validar que el nombre solo contenga letras y espacios
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!nombreRegex.test(nombre)) {
            setMensajeError("El nombre solo debe contener letras.");
            return;
        }

        // Validar formato de correo electrónico
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMensajeError("Por favor, ingresa un formato de correo válido.");
            return;
        }

        try {
            const res = await register(nombre, email, usernmame, password, rol, puesto, supervisor);
            console.log("Respuesta del registro:", res);
            mostrar_usuario();
            setNombre(""); setEmail(""); setUsername(""); setPassword("");
            setSupervisor(""); // Limpiar supervisor tras éxito
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
                                <input className="form-input" type="text" value={usernmame} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))} required placeholder="jperez"/>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" minLength={6}/>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Puesto</label>
                            <select className="form-input select-input" value={puesto} onChange={(e) => setPuesto(e.target.value)} required>
                                <option value="Tecnico ATM">Técnico de ATM</option>
                                <option value="Microsistemas">Microsistemas</option>
                                <option value="Finanzas">Finanzas</option>
                            </select>
                        </div>
                        <div className="supervisor_select">
                            <label className="form-label">Supervisor</label>
                            <select className="form-input select-input" value={supervisor} onChange={(e) => setSupervisor(e.target.value)}>
                                <option value="">Seleccione un supervisor (Opcional)</option>
                                {showempleado.map((empleado) => (
                                    <option key={empleado.id_usuario} value={empleado.id_usuario}>{empleado.nombre}</option>
                                ))}
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
                                    <th>Supervisor</th>
                                </tr>
                            </thead>
                            <tbody>
                                {showempleado.map((usuario, index) => (
                                    <tr key={index} className="table-row">
                                        <td>{usuario.nombre}</td>
                                        <td>{usuario.email}</td>
                                        <td>{usuario.username}</td>
                                        <td><span className="badge">{usuario.puesto || "N/A"}</span></td>
                                        <td style={{ fontStyle: usuario.supervisor_nombre ? "normal" : "italic", color: usuario.supervisor_nombre ? "inherit" : "#94a3b8" }}>
                                            {usuario.supervisor_nombre || "Sin supervisor"}
                                        </td>
                                    </tr>
                                ))}
                                {showempleado.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="empty-state">No hay usuarios registrados aún.</td>
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