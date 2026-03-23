import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { ObtenerLiquidacionesEquipo, ActualizarEstadoLiquidacion, ObtenerViaticosByEmpleado } from "../../service/auth.service";
import "../../../public/styles/ViaticosMapa.css";

export default function Supervisor() {
  const { userData, logout } = useAuth();
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [selectedLiq, setSelectedLiq] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [obsSupervisor, setObsSupervisor] = useState("");
  
  // Para liquidaciones propias
  const [viaticosPropios, setViaticosPropios] = useState([]);
  const [showModalLiquidar, setShowModalLiquidar] = useState(false);
  const [selectedViatico, setSelectedViatico] = useState(null);
  const [gastosDiarios, setGastosDiarios] = useState([]);
  const [gastosGenerales, setGastosGenerales] = useState({
    gasto_peajes: 0,
    gasto_combustible: 0,
    gasto_imprevistos: 0
  });

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
    fetchViaticosPropios();
  }, []);

  const fetchViaticosPropios = async () => {
    if (!userData?.id_empleado) return;
    try {
      const data = await ObtenerViaticosByEmpleado(userData.id_empleado);
      setViaticosPropios(data);
    } catch (error) {
      console.error("Error al obtener viáticos propios:", error);
    }
  };

  const fetchLiquidaciones = async () => {
    setCargando(true);
    try {
      const data = await ObtenerLiquidacionesEquipo();
      setLiquidaciones(data);
    } catch (error) {
      console.error("Error al obtener liquidaciones del equipo:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleVerDetalle = (liq) => {
    setSelectedLiq(liq);
    setObsSupervisor(""); // Resetear observaciones al abrir detalle
    setShowModal(true);
  };

  const handleCambiarEstado = async (id, nuevoEstado) => {
    // Si se rechaza, validamos que haya una observación
    if (nuevoEstado === 'Rechazada' && !obsSupervisor.trim()) {
      alert("Por favor, ingresa una observación para justificar el rechazo.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de marcar esta liquidación como ${nuevoEstado}?`)) return;
    
    try {
      await ActualizarEstadoLiquidacion(id, nuevoEstado, obsSupervisor);
      alert(`Liquidación ${nuevoEstado} con éxito`);
      setShowModal(false);
      fetchLiquidaciones();
    } catch (error) {
      alert("Error al actualizar el estado");
    }
  };

  // Funciones para liquidar gastos propios
  const handleOpenLiquidar = (viatico) => {
    setSelectedViatico(viatico);
    
    const fechaSalida = new Date(viatico.fecha_salida);
    const fechaRegreso = new Date(viatico.fecha_regreso);
    
    const inicialDiarios = [];
    let current = new Date(fechaSalida);
    current.setHours(0, 0, 0, 0);
    
    const endDay = new Date(fechaRegreso);
    endDay.setHours(0, 0, 0, 0);

    let diaIndex = 1;
    while (current <= endDay) {
      const isFirstDay = current.getTime() === new Date(fechaSalida).setHours(0,0,0,0);
      const isLastDay = current.getTime() === endDay.getTime();
      
      let d = 0, a = 0, c = 0, h = 0;

      let detallePrevio = null;
      if (viatico.detalle_diario) {
        const dd = Array.isArray(viatico.detalle_diario) ? viatico.detalle_diario : JSON.parse(viatico.detalle_diario || '[]');
        detallePrevio = dd.find(item => item.dia === diaIndex);
      }

      if (detallePrevio) {
        d = detallePrevio.desayuno;
        a = detallePrevio.almuerzo;
        c = detallePrevio.cena;
        h = detallePrevio.hospedaje;
      } else {
        if (isFirstDay && isLastDay) {
          if (fechaSalida.getHours() <= 8) d = 150;
          if (fechaSalida.getHours() <= 13 && fechaRegreso.getHours() >= 13) a = 200;
          if (fechaRegreso.getHours() >= 18) c = 200;
        } else if (isFirstDay) {
          if (fechaSalida.getHours() <= 8) d = 150;
          if (fechaSalida.getHours() <= 13) a = 200;
          c = 200;
        } else if (isLastDay) {
          d = 150;
          if (fechaRegreso.getHours() >= 13) a = 200;
          if (fechaRegreso.getHours() >= 19) c = 200;
        } else {
          d = 150; a = 200; c = 200;
        }
        h = isLastDay ? 0 : Number(viatico.costo_hospedaje || 0);
      }

      inicialDiarios.push({
        dia: diaIndex,
        fecha: current.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        desayuno: d,
        almuerzo: a,
        cena: c,
        hospedaje: h
      });

      current.setDate(current.getDate() + 1);
      diaIndex++;
    }
    
    setGastosDiarios(inicialDiarios);
    setGastosGenerales({
      gasto_peajes: viatico.gasto_peajes ?? (Number(viatico.costo_peajes || 0) * 2),
      gasto_combustible: viatico.gasto_combustible ?? Number(viatico.costo_combustible || 0),
      gasto_imprevistos: viatico.gasto_imprevistos ?? Number(viatico.costo_imprevistos || 0)
    });
    setShowModalLiquidar(true);
  };

  const handleGastoDiarioChange = (index, field, value) => {
    const nuevos = [...gastosDiarios];
    nuevos[index][field] = Number(value);
    setGastosDiarios(nuevos);
  };

  const handleSubmitLiquidacion = async () => {
    try {
      const totalAlimentos = gastosDiarios.reduce((acc, d) => acc + d.desayuno + d.almuerzo + d.cena, 0);
      const totalHospedaje = gastosDiarios.reduce((acc, d) => acc + d.hospedaje, 0);
      
      const payload = {
        viatico_id: selectedViatico.id,
        gasto_alimentos: totalAlimentos,
        gasto_hospedaje: totalHospedaje,
        gasto_peajes: gastosGenerales.gasto_peajes,
        gasto_combustible: gastosGenerales.gasto_combustible,
        gasto_imprevistos: gastosGenerales.gasto_imprevistos,
        detalle_diario: gastosDiarios
      };

      const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";
      const res = await fetch(`${API_URL}/liquidaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al enviar liquidación");
      
      alert("Liquidación enviada con éxito");
      setShowModalLiquidar(false);
      fetchViaticosPropios();
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="viaticos-container">
      <div className="viaticos-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Panel de Supervisión</h1>
          <p>Bienvenido, {userData?.nombre}. Liquidaciones pendientes de tu equipo.</p>
        </div>
        <button className="btn btn-danger" onClick={logout}>Cerrar Sesión</button>
      </div>

      {cargando ? (
        <p>Cargando liquidaciones del equipo...</p>
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
                        backgroundColor: l.estado === 'Aprobada' ? '#dcfce7' : (l.estado === 'Rechazada' ? '#fee2e2' : (l.estado === 'En revisión' ? '#fef3c7' : '#f1f5f9')),
                        color: l.estado === 'Aprobada' ? '#166534' : (l.estado === 'Rechazada' ? '#991b1b' : (l.estado === 'En revisión' ? '#92400e' : '#475569')),
                        border: `1px solid ${l.estado === 'Aprobada' ? '#bbf7d0' : (l.estado === 'Rechazada' ? '#fecaca' : (l.estado === 'En revisión' ? '#fde68a' : '#cbd5e1'))}`
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
                        {l.estado === 'En revisión' ? 'Revisar' : 'Ver Detalle'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px" }}>No hay liquidaciones registradas por tu equipo.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* SECCIÓN DE LIQUIDACIONES PROPIAS DEL SUPERVISOR */}
      <div style={{ marginTop: "50px", borderTop: "2px solid #e2e8f0", paddingTop: "20px" }}>
        <h2>Tus Viáticos Asignados</h2>
        <p style={{ fontSize: "14px", color: "#64748b" }}>Aquí puedes liquidar los viáticos que te han sido asignados a ti personalmente.</p>
        
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table className="tabla-moderna">
            <thead>
              <tr>
                <th>Motivo</th>
                <th>Destino</th>
                <th>Días</th>
                <th>Total Asignado</th>
                <th>Saldo</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {viaticosPropios.length > 0 ? (
                viaticosPropios.map((v) => (
                  <tr key={v.id}>
                    <td>{v.motivo_viaje}</td>
                    <td>{v.destino}</td>
                    <td>{v.noches_count + 1}</td>
                    <td style={{ fontWeight: "bold" }}>L. {v.total_general}</td>
                    <td>{renderSaldo(v.saldo)}</td>
                    <td>
                      {v.liquidacion_id ? (
                        <span className="badge" style={{ 
                          backgroundColor: v.estado === 'Cerrado' ? '#dcfce7' : (v.estado === 'Rechazada' ? '#fee2e2' : (v.estado === 'En revisión' || v.estado === 'Pendiente' ? '#fef3c7' : '#f1f5f9')), 
                          color: v.estado === 'Cerrado' ? '#166534' : (v.estado === 'Rechazada' ? '#991b1b' : (v.estado === 'En revisión' || v.estado === 'Pendiente' ? '#92400e' : '#475569')), 
                          border: `1px solid ${v.estado === 'Cerrado' ? '#bbf7d0' : (v.estado === 'Rechazada' ? '#fecaca' : (v.estado === 'En revisión' || v.estado === 'Pendiente' ? '#fde68a' : '#cbd5e1'))}` 
                        }}>
                          {v.estado || 'En revisión'}
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" }}>
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td>
                      <button 
                        className="btn btn-success" 
                        style={{ 
                          padding: "6px 12px", 
                          fontSize: "12px",
                          opacity: (v.liquidacion_id && v.estado !== 'En progreso') ? 0.5 : 1,
                          cursor: (v.liquidacion_id && v.estado !== 'En progreso') ? "not-allowed" : "pointer"
                        }}
                        onClick={() => {
                          if (!v.liquidacion_id || v.estado === 'En progreso') {
                            handleOpenLiquidar(v);
                          }
                        }}
                        disabled={v.liquidacion_id && v.estado !== 'En progreso'}
                      >
                        {v.liquidacion_id && v.estado !== 'En progreso' ? "Liquidación enviada" : (v.estado === 'En progreso' ? "Corregir Gastos" : "Liquidar Gastos")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "20px" }}>No tienes viáticos propios para liquidar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle para Supervisor (Revision de equipo) */}
      {showModal && selectedLiq && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "600px" }}>
            <div className="modal-header">
              <h2>Detalle de Liquidación: {selectedLiq.empleado_nombre}</h2>
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

              <h3 style={{ fontSize: "14px", borderBottom: "1px solid #e2e8f0", paddingBottom: "5px", marginBottom: "10px" }}>Desglose de Gastos Reales</h3>
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

              {/* Campo para que el supervisor escriba su observación (Solo si está en revisión) */}
              {selectedLiq.estado === 'En revisión' && (
                <div className="form-group" style={{ marginTop: "20px" }}>
                  <label className="form-label" style={{ color: "#1e40af", fontWeight: "600" }}>Observaciones del Supervisor:</label>
                  <textarea 
                    className="form-control"
                    style={{ minHeight: "80px", resize: "vertical", borderColor: "#bfdbfe" }}
                    value={obsSupervisor}
                    onChange={(e) => setObsSupervisor(e.target.value)}
                    placeholder="Escribe aquí la razón del rechazo o notas de aprobación..."
                  ></textarea>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ justifyContent: "space-between" }}>
              <div>
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cerrar</button>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button 
                  className="btn btn-danger" 
                  onClick={() => handleCambiarEstado(selectedLiq.id, 'Rechazada')}
                  disabled={selectedLiq.estado !== 'En revisión'}
                >
                  Rechazar
                </button>
                <button 
                  className="btn btn-success" 
                  onClick={() => handleCambiarEstado(selectedLiq.id, 'Aprobada')}
                  disabled={selectedLiq.estado !== 'En revisión'}
                >
                  Aprobar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para que el supervisor liquide sus propios gastos */}
      {showModalLiquidar && selectedViatico && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "800px" }}>
            <div className="modal-header">
              <h2>Liquidar Gastos: {selectedViatico.motivo_viaje}</h2>
              <button className="modal-close" onClick={() => setShowModalLiquidar(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
                <div className="info-card">
                  <span className="info-label">Destino</span>
                  <span className="info-value">{selectedViatico.destino}</span>
                </div>
                <div className="info-card">
                  <span className="info-label">Total Asignado</span>
                  <span className="info-value" style={{ color: "#2563eb" }}>L. {selectedViatico.total_general}</span>
                </div>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#1e293b", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>
                  Desglose Diario de Gastos
                </h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                  gap: "15px" 
                }}>
                  {gastosDiarios.map((dia, index) => (
                    <div key={index} style={{ 
                      background: "#f8fafc", 
                      padding: "15px", 
                      borderRadius: "10px", 
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                    }}>
                      <h4 style={{ margin: "0 0 12px 0", textAlign: "center", color: "#2563eb", fontSize: "14px" }}>{dia.fecha}</h4>
                      
                      <div className="form-group" style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Desayuno (L.)</label>
                        <input 
                          type="number" 
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.desayuno}
                          onChange={(e) => handleGastoDiarioChange(index, 'desayuno', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Almuerzo (L.)</label>
                        <input 
                          type="number" 
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.almuerzo}
                          onChange={(e) => handleGastoDiarioChange(index, 'almuerzo', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Cena (L.)</label>
                        <input 
                          type="number" 
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.cena}
                          onChange={(e) => handleGastoDiarioChange(index, 'cena', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Hospedaje (L.)</label>
                        <input 
                          type="number" 
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.hospedaje}
                          onChange={(e) => handleGastoDiarioChange(index, 'hospedaje', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#1e293b", borderBottom: "2px solid #e2e8f0", paddingBottom: "8px" }}>
                  Gastos Generales y Adicionales
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" }}>
                  <div className="form-group">
                    <label className="form-label">Peajes (L.)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={gastosGenerales.gasto_peajes}
                      onChange={(e) => setGastosGenerales({...gastosGenerales, gasto_peajes: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Combustible (L.)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={gastosGenerales.gasto_combustible}
                      onChange={(e) => setGastosGenerales({...gastosGenerales, gasto_combustible: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Imprevistos (L.)</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={gastosGenerales.gasto_imprevistos}
                      onChange={(e) => setGastosGenerales({...gastosGenerales, gasto_imprevistos: e.target.value})}
                    />
                  </div>
                </div>

                {/* Observaciones (Si existen y no está cerrado) */}
                {selectedViatico?.estado !== 'Cerrado' && selectedViatico?.observaciones && (
                  <div style={{ marginBottom: "20px", padding: "15px", background: "#fee2e2", borderRadius: "10px", border: "1px solid #fecaca" }}>
                    <h4 style={{ margin: "0 0 8px 0", color: "#991b1b", fontSize: "14px" }}>Observaciones / Razón de rechazo:</h4>
                    <p style={{ margin: 0, fontSize: "13px", color: "#7f1d1d" }}>{selectedViatico.observaciones}</p>
                  </div>
                )}

                {/* Resumen Final */}
                <div style={{ 
                  marginTop: "25px", 
                  padding: "20px", 
                  background: "#eff6ff", 
                  borderRadius: "12px", 
                  border: "1px solid #bfdbfe",
                  display: "flex",
                  justifyContent: "space-around",
                  alignItems: "center"
                }}>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "13px", color: "#1e40af", display: "block" }}>Total Gastado Real</span>
                    <span style={{ fontSize: "24px", fontWeight: "bold", color: "#1e3a8a" }}>
                      L. {(
                        gastosDiarios.reduce((acc, d) => acc + d.desayuno + d.almuerzo + d.cena + d.hospedaje, 0) + 
                        Number(gastosGenerales.gasto_peajes) + 
                        Number(gastosGenerales.gasto_combustible) + 
                        Number(gastosGenerales.gasto_imprevistos)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div style={{ width: "2px", height: "40px", background: "#bfdbfe" }}></div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "13px", color: "#1e40af", display: "block" }}>Saldo Final</span>
                    <span style={{ 
                      fontSize: "24px", 
                      fontWeight: "bold", 
                      color: (Number(selectedViatico.total_general) - (gastosDiarios.reduce((acc, d) => acc + d.desayuno + d.almuerzo + d.cena + d.hospedaje, 0) + Number(gastosGenerales.gasto_peajes) + Number(gastosGenerales.gasto_combustible) + Number(gastosGenerales.gasto_imprevistos))) >= 0 ? "#16a34a" : "#ef4444"
                    }}>
                      L. {Math.abs(Number(selectedViatico.total_general) - (gastosDiarios.reduce((acc, d) => acc + d.desayuno + d.almuerzo + d.cena + d.hospedaje, 0) + Number(gastosGenerales.gasto_peajes) + Number(gastosGenerales.gasto_combustible) + Number(gastosGenerales.gasto_imprevistos))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowModalLiquidar(false)}>Cancelar</button>
              <button className="btn btn-success" onClick={handleSubmitLiquidacion}>Enviar Liquidación Final</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
