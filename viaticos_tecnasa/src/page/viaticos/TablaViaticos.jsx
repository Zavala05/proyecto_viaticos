import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; 
import { ObtenerViaticos } from "../../service/auth.service.js"; 
import { exportToExcel } from "../../utils/exportToExcel.js";
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

    // Función para dar formato normal a la fecha y hora sin desfases de zona horaria
    const formatearFecha = (fecha) => {
        if (!fecha) return "N/A";
        
        // El problema suele ser que 'new Date(fecha)' interpreta el string como UTC
        // y lo convierte a la hora local del navegador, causando un desfase.
        // Vamos a parsear el string directamente para mostrar exactamente lo que hay en la BD.
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
            // Calculamos el total de hospedaje para el excel (noches * costo_diario)
            costo_hospedaje: Number(v.costo_hospedaje || 0) * (v.noches_count || 0),
            // Aseguramos que los costos sean números
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
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                <button 
                                                    className="btn btn-actionsviaticos"
                                                    style={{ padding: "6px 12px", fontSize: "13px" }}
                                                    onClick={() => {
                                                        navigate(`/admin/dashboard/editar/${v.id}`);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
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