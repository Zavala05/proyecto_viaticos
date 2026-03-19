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

      {/* 1. Botones de Acción (Ahora arriba) */}
      <div className="btn-group" style={{ marginBottom: "20px", borderTop: "none", borderBottom: "1px solid #e2e8f0", paddingBottom: "20px" }}>
        <button 
          className="btn btn-successl"
          onClick={() => setters.toggleModal(true)}
        >
          {state.isEditing ? "Editar viático seleccionado" : "Registrar nuevo viático"}
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

      {/* 2. Tabla de Viáticos (Debajo de los botones) */}
      <TablaViaticos />

      {/* 3. Modal de Formulario, Mapa y Resultados */}
      {state.showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{state.isEditing ? "Editar Viático" : "Nuevo Registro de Viático"}</h2>
              <button className="modal-close" onClick={handlers.handleCloseModal}>&times;</button>
            </div>
            
            <div className="modal-body">
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
                <div style={{ marginBottom: "15px", color: "#64748b", fontSize: "13px" }}>
                  ⏳ Verificando disponibilidad del empleado...
                </div>
              )}

              {/* Formulario */}
              <FormularioDatos 
                state={state} 
                setters={setters} 
                handlers={handlers} 
              />

              {/* Mapa */}
              <MapaHonduras 
                rutaCoords={state.rutaCoords} 
                peajesCruzados={state.peajesCruzados} 
              />

              {/* Resultados */}
              <PanelResultados 
                state={state} 
                setters={setters} 
                calculos={calculos} 
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={handlers.handleCloseModal}>
                Cancelar
              </button>
              <button className="btn btn-success" onClick={handlers.handleExport}>
                Exportar a Excel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={async () => {
                  await handlers.registrarViatico();
                  // Si no hay errores, cerramos el modal (esto dependería de si registrarViatico es exitoso)
                  // Por ahora lo dejamos que el usuario decida o que el Hook lo maneje
                }}
                disabled={state.cargandoEdicion || state.conflictosDisponibilidad.length > 0}
              >
                {state.cargandoEdicion ? "Cargando..." : (state.isEditing ? "Actualizar viático" : "Guardar viático")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}