import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { ObtenerViaticos } from "../../service/auth.service";
import "../../../public/styles/ViaticosMapa.css";

export default function LiquidacionesUsuario() {
  const { userData, logout } = useAuth();
  const [viaticos, setViaticos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEnvio, setCargandoEnvio] = useState(false);
  const [selectedViatico, setSelectedViatico] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Estado para el formulario de liquidación
  const [gastosDiarios, setGastosDiarios] = useState([]);
  const [gastosGenerales, setGastosGenerales] = useState({
    gasto_peajes: 0,
    gasto_combustible: 0,
    gasto_imprevistos: 0
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

  useEffect(() => {
    fetchViaticos();
  }, []);

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

  const fetchViaticos = async () => {
    setCargando(true);
    try {
      const data = await ObtenerViaticos();
      setViaticos(data);
    } catch (error) {
      console.error("Error al obtener viáticos:", error);
    } finally {
      setCargando(false);
    }
  };

  const handleOpenLiquidar = (viatico) => {
    setSelectedViatico(viatico);
    
    // Parsear fechas de salida y regreso
    const fechaSalida = new Date(viatico.fecha_salida);
    const fechaRegreso = new Date(viatico.fecha_regreso);
    
    // Calcular días (mínimo 1)
    const numDias = Math.max(1, viatico.noches_count + 1);
    
    // Inicializar gastos diarios dinámicamente según horarios de viático asignado
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

      // Si ya existe un detalle guardado (en caso de corrección), lo usamos
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
        // Lógica de asignación de comidas original si no hay detalle previo
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
    setShowModal(true);
  };

  const handleGastoDiarioChange = (index, field, value) => {
    const nuevosGastos = [...gastosDiarios];
    nuevosGastos[index][field] = Number(value);
    setGastosDiarios(nuevosGastos);
  };

  const totalAlimentos = useMemo(() => {
    return gastosDiarios.reduce((sum, d) => sum + Number(d.desayuno || 0) + Number(d.almuerzo || 0) + Number(d.cena || 0), 0);
  }, [gastosDiarios]);

  const totalHospedaje = useMemo(() => {
    return gastosDiarios.reduce((sum, d) => sum + Number(d.hospedaje || 0), 0);
  }, [gastosDiarios]);

  const totalGeneral = useMemo(() => {
    return totalAlimentos + totalHospedaje + 
           Number(gastosGenerales.gasto_peajes) + 
           Number(gastosGenerales.gasto_combustible) + 
           Number(gastosGenerales.gasto_imprevistos);
  }, [totalAlimentos, totalHospedaje, gastosGenerales]);

  const handleSubmitLiquidacion = async (e) => {
    e.preventDefault();
    setCargandoEnvio(true);
    try {
      // Aplanamos los datos para que coincidan con lo que espera el backend
      const payload = {
        viatico_id: selectedViatico.id,
        gasto_alimentos: totalAlimentos,
        gasto_hospedaje: totalHospedaje,
        gasto_peajes: gastosGenerales.gasto_peajes,
        gasto_combustible: gastosGenerales.gasto_combustible,
        gasto_imprevistos: gastosGenerales.gasto_imprevistos,
        detalle_diario: gastosDiarios // Enviamos el desglose diario
      };

      const res = await fetch(`${API_URL}/liquidaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Usar cookies para la sesión
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Liquidación enviada correctamente");
        setShowModal(false);
        fetchViaticos();
      } else {
        alert(result.message || "Error al enviar liquidación");
      }
    } catch (error) {
      alert("Error de red al enviar liquidación");
    } finally {
      setCargandoEnvio(false);
    }
  };

  return (
    <div className="viaticos-container">
      <div className="viaticos-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>Mis Viáticos y Liquidaciones</h1>
          <p>Bienvenido, {userData?.nombre}. Aquí puedes gestionar tus gastos.</p>
        </div>
        <button className="btn btn-danger" onClick={logout}>Cerrar Sesión</button>
      </div>

      {cargando ? (
        <p>Cargando tus registros...</p>
      ) : (
        <div style={{ overflowX: "auto", marginTop: "20px" }}>
          <table className="tabla-moderna">
            <thead>
              <tr>
                <th>Código</th>
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
              {viaticos.length > 0 ? (
                viaticos.map((v) => (
                  <tr key={v.id}>
                    <td style={{ fontSize: "11px", fontWeight: "600", color: "#64748b" }}>
                      {v.codigo || "---"}
                    </td>
                    <td>{v.motivo_viaje}</td>
                    <td>{v.destino}</td>
                    <td>{v.noches_count + 1}</td>
                    <td style={{ fontWeight: "bold" }}>L. {v.total_general}</td>
                    <td>
                      {renderSaldo(v.saldo)}
                    </td>
                    <td>
                      {v.liquidacion_id ? (
                        <span className="badge" style={{ 
                          backgroundColor: v.estado === 'Cerrado' ? '#dcfce7' : (v.estado === 'Rechazada' ? '#fee2e2' : (v.estado === 'En revisión' ? '#fef3c7' : '#f1f5f9')), 
                          color: v.estado === 'Cerrado' ? '#166534' : (v.estado === 'Rechazada' ? '#991b1b' : (v.estado === 'En revisión' ? '#92400e' : '#475569')), 
                          border: `1px solid ${v.estado === 'Cerrado' ? '#bbf7d0' : (v.estado === 'Rechazada' ? '#fecaca' : (v.estado === 'En revisión' ? '#fde68a' : '#cbd5e1'))}` 
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
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px" }}>No tienes viáticos pendientes de liquidar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Liquidación por Días */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "900px", width: "95%" }}>
            <div className="modal-header">
              <h2>Liquidar: {selectedViatico?.motivo_viaje}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmitLiquidacion}>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                
                {/* Grid de Columnas por Día */}
                <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#1e293b" }}>Gastos Diarios (Alimentos y Hospedaje)</h3>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: `repeat(${gastosDiarios.length}, minmax(180px, 1fr))`, 
                  gap: "15px", 
                  overflowX: "auto",
                  paddingBottom: "10px",
                  marginBottom: "25px"
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
                          min="0"
                          step="0.01"
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.desayuno}
                          onChange={(e) => handleGastoDiarioChange(index, "desayuno", e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Almuerzo (L.)</label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.almuerzo}
                          onChange={(e) => handleGastoDiarioChange(index, "almuerzo", e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Cena (L.)</label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.cena}
                          onChange={(e) => handleGastoDiarioChange(index, "cena", e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Hospedaje (L.)</label>
                        <input 
                          type="number" 
                          min="0"
                          step="0.01"
                          className="form-control"
                          style={{ padding: "6px", fontSize: "13px" }}
                          value={dia.hospedaje}
                          onChange={(e) => handleGastoDiarioChange(index, "hospedaje", e.target.value)}
                        />
                      </div>
                      <div style={{ marginTop: "10px", textAlign: "right", fontSize: "12px", fontWeight: "600", color: "#64748b" }}>
                        Subtotal: L. {(Number(dia.desayuno || 0) + Number(dia.almuerzo || 0) + Number(dia.cena || 0) + Number(dia.hospedaje || 0)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gastos Generales */}
                <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#1e293b" }}>Gastos de Ruta e Imprevistos</h3>
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
                  justifyContent: "space-between",
                  alignItems: "center"
                }}>
                  <div style={{ display: "flex", gap: "30px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Alimentos</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e40af" }}>L. {totalAlimentos.toFixed(2)}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "12px", color: "#60a5fa", textTransform: "uppercase", letterSpacing: "0.05em" }}>Hospedaje</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e40af" }}>L. {totalHospedaje.toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "13px", color: "#1e40af", fontWeight: "600" }}>TOTAL A LIQUIDAR</div>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb" }}>L. {totalGeneral.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={cargandoEnvio}>Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ padding: "10px 30px" }} disabled={cargandoEnvio}>
                  {cargandoEnvio ? "Enviando..." : "Enviar Liquidación Final"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
