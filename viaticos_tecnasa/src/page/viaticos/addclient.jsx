import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { addclient } from "../../service/auth.service";
import { useNavigate } from "react-router-dom";
import ShowClients from "./showclients";
import "../../../public/styles/addclient.css"; // Asegúrate de que esta ruta sea correcta

export default function AddClient() {
    const { token } = useAuth();
    
    const [nombre, setNombre] = useState("");
    const [codigo, setCodigo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [supervisor_id, setSupervisorId] = useState(""); // Nuevo estado para supervisor
    const [estatus, setEstatus] = useState("Activo");
    const [showempleado, setShowEmpleado] = useState([]); // Para cargar supervisores
    // Usamos este estado como "interruptor" para avisarle a ShowClients que se actualice
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    const navigate = useNavigate();
    const [mensajeError, setMensajeError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    const cargar_supervisores = async () => {
        try {
            const res = await show();
            // Filtrar solo usuarios que puedan ser supervisores si es necesario, o mostrar todos
            setShowEmpleado(res);
        } catch (error) {
            console.error("Error al cargar supervisores:", error);
        }
    };

    useEffect(() => {
        cargar_supervisores();
    }, []);

    const guardar_cliente = async (e) => {
        e.preventDefault();
        setMensajeError("");
        setMensajeExito("");

        // Validar que el nombre solo contenga letras y espacios
        const nombreRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
        if (!nombreRegex.test(nombre)) {
            setMensajeError("El nombre del cliente solo debe contener letras.");
            return;
        }

        // Validar que el código solo contenga números o letras sin caracteres raros
        const codigoRegex = /^[a-zA-Z0-9-]+$/;
        if (!codigoRegex.test(codigo)) {
            setMensajeError("El código solo permite letras, números y guiones.");
            return;
        }

        if (!supervisor_id) {
            setMensajeError("Debes asignar un supervisor al cliente.");
            return;
        }

        try {
            const res = await addclient(nombre, codigo, descripcion, estatus, supervisor_id);
            console.log("Respuesta del registro:", res);
            
            // Limpiamos los campos
            setNombre("");
            setCodigo("");
            setDescripcion("");
            setSupervisorId("");
            
            // Disparamos la actualización de la tabla
            setRefreshTrigger(prev => prev + 1);
            
            setMensajeExito("Cliente registrado exitosamente.");
        } catch(error) {
            console.log("Error al registrar cliente:", error);
            setMensajeError("Error al registrar cliente: " + error.message);
        }
    };

    return (
        <div className="client-wrapper">
            <div className="client-container">
                
                {/* TARJETA DEL FORMULARIO */}
                <div className="client-card fade-in-up">
                    <h2 className="section-title">Agregar Cliente</h2>
                    <form className="client-form" onSubmit={guardar_cliente}>
                        
                        <div className="form-row-3">
                            <div className="form-group">
                                <label className="form-label" htmlFor="nombre">Nombre</label>
                                <input className="form-input" type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Empresa SA" />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label" htmlFor="codigo">Código</label>
                                <input className="form-input" type="text" id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} required placeholder="Ej. 01" />
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label" htmlFor="descripcion">Descripción</label>
                                <input className="form-input" type="text" id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required placeholder="Cliente corporativo..." />
                            </div>

                            <div className="form-group">
                                <label className="form-label" htmlFor="supervisor">Supervisor Responsable</label>
                                <select 
                                    className="form-input select-input" 
                                    id="supervisor" 
                                    value={supervisor_id} 
                                    onChange={(e) => setSupervisorId(e.target.value)} 
                                    required
                                >
                                    <option value="" disabled>-- Seleccione un supervisor --</option>
                                    {showempleado.map((emp) => (
                                        <option key={emp.id_usuario} value={emp.id_usuario}>
                                            {emp.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="button-group">
                            <button className="btn-primaryl" type="submit">Guardar Cliente</button>
                            <button className="btn-secondary" type="button" onClick={() => navigate("/")}>Volver al Inicio</button>
                        </div>
                    </form>
                    {mensajeExito && <p className="success-message">{mensajeExito}</p>}
                    {mensajeError && <p className="error-message">{mensajeError}</p>}
                </div>

                {/* TARJETA DE LA TABLA - Le pasamos el refreshTrigger */}
                <div className="table-card fade-in-up delay-1">
                    <ShowClients refreshTrigger={refreshTrigger} />
                </div>

            </div>
        </div>
    );
}