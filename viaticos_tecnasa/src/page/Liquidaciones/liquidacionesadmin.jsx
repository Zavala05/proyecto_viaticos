import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ObtenerTodasLiquidaciones, ActualizarEstadoLiquidacion } from "../../service/auth.service";
import { exportLiquidacionToExcel } from "../../utils/exportLiquidacionToExcel";
import "../../../public/styles/ViaticosMapa.css";

export default function LiquidacionesAdmin() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [liquidaciones, setLiquidaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [revertiendoId, setRevertiendoId] = useState(null);
    const [selectedLiq, setSelectedLiq] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchLiquidaciones = async () => {
        setCargando(true);
        try {
            const data = await ObtenerTodasLiquidaciones();
            // Solo mostramos las que están en estado 'Cerrado'
            const cerradas = data.filter(l => l.estado === 'Cerrado');
            setLiquidaciones(cerradas);
        } catch (error) {
            console.error("Error al obtener liquidaciones:", error);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        fetchLiquidaciones();
    }, []);

    const handleVerDetalle = (liq) => {
        setSelectedLiq(liq);
        setShowModal(true);
    };

    const handleRevertirAFinanzas = async () => {
        if (!selectedLiq) return;
        if (!window.confirm(`¿Estás seguro de que deseas revertir la liquidación ${selectedLiq.codigo} a revisión de finanzas?`)) {
            return;
        }

        setRevertiendoId(selectedLiq.id);
        try {
            // El estado 'Pendiente' es el que Finanzas revisa según la lógica del backend
            await ActualizarEstadoLiquidacion(selectedLiq.id, 'Pendiente', "Liquidación revertida a finanzas por administrador");
            alert("Liquidación revertida a finanzas correctamente.");
            setShowModal(false);
            fetchLiquidaciones();
        } catch (error) {
            console.error("Error al revertir:", error);
            alert("Error al intentar revertir la liquidación.");
        } finally {
            setRevertiendoId(null);
        }
    };

    const handleExportExcel = async () => {
        if (!selectedLiq) return;
        try {
            await exportLiquidacionToExcel(selectedLiq);
        } catch (error) {
            alert("Error al generar el archivo Excel");
        }
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return "N/A";
        return new Date(fecha).toLocaleDateString('es-HN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <div className="viaticos-container">
            <div className="viaticos-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                    <h1>Administración de Liquidaciones Cerradas</h1>
                    <p>Bienvenido, {userData?.nombre}. Aquí puedes visualizar y revertir liquidaciones finalizadas.</p>
                </div>
                <button 
                    className="btn btn-outline" 
                    onClick={() => navigate("/admin/viaticos")}
                    style={{ marginTop: "10px" }}
                >
                    Regresar
                </button>
            </div>

            {cargando ? (
                <p>Cargando liquidaciones...</p>
            ) : (
                <div style={{ overflowX: "auto", marginTop: "20px" }}>
                    <table className="tabla-moderna">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Empleado</th>
                                <th>Motivo</th>
                                <th>Destino</th>
                                <th>Fecha Salida</th>
                                <th>Total Gastado</th>
                                <th>Estado</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {liquidaciones.length > 0 ? (
                                liquidaciones.map((l) => (
                                    <tr key={l.id}>
                                        <td style={{ fontWeight: "600", color: "#2563eb" }}>{l.codigo}</td>
                                        <td>{l.empleado_nombre}</td>
                                        <td>{l.motivo_viaje}</td>
                                        <td>{l.destino}</td>
                                        <td>{formatearFecha(l.fecha_salida)}</td>
                                        <td style={{ fontWeight: "bold" }}>L. {Number(l.total_gastado).toFixed(2)}</td>
                                        <td>
                                            <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                                                {l.estado}
                                            </span>
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-primary"
                                                style={{ padding: "6px 12px", fontSize: "12px" }}
                                                onClick={() => handleVerDetalle(l)}
                                            >
                                                Ver Detalles
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>No hay liquidaciones cerradas para mostrar.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal de Detalle para Administrador */}
            {showModal && selectedLiq && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ maxWidth: "700px" }}>
                        <div className="modal-header">
                            <h2>Detalle de Liquidación: {selectedLiq.codigo}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#64748b" }}>Empleado</label>
                                    <p style={{ fontWeight: "600" }}>{selectedLiq.empleado_nombre}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#64748b" }}>Motivo / Destino</label>
                                    <p style={{ fontWeight: "600" }}>{selectedLiq.motivo_viaje} - {selectedLiq.destino}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#64748b" }}>Total Asignado</label>
                                    <p style={{ fontWeight: "600" }}>L. {Number(selectedLiq.total_asignado).toFixed(2)}</p>
                                </div>
                                <div>
                                    <label style={{ fontSize: "12px", color: "#64748b" }}>Saldo</label>
                                    <p style={{ fontWeight: "600", color: selectedLiq.saldo >= 0 ? "#16a34a" : "#ef4444" }}>
                                        L. {Math.abs(selectedLiq.saldo).toFixed(2)} ({selectedLiq.saldo >= 0 ? 'A favor empresa' : 'A favor empleado'})
                                    </p>
                                </div>
                            </div>

                            <h3 style={{ fontSize: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "10px" }}>Resumen de Gastos Reales</h3>
                            <ul style={{ listStyle: "none", padding: 0, fontSize: "14px" }}>
                                <li style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                                    <span>Alimentos:</span> <strong>L. {Number(selectedLiq.gasto_alimentos).toFixed(2)}</strong>
                                </li>
                                <li style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                                    <span>Hospedaje:</span> <strong>L. {Number(selectedLiq.gasto_hospedaje).toFixed(2)}</strong>
                                </li>
                                <li style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                                    <span>Peajes:</span> <strong>L. {Number(selectedLiq.gasto_peajes).toFixed(2)}</strong>
                                </li>
                                <li style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                                    <span>Combustible:</span> <strong>L. {Number(selectedLiq.gasto_combustible).toFixed(2)}</strong>
                                </li>
                                <li style={{ display: "flex", justifyContent: "space-between", padding: "5px 0" }}>
                                    <span>Imprevistos:</span> <strong>L. {Number(selectedLiq.gasto_imprevistos).toFixed(2)}</strong>
                                </li>
                                <li style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: "2px solid #f1f5f9", marginTop: "5px", fontSize: "16px" }}>
                                    <span>Total Gastado:</span> <strong style={{ color: "#2563eb" }}>L. {Number(selectedLiq.total_gastado).toFixed(2)}</strong>
                                </li>
                            </ul>

                            {/* Desglose Diario Detallado */}
                            {selectedLiq.detalle_diario && (
                                <div style={{ marginTop: "20px" }}>
                                    <h3 style={{ fontSize: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "10px" }}>Desglose por Día</h3>
                                    <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "10px" }}>
                                        {(Array.isArray(selectedLiq.detalle_diario) ? selectedLiq.detalle_diario : JSON.parse(selectedLiq.detalle_diario || '[]')).map((dia, idx) => (
                                            <div key={idx} style={{ 
                                                minWidth: "150px", 
                                                background: "#f8fafc", 
                                                padding: "10px", 
                                                borderRadius: "8px", 
                                                border: "1px solid #e2e8f0",
                                                fontSize: "12px"
                                            }}>
                                                <div style={{ fontWeight: "bold", textAlign: "center", marginBottom: "5px", color: "#2563eb" }}>{dia.fecha}</div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Desayuno:</span> <span>L. {Number(dia.desayuno).toFixed(2)}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Almuerzo:</span> <span>L. {Number(dia.almuerzo).toFixed(2)}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Cena:</span> <span>L. {Number(dia.cena).toFixed(2)}</span></div>
                                                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #cbd5e1", marginTop: "3px", paddingTop: "3px" }}>
                                                    <span>Hospedaje:</span> <span>L. {Number(dia.hospedaje).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedLiq.observaciones && (
                                <div style={{ marginTop: "15px", padding: "10px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px" }}>
                                    <strong>Observaciones de liquidación:</strong>
                                    <p style={{ margin: "5px 0 0 0" }}>{selectedLiq.observaciones}</p>
                                </div>
                            )}

                            <div style={{ marginTop: "20px", padding: "15px", background: "#fffbeb", borderRadius: "10px", border: "1px solid #fef3c7" }}>
                                <p style={{ margin: 0, fontSize: "13px", color: "#92400e" }}>
                                    <strong>Nota:</strong> Al devolver esta liquidación, el estado cambiará a 'Pendiente' para que el departamento de Finanzas pueda revisarla y aprobarla/rechazarla nuevamente.
                                </p>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cerrar</button>
                                <button 
                                    className="btn btn-success" 
                                    style={{ backgroundColor: "#1e293b" }} 
                                    onClick={handleExportExcel}
                                >
                                    Exportar a Excel
                                </button>
                            </div>
                            <button 
                                className="btn btn-danger" 
                                onClick={handleRevertirAFinanzas}
                                disabled={revertiendoId === selectedLiq.id}
                            >
                                {revertiendoId === selectedLiq.id ? "Revirtiendo..." : "Devolver para Revisión de Finanzas"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}