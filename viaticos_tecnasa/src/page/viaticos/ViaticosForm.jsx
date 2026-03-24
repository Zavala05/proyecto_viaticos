import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useViaticosLogic } from "./useViaticoLogic";// ¡Lo crearemos en el siguiente paso!
import FormularioDatos from "./FormularioDatos";       // Componente hijo
import MapaHonduras from "./MapaHonduras";             // Componente hijo
import PanelResultados from "./PanelResultados";       // Componente hijo
import TablaViaticos from "./TablaViaticos";
import "../../../public/styles/ViaticosMapa.css";

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

  const isAdmin = (state.userData?.rol || "").toLowerCase() === "admin";

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
        {isAdmin && (
          <button className="btn btn-outline" onClick={() => navigate("/admin/viaticos/liquidaciones")}>
            Ver Liquidaciones
          </button>
        )}
        <button className="btn btn-danger" onClick={handlers.handleLogout}>
          Logout
        </button>
      </div>

      {/* 2. Tabla de Viáticos (Debajo de los botones) */}
      <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap", background: "#f8fafc", padding: "15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: "1 1 300px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Buscar:</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="Empleado o Cliente..."
            style={{ width: "100%", padding: "8px" }}
            value={state.busqueda}
            onChange={(e) => setters.setBusqueda(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Estado:</label>
          <select 
            className="form-control" 
            style={{ width: "150px", padding: "8px" }}
            value={state.filtroEstado}
            onChange={(e) => setters.setFiltroEstado(e.target.value)}
          >
            <option value="Todos">Todos</option>
            <option value="Activo">Activos</option>
            <option value="Cerrado">Cerrados</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Desde:</label>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: "160px", padding: "8px" }}
            value={state.filtroFechaInicio}
            onChange={(e) => setters.setFiltroFechaInicio(e.target.value)}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontWeight: "600", fontSize: "14px", color: "#475569" }}>Hasta:</label>
          <input 
            type="date" 
            className="form-control" 
            style={{ width: "160px", padding: "8px" }}
            value={state.filtroFechaFin}
            onChange={(e) => setters.setFiltroFechaFin(e.target.value)}
          />
        </div>

        <button 
          className="btn btn-outline" 
          style={{ padding: "8px 15px", fontSize: "13px" }}
          onClick={() => {
            setters.setFiltroEstado("Activo");
            setters.setFiltroFechaInicio("");
            setters.setFiltroFechaFin("");
            setters.setBusqueda("");
          }}
        >
          Limpiar Filtros
        </button>
      </div>

      <TablaViaticos 
        filtroEstado={state.filtroEstado} 
        filtroFechaInicio={state.filtroFechaInicio}
        filtroFechaFin={state.filtroFechaFin}
        busqueda={state.busqueda}
      />

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
                <div className="alert-warning">``
                  <h3 style={{ marginTop: 0 }}>Conflicto de Disponibilidad!</h3>
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

              {/* Mapa (Solo se muestra si ya se trazó la ruta) */}
              {state.rutaCoords.length > 0 && (
                <MapaHonduras 
                  rutaCoords={state.rutaCoords} 
                  peajesCruzados={state.peajesCruzados} 
                />
              )}

              {/* Resultados */}
              <PanelResultados 
                state={state} 
                setters={setters} 
                calculos={calculos} 
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-outlinecancel" onClick={handlers.handleCloseModal}>
                Cancelar
              </button>
              <button 
                className="btn btn-primarycancel" 
                onClick={async () => {
                  await handlers.registrarViatico();
                }}
                disabled={state.cargandoRegistro || state.cargandoEdicion || state.conflictosDisponibilidad.length > 0}
              >
                {state.cargandoRegistro ? "Guardando..." : (state.cargandoEdicion ? "Cargando..." : (state.isEditing ? "Editar" : "Guardar"))}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}