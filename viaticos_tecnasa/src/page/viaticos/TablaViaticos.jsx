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

    return (
        <div className="viaticos-container" style={{ maxWidth: "1200px", marginTop: "40px" }}>
            {/* Agregamos una línea separadora para que se vea limpio debajo de los resultados */}
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
                                        <td>{v.fecha_salida ? v.fecha_salida.split(" ")[0] : "N/A"}</td>
                                        <td>{v.fecha_regreso ? v.fecha_regreso.split(" ")[0] : "N/A"}</td>
                                        <td style={{ fontWeight: "bold" }}>L. {v.total_general}</td>
                                        <td>
                                            <button 
                                                className="btn btn-primary"
                                                style={{ padding: "6px 12px", fontSize: "13px" }}
                                                onClick={() => {
                                                    // 1. Cambiamos la URL para que el Hook superior agarre el ID
                                                    navigate(`/admin/dashboard/editar/${v.id}`);
                                                    // 2. Deslizamos la pantalla hacia arriba para que el usuario vea el formulario
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