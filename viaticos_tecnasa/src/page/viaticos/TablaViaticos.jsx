import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { ObtenerViaticos } from "../../service/auth.service.js"; 
import "./ViaticosMapa.css"; 

export default function TablaViaticos() {
    const [viaticos, setViaticos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate(); 

    useEffect(() => {
        const cargarViaticos = async () => {
            setCargando(true);
            try {
                const res = await ObtenerViaticos();
                setViaticos(Array.isArray(res) ? res : []);
            } catch (error) {
                console.error("Error al mostrar viáticos:", error);
            } finally {
                setCargando(false);
            }
        };
        cargarViaticos();
    }, []);

    // Función para dar formato normal a la fecha y hora
    const formatearFecha = (fecha) => {
        if (!fecha) return "N/A";
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true // Cambia a false si prefieres formato 24 horas
        });
    };

    return (
        <div className="viaticos-container" style={{ maxWidth: "1200px", marginTop: "40px" }}>
            <hr style={{ marginBottom: "20px", borderColor: "#e2e8f0" }} />
            
            <div className="viaticos-header">
                <h2>Registros de Viáticos</h2>
                <p>Selecciona un viático de la lista para editarlo en el formulario superior</p>
            </div>

            {cargando ? (
                <p>⏳ Cargando registros...</p>
            ) : (
                <div style={{ overflowX: "auto" }}>
                    <table className="tabla-moderna">
                        <thead>
                            <tr>
                                <th>Empleado</th>
                                <th>Cliente</th>
                                <th>Ruta</th>
                                <th>Salida</th>
                                <th>Regreso</th>
                                <th>Total (Lps)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viaticos.length > 0 ? (
                                viaticos.map((v) => (
                                    <tr key={v.id}>
                                        <td>{v.nombre_empleado}</td>
                                        <td>{v.cliente}</td>
                                        <td>{v.origen} ➝ {v.destino}</td>
                                        
                                        {/* APLICAMOS LA FUNCIÓN AQUÍ PARA LA FECHA Y HORA */}
                                        <td>{formatearFecha(v.fecha_salida)}</td>
                                        <td>{formatearFecha(v.fecha_regreso)}</td>
                                        
                                        <td style={{ fontWeight: "bold" }}>L. {v.total_general}</td>
                                        <td>
                                            <button 
                                                className="btn btn-primary"
                                                style={{ padding: "6px 12px", fontSize: "13px" }}
                                                onClick={() => {
                                                    navigate(`/admin/dashboard/editar/${v.id}`);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                            >
                                                 Editar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>
                                        No hay viáticos registrados
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}