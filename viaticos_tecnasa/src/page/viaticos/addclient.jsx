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
    const [estatus, setEstatus] = useState("Activo");
    // Usamos este estado como "interruptor" para avisarle a ShowClients que se actualice
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    const navigate = useNavigate();
    const [mensajeError, setMensajeError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

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

        try {
            const res = await addclient(nombre, codigo, descripcion, estatus);
            console.log("Respuesta del registro:", res);
            
            // Limpiamos los campos
            setNombre("");
            setCodigo("");
            setDescripcion("");
            
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