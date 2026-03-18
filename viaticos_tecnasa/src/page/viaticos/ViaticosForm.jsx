import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useViaticosLogic } from "./useViaticoLogic";// ¡Lo crearemos en el siguiente paso!
import FormularioDatos from "./FormularioDatos";       // Componente hijo
import MapaHonduras from "./MapaHonduras";             // Componente hijo
import PanelResultados from "./PanelResultados";       // Componente hijo
import TablaViaticos from "./TablaViaticos";
import "./ViaticosMapa.css";

export default function ViaticosMapa({ setUser, User }) {
  const navigate = useNavigate();
  const { id: viaticosId } = useParams();

  // Extraemos toda la lógica y estados desde nuestro Custom Hook
  const {
    state,
    setters,
    calculos,
    handlers
  } = useViaticosLogic(viaticosId, setUser);

  return (
    <div className="viaticos-container">
      <div className="viaticos-header">
        <h1>Cálculo de Viáticos</h1>
        <p>Calculo de Viáticos TECNASA</p>
      </div>

      {/* Alertas de disponibilidad */}
      {state.conflictosDisponibilidad.length > 0 && (
        <div className="alert-warning">
          <h3 style={{ marginTop: 0 }}>⚠️ Conflicto de Disponibilidad</h3>
          <p><strong>El empleado "{state.empleado}"</strong> ya tiene asignado un viaje:</p>
          <ul>
            {state.conflictosDisponibilidad.map((conflicto, idx) => (
              <li key={idx}>
                <strong>Cliente:</strong> {conflicto.cliente} | 
                <strong> Salida:</strong> {conflicto.fecha_salida} | 
                <strong> Regreso:</strong> {conflicto.fecha_regreso}
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.verificandoDisponibilidad && (
        <div style={{ marginTop: "10px", color: "#64748b", fontSize: "13px" }}>
          ⏳ Verificando disponibilidad del empleado...
        </div>
      )}

      {/* 1. Formulario Superior */}
      <FormularioDatos 
        state={state} 
        setters={setters} 
        handlers={handlers} 
      />

      {/* 2. Mapa */}
      <MapaHonduras 
        rutaCoords={state.rutaCoords} 
        peajesCruzados={state.peajesCruzados} 
      />

      {/* 3. Resultados y Cálculos */}
      <PanelResultados 
        state={state} 
        setters={setters} 
        calculos={calculos} 
      />
      <TablaViaticos />

      {/* 4. Botones de Acción */}
      <div className="btn-group">
        <button 
          className="btn btn-successl"
          onClick={handlers.registrarViatico}
          disabled={state.cargandoEdicion || state.conflictosDisponibilidad.length > 0}
        >
          {state.cargandoEdicion ? "Cargando..." : (viaticosId ? "Actualizar viático" : "Registrar viático")}
        </button>
        <button className="btn btn-success" onClick={handlers.handleExport}>
          Exportar a Excel
        </button>
        <button className="btn btn-outline" onClick={() => navigate("/admin/registrarusuario")}>
          Registrar Empleado
        </button>
        <button className="btn btn-outline" onClick={() => navigate("/admin/agregarcliente")}>
          Registrar Cliente
        </button>
        <button className="btn btn-outline" onClick={() => navigate("/admin/ubicaciones")}>
          Ver Ubicaciones
        </button>
        <button className="btn btn-danger" onClick={handlers.handleLogout}>
          Logout
        </button>
      </div>

    </div>
  );
}