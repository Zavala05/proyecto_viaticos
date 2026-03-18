import React from "react";

export default function PanelResultados({ state, setters, calculos }) {
  return (
    <div className="panel-resultados" style={{ marginTop: "24px" }}>
      
      {/* 1. Resumen de la Ruta y Peajes */}
      <div className="resultados-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <div className="card" style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, color: "#0f172a" }}>🗺️ Resumen de Ruta</h3>
          <p style={{ margin: "8px 0" }}><strong>Distancia Total:</strong> {state.distanciaTotal || "0 km"}</p>
          <p style={{ margin: "8px 0" }}><strong>Peajes Cruzados (Ida):</strong> {state.peajesCruzados.length}</p>
          
          {state.peajesCruzados.length > 0 && (
            <ul style={{ margin: "8px 0", paddingLeft: "20px", fontSize: "14px" }}>
              {state.peajesCruzados.map((peaje, index) => (
                <li key={index}>{peaje}</li>
              ))}
            </ul>
          )}
          <p style={{ margin: "8px 0", color: "#dc2626", fontWeight: "bold" }}>
            Costo Peajes (Ida y Vuelta): L {(state.costoPeajes * 2).toFixed(2)}
          </p>
        </div>

        {/* 2. Ajuste Manual de Comidas y Noches */}
        <div className="card" style={{ padding: "16px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ marginTop: 0, color: "#0f172a" }}>Cantidades (Días/Comidas)</h3>
          <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "12px" }}>
            *Se calculan automáticamente según las fechas, pero puedes ajustarlos manualmente.
          </p>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>Desayunos:</label>
              <input 
                type="number" min="0" 
                value={state.desayunosManual} 
                onChange={(e) => setters.setDesayunosManual(Number(e.target.value))}
                style={{ width: "100%", padding: "6px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>Almuerzos:</label>
              <input 
                type="number" min="0" 
                value={state.almuerzosManual} 
                onChange={(e) => setters.setAlmuerzosManual(Number(e.target.value))}
                style={{ width: "100%", padding: "6px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>Cenas:</label>
              <input 
                type="number" min="0" 
                value={state.cenasManual} 
                onChange={(e) => setters.setCenasManual(Number(e.target.value))}
                style={{ width: "100%", padding: "6px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>Noches de Hospedaje:</label>
              <input 
                type="number" min="0" 
                value={state.nochesManual} 
                onChange={(e) => setters.setNochesManual(Number(e.target.value))}
                style={{ width: "100%", padding: "6px" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Desglose Total Final */}
      <div className="totales-card" style={{ padding: "20px", backgroundColor: "#e2e8f0", borderRadius: "8px", border: "1px solid #cbd5e1" }}>
        <h3 style={{ marginTop: 0, borderBottom: "1px solid #94a3b8", paddingBottom: "8px" }}>Desglose de Costos</h3>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "10px", textAlign: "center", margin: "16px 0" }}>
          <div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>Alimentos</p>
            <p style={{ margin: 0, fontWeight: "bold" }}>L {calculos.totalAlimentos.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>Hospedaje</p>
            <p style={{ margin: 0, fontWeight: "bold" }}>L {calculos.totalHospedaje.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>Combustible</p>
            <p style={{ margin: 0, fontWeight: "bold" }}>L {calculos.totalCombustible.toFixed(2)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>Peajes</p>
            <p style={{ margin: 0, fontWeight: "bold" }}>L {(state.costoPeajes * 2).toFixed(2)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: "14px", color: "#475569" }}>Imprevistos</p>
            <p style={{ margin: 0, fontWeight: "bold" }}>L {calculos.totalImprevistos.toFixed(2)}</p>
          </div>
        </div>

        <div style={{ backgroundColor: "#0f172a", color: "white", padding: "16px", borderRadius: "8px", textAlign: "right" }}>
          <h2 style={{ margin: 0, color: "white"}}>Total General: L {calculos.totalGeneral.toFixed(2)}</h2>
        </div>
      </div>

    </div>
  );
}