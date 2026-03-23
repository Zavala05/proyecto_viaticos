import { crearubicacion } from "../../service/auth.service";
import { useState } from "react";

// Recibimos la prop onLocationAdded
export default function PostUbicaciones({ onLocationAdded }) {
    const [nombre, setNombre] = useState("");
    const [latitud, setLatitud] = useState("");
    const [longitud, setLongitud] = useState("");
    const [mensajeError, setMensajeError] = useState("");
    const [mensajeExito, setMensajeExito] = useState("");

    const registrar_ubicacion = async (e) => {
        e.preventDefault();
        setMensajeError("");
        setMensajeExito("");

        // Validaciones de coordenadas
        const lat = parseFloat(latitud);
        const lng = parseFloat(longitud);

        if (isNaN(lat) || lat < -90 || lat > 90) {
            setMensajeError("La latitud debe ser un número entre -90 y 90.");
            return;
        }

        if (isNaN(lng) || lng < -180 || lng > 180) {
            setMensajeError("La longitud debe ser un número entre -180 y 180.");
            return;
        }

        try {
            await crearubicacion(nombre, latitud, longitud);
            setMensajeExito("Ubicación registrada exitosamente.");
            
            // Limpiamos los campos del formulario
            setNombre("");
            setLatitud("");
            setLongitud("");
            
            // Ejecutamos la función para refrescar la tabla en el componente padre
            if (onLocationAdded) onLocationAdded();

        } catch (error) {
            console.error("Error al registrar ubicacion:", error);
            setMensajeError("Error al registrar ubicación: " + error.message);
        }
    };

    const handleCoordinateChange = (setter) => (e) => {
        const value = e.target.value;
        if (value === "" || /^-?\d*\.?\d*$/.test(value)) {
            setter(value);
        }
    };

    return (
        <div className="locations-card fade-in-up">
            <h2 className="section-title">Agregar Nueva Ubicación</h2>
            <form className="locations-form" onSubmit={registrar_ubicacion}>
                
                {/* Usamos un grid responsive para los 3 inputs */}
                <div className="form-row-3">
                    <div className="form-group">
                        <label className="form-label" htmlFor="nombre">Nombre de Ubicación</label>
                        <input className="form-input" type="text" id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="Ej. Cajero Centro" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="latitud">Latitud</label>
                        <input className="form-input" type="text" inputMode="decimal" id="latitud" value={latitud} onChange={handleCoordinateChange(setLatitud)} required placeholder="14.0818" />
                    </div>
                    <div className="form-group">
                        <label className="form-label" htmlFor="longitud">Longitud</label>
                        <input className="form-input" type="text" inputMode="decimal" id="longitud" value={longitud} onChange={handleCoordinateChange(setLongitud)} required placeholder="-87.2068" />
                    </div>
                </div>
                
                <button className="btn-primary" type="submit">Registrar Ubicación</button>
            </form>
            {mensajeExito && <p className="success-message">{mensajeExito}</p>}
            {mensajeError && <p className="error-message">{mensajeError}</p>}
        </div>
    );
}