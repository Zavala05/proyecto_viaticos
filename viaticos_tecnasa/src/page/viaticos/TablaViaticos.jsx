import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../../context/AuthContext.jsx";
import { ObtenerViaticos } from "../../service/auth.service.js"; 
import { exportToExcel } from "../../utils/exportToExcel.js";
import "../../../public/styles/ViaticosMapa.css"; 

export default function TablaViaticos({ filtroEstado = "Todos", filtroFechaInicio = "", filtroFechaFin = "", busqueda = "" }) {
    const [viaticos, setViaticos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [revertiendoId, setRevertiendoId] = useState(null);
    const navigate = useNavigate(); 
    const { userData } = useAuth();
    const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
    const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

    const cargarViaticos = async () => {
        setCargando(true);
        try {
            const res = await ObtenerViaticos();
            let data = Array.isArray(res) ? res : [];
            
            console.log("Datos recibidos de viáticos:", data); // Para depuración

            // 1. Filtrar por Estado
            if (filtroEstado !== "Todos") {
                data = data.filter(v => {
                    const estadoBD = (v.estado_viatico || "").trim().toLowerCase();
                    if (filtroEstado === "Activo") {
                        return estadoBD !== "cerrado";
                    } 
                    if (filtroEstado === "Cerrado") {
                        return estadoBD === "cerrado";
                    }
                    return true;
                });
            }

            // 2. Filtrar por Rango de Fechas
            if (filtroFechaInicio || filtroFechaFin) {
                data = data.filter(v => {
                    if (!v.fecha_salida) return false;
                    
                    // Solo tomamos la parte YYYY-MM-DD para comparar con el input date
                    const fechaSalida = v.fecha_salida.substring(0, 10);
                    
                    let cumpleInicio = true;
                    let cumpleFin = true;

                    if (filtroFechaInicio) {
                        cumpleInicio = fechaSalida >= filtroFechaInicio;
                    }
                    if (filtroFechaFin) {
                        cumpleFin = fechaSalida <= filtroFechaFin;
                    }

                    return cumpleInicio && cumpleFin;
                });
            }

            // 3. Filtrar por Búsqueda (Empleado o Cliente)
            if (busqueda.trim()) {
                const query = busqueda.toLowerCase().trim();
                data = data.filter(v => 
                    (v.nombre_empleado || "").toLowerCase().includes(query) ||
                    (v.cliente || "").toLowerCase().includes(query)
                );
            }
            
            setViaticos(data);
        } catch (error) {
            console.error("Error al mostrar viáticos:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarViaticos();
    }, [filtroEstado, filtroFechaInicio, filtroFechaFin, busqueda]);

    const handleRevertir = async (v) => {
        if (!window.confirm(`¿Estás seguro de que deseas revertir la liquidación de ${v.nombre_empleado}? El estado pasará de 'Cerrado' a 'En progreso'.`)) {
            return;
        }

        setRevertiendoId(v.id);
        try {
            const res = await fetch(`${API_URL}/liquidaciones/${v.liquidacion_id}/estado`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    estado: "En progreso",
                    observaciones: "Liquidación revertida por administrador"
                }),
            });

            if (res.ok) {
                alert("Liquidación revertida correctamente.");
                cargarViaticos();
            } else {
                const error = await res.json();
                alert(error.message || "Error al revertir la liquidación.");
            }
        } catch (error) {
            console.error("Error al revertir:", error);
            alert("Error de red al intentar revertir.");
        } finally {
            setRevertiendoId(null);
        }
    };

    // Función para dar formato normal a la fecha y hora sin desfases de zona horaria
    const formatearFecha = (fecha) => {
        if (!fecha) return "N/A";
        
        try {
            // Esperamos "YYYY-MM-DD HH:mm:ss" o "YYYY-MM-DDTHH:mm:ss"
            const regex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;
            const match = fecha.match(regex);
            
            if (match) {
                const [_, anio, mes, dia, hora24, min] = match;
                let hora = parseInt(hora24);
                const ampm = hora >= 12 ? 'p. m.' : 'a. m.';
                hora = hora % 12;
                hora = hora ? hora : 12; // el número 0 debe ser 12
                return `${dia}/${mes}/${anio} ${hora}:${min} ${ampm}`;
            }
            
            // Si no coincide con el regex, intentamos el método estándar pero es menos confiable para la hora
            const fechaObj = new Date(fecha);
            if (isNaN(fechaObj.getTime())) return "N/A";
            return fechaObj.toLocaleString('es-HN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (e) {
            console.error("Error formateando fecha:", e);
            return "N/A";
        }
    };

    const handleExportRow = (v) => {
        // Mapeamos los campos del registro de la base de datos al formato que espera exportToExcel
        const dataParaExportar = {
            ...v,
            motivoViaje: v.motivo_viaje,
            costo_hospedaje_diario: Number(v.costo_hospedaje || 0),
            costo_hospedaje: Number(v.costo_hospedaje || 0) * (v.noches_count || 0),
            costo_combustible: Number(v.costo_combustible || 0),
            costo_imprevistos: Number(v.costo_imprevistos || 0),
            costo_peajes: Number(v.costo_peajes || 0),
            total_alimentos: Number(v.total_alimentos || 0),
            total_general: Number(v.total_general || 0)
        };

        exportToExcel(dataParaExportar, `Viatico_${v.cliente}_${v.nombre_empleado}_${v.fecha_salida ? v.fecha_salida.split(' ')[0] : ''}`);
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
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viaticos.length > 0 ? (
                                viaticos.map((v) => {
                                    // Evaluamos el estado de forma segura una sola vez por fila
                                    const esCerrado = (v.estado_viatico || "").trim().toLowerCase() === "cerrado";

                                    return (
                                        <tr key={v.id}>
                                            <td>{v.nombre_empleado}</td>
                                            <td>{v.cliente}</td>
                                            <td>{v.origen} ➝ {v.destino}</td>
                                            <td>{formatearFecha(v.fecha_salida)}</td>
                                            <td>{formatearFecha(v.fecha_regreso)}</td>
                                            <td style={{ fontWeight: "bold" }}>L. {v.total_general}</td>
                                            <td>
                                                <span className="badge" style={{ 
                                                    backgroundColor: esCerrado ? '#dcfce7' : (v.estado === 'Rechazada' ? '#fee2e2' : (v.estado === 'En revisión' || v.estado === 'Pendiente' ? '#fef3c7' : '#f1f5f9')), 
                                                    color: esCerrado ? '#166534' : (v.estado === 'Rechazada' ? '#991b1b' : (v.estado === 'En revisión' || v.estado === 'Pendiente' ? '#92400e' : '#475569')), 
                                                    border: `1px solid ${esCerrado ? '#bbf7d0' : (v.estado === 'Rechazada' ? '#fecaca' : (v.estado === 'En revisión' || v.estado === 'Pendiente' ? '#fde68a' : '#cbd5e1'))}` 
                                                }}>
                                                    {esCerrado ? 'Cerrado' : (v.estado || 'Activo')}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: "flex", gap: "8px" }}>
                                                    <button 
                                                    className="btn btn-actionsviaticos"
                                                    style={{ 
                                                        padding: "6px 12px", 
                                                        fontSize: "13px",
                                                        opacity: v.estado_viatico === 'Cerrado' ? 0.5 : 1,
                                                        cursor: v.estado_viatico === 'Cerrado' ? 'not-allowed' : 'pointer'
                                                    }}
                                                    onClick={() => {
                                                        if (v.estado_viatico === 'Cerrado') return;
                                                        navigate(`/admin/dashboard/editar/${v.id}`);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    disabled={v.estado_viatico === 'Cerrado'}
                                                    title={v.estado_viatico === 'Cerrado' ? "No se puede editar un viático cerrado" : "Editar viático"}
                                                >
                                                    Editar
                                                </button>
                                                    <button 
                                                        className="btn btn-actionsviaticos"
                                                        style={{ padding: "6px 12px", fontSize: "13px" }}
                                                        onClick={() => handleExportRow(v)}
                                                    >
                                                        Exportar A Excel
                                                    </button>
                                                   
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
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