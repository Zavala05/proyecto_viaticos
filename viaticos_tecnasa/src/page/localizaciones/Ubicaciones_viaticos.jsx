import { useState, useEffect } from "react";
import { getAtms } from "../../service/auth.service";
import { useNavigate } from "react-router-dom";
import PostUbicaciones from "./PostUbicaciones";
import "../../../public/styles/ubicaciones.css"

export default function GetUbis() {
    const navigate = useNavigate();
    const [ubicaciones, setUbicaciones] = useState([]);

    const mostrar_ubis = async () => {
        try {
            const res = await getAtms();
            setUbicaciones(res);
        } catch (error) {
            console.error("Error al mostrar ubicaciones:", error);
            alert("Error al mostrar ubicaciones: " + error.message);
        }
    };

    useEffect(() => {
        mostrar_ubis();
    }, []);

    return (
        <div className="locations-wrapper">
            <div className="locations-container">
                
                {/* Le pasamos la función mostrar_ubis para que refresque la tabla al guardar */}
                <PostUbicaciones onLocationAdded={mostrar_ubis} />

                {/* TARJETA DE LA TABLA */}
                <div className="table-card fade-in-up delay-1">
                    <div className="table-header-flex">
                        <h2 className="section-title">Ubicaciones Registradas</h2>
                        <button className="btn-secondary" onClick={() => navigate("/")}>
                            Volver al Inicio
                        </button>
                    </div>
                    
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Latitud</th>
                                    <th>Longitud</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ubicaciones.map((ubi) => (
                                    <tr key={ubi.id} className="table-row">
                                        <td className="fw-medium">{ubi.nombre}</td>
                                        <td><span className="coord-badge">{ubi.latitud}</span></td>
                                        <td><span className="coord-badge">{ubi.longitud}</span></td>
                                    </tr>
                                ))}
                                {ubicaciones.length === 0 && (
                                    <tr>
                                        <td colSpan="3" className="empty-state">No hay ubicaciones registradas aún.</td>
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