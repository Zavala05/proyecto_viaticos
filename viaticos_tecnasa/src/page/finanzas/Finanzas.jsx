import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ObtenerTodasLiquidaciones, ActualizarEstadoLiquidacion } from "../../service/auth.service";
import { exportLiquidacionToExcel } from "../../utils/exportLiquidacionToExcel";
import "../../../public/styles/ViaticosMapa.css";

export default function Finanzas() {
  const { userData, logout } = useAuth();
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [selectedLiq, setSelectedLiq] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [obsFinanzas, setObsFinanzas] = useState("");

  const renderSaldo = (saldo) => {
    const s = Number(saldo);
    if (s > 0) {
      return (
        <div style={{ fontSize: "11px" }}>
          <span style={{ color: "#64748b", display: "block" }}>Pendiente por empleado:</span>
          <span style={{ color: "#16a34a", fontWeight: "bold" }}>L. {s.toFixed(2)}</span>
        </div>
      );
    } else if (s < 0) {
      return (
        <div style={{ fontSize: "11px" }}>
          <span style={{ color: "#64748b", display: "block" }}>Pendiente por empresa:</span>
          <span style={{ color: "#ef4444", fontWeight: "bold" }}>L. {Math.abs(s).toFixed(2)}</span>
        </div>
      );
    }
    return <span style={{ fontWeight: "bold" }}>L. 0.00</span>;
  };

  useEffect(() => {
    fetchLiquidaciones();
  }, []);

  const fetchLiquidaciones = async () => {
    setCargando(true);
    try {
      const data = await ObtenerTodasLiquidaciones();
      setLiquidaciones(data);
    } catch (error) {
      console.error("Error al obtener todas las liquidaciones:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleVerDetalle = (liq) => {
    setSelectedLiq(liq);
    setObsFinanzas(""); // Resetear observaciones al abrir detalle
    setShowModal(true);
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    // Si se rechaza, validamos que haya una observación
    if (nuevoEstado === 'Rechazada' && !obsFinanzas.trim()) {
      alert("Por favor, ingresa una observación para justificar el rechazo.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de marcar esta liquidación como ${nuevoEstado}?`)) return;
    
    try {
      await ActualizarEstadoLiquidacion(id, nuevoEstado, obsFinanzas);
      alert(`Liquidación ${nuevoEstado} con éxito`);
      setShowModal(false);
      fetchLiquidaciones();
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  };

  const handleExportExcel = async (liq) => {
    try {
      await exportLiquidacionToExcel(liq);
    } catch (error) {
      alert("Error al generar el archivo Excel");
    }
  };

  return (
    <div className="viaticos-container">
      <div className="viaticos-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Panel de Finanzas</h1>
          <p>Bienvenido, {userData?.nombre}. Control global de liquidaciones.</p>
        </div>
        <button className="btn btn-danger" onClick={logout}>Cerrar Sesión</button>
      </div>

      {cargando ? (
        <p>Cargando todas las liquidaciones...</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table className="tabla-moderna">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Motivo</th>
                <th>Total Gastado</th>
                <th>Estado Saldo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {liquidaciones.length > 0 ? (
                liquidaciones.map((l) => (
                  <tr key={l.id}>
                    <td><strong>{l.empleado_nombre}</strong></td>
                    <td>{l.motivo_viaje}</td>
                    <td>L. {Number(l.total_gastado).toFixed(2)}</td>
                    <td>
                      {renderSaldo(l.saldo)}
                    </td>
                    <td>
                      <span className={`badge`} style={{ 
                        backgroundColor: l.estado === 'Cerrado' ? '#dcfce7' : (l.estado === 'Rechazada' ? '#fee2e2' : (l.estado === 'En revisión' ? '#fef3c7' : '#f1f5f9')),
                        color: l.estado === 'Cerrado' ? '#166534' : (l.estado === 'Rechazada' ? '#991b1b' : (l.estado === 'En revisión' ? '#92400e' : '#475569')),
                        border: `1px solid ${l.estado === 'Cerrado' ? '#bbf7d0' : (l.estado === 'Rechazada' ? '#fecaca' : (l.estado === 'En revisión' ? '#fde68a' : '#cbd5e1'))}`
                      }}>
                        {l.estado}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: "6px 12px", fontSize: "12px" }}
                        onClick={() => handleVerDetalle(l)}
                      >
                        {l.estado === 'Pendiente' ? 'Auditar' : 'Ver Detalle'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No hay liquidaciones registradas en el sistema.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Detalle para Finanzas */}
      {showModal && selectedLiq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h2>Detalle Global: {selectedLiq.empleado_nombre}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748b" }}>Cliente / Destino</label>
                  <p style={{ fontWeight: "600" }}>{selectedLiq.cliente || "N/A"} - {selectedLiq.destino}</p>
                </div>
                <div>
                  <label style={{ fontSize: "12px", color: "#64748b" }}>Total Asignado</label>
                  <p style={{ fontWeight: "600" }}>L. {Number(selectedLiq.total_asignado).toFixed(2)}</p>
                </div>
              </div>

              <h3 style={{ fontSize: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "10px" }}>Desglose de Gastos</h3>
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
                  <strong>Observaciones anteriores:</strong>
                  <p style={{ margin: "5px 0 0 0" }}>{selectedLiq.observaciones}</p>
                </div>
              )}

              {/* Campo para que Finanzas escriba su observación (Solo si está pendiente) */}
              {selectedLiq.estado === 'Pendiente' && (
                <div className="form-group" style={{ marginTop: "20px" }}>
                  <label className="form-label" style={{ color: "#1e40af", fontWeight: "600" }}>Observaciones de Finanzas:</label>
                  <textarea 
                    className="form-control"
                    style={{ minHeight: "80px", resize: "vertical", borderColor: "#bfdbfe" }}
                    value={obsFinanzas}
                    onChange={(e) => setObsFinanzas(e.target.value)}
                    placeholder="Escribe aquí la razón del rechazo o notas de auditoría..."
                  ></textarea>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cerrar</button>
                <button 
                  className="btn btn-success" 
                  style={{ backgroundColor: "#1e293b" }} 
                  onClick={() => handleExportExcel(selectedLiq)}
                >
                  Exportar a Excel
                </button>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleCambiarEstado(selectedLiq.id, 'Rechazada')}
                  disabled={selectedLiq.estado !== 'Pendiente'}
                >
                  Rechazar
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={() => handleCambiarEstado(selectedLiq.id, 'Aprobada')}
                  disabled={selectedLiq.estado !== 'Pendiente'}
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
