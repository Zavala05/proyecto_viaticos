import React from "react";

export default function FormularioDatos({ state, setters, handlers }) {
  return (
    <div className="seccion-formulario">
      {/* 1. Fila de Empleado y Cliente */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Empleado</label>
          <select
            value={state.empleado}
            onChange={(e) => setters.setEmpleado(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          >
            <option value="" disabled>-- Seleccione un empleado --</option>
            {state.empleados.map((emp) => (
              <option key={emp.id_usuario || emp.id} value={emp.nombre}>
                {emp.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
                  <label style={{ display: "block", marginBottom: 8 }}>Cliente</label>
                  <select
                    value={state.cliente}
                    onChange={(e) => setters.setCliente(e.target.value)}
                    style={{ width: "100%", padding: 8 }}
                    required
                  >
                    <option value="" disabled>-- Seleccione un cliente --</option>
                    {state.clientes.map((cli) => (
                      <option key={cli.id} value={cli.nombre}>
                        {cli.nombre}
                      </option>
                    ))}
                  </select>
                </div>

        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Motivo del viaje</label>
          <input
            type="text"
            value={state.motivoViaje}
            onChange={(e) => setters.setMotivoViaje(e.target.value)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>

       
      </div>

      {/* 2. Fila de Origen, Destino y Botón del Mapa */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "16px", alignItems: "end", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Origen</label>
          <select
            value={state.origen}
            onChange={(e) => setters.setOrigen(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          >
            <option value="Tegucigalpa">Tegucigalpa</option>
            <option value="San Pedro Sula">San Pedro Sula</option>
          </select>
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Destino (ATM)</label>
          <select
            value={state.destino}
            onChange={(e) => setters.setDestino(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          >
            <option value="" disabled>-- Seleccione un ATM de destino --</option>
            {state.atms.map((atm) => (
              <option key={atm.id} value={atm.nombre}>
                {atm.nombre}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handlers.calcularRuta}
          disabled={state.cargando}
          style={{
            padding: "10px 20px",
            backgroundColor: "#0f172a",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: state.cargando ? "wait" : "pointer",
          }}
        >
          {state.cargando ? "Calculando..." : "Trazar Ruta"}
        </button>
      </div>

      {/* 3. Fila de Fechas y Costos Manuales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px", alignItems: "end", marginTop: "16px" }}>
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Fecha y hora de salida</label>
          <input
            type="datetime-local"
            value={state.salida}
            onChange={(e) => setters.setSalida(e.target.value)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
        
        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Fecha y hora de regreso</label>
          <input
            type="datetime-local"
            value={state.regreso}
            onChange={(e) => setters.setRegreso(e.target.value)}
            min={state.salida}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center", height: "40px" }}>
          <input
            id="contarDesayuno"
            type="checkbox"
            checked={state.contarDesayuno}
            onChange={(e) => setters.setContarDesayuno(e.target.checked)}
          />
          <label htmlFor="contarDesayuno">Contar desayunos</label>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Hospedaje (Lps)</label>
          <input
            type="text"
            inputMode="decimal"
            value={state.costoHospedaje}
            onChange={setters.handleCurrencyChange(setters.setCostoHospedaje)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Combustible (Lps)</label>
          <input
            type="text"
            inputMode="decimal"
            value={state.combustible}
            onChange={setters.handleCurrencyChange(setters.setCombustible)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 8 }}>Imprevistos (Lps)</label>
          <input
            type="text"
            inputMode="decimal"
            value={state.imprevistos}
            onChange={setters.handleCurrencyChange(setters.setImprevistos)}
            style={{ width: "100%", padding: 8, boxSizing: "border-box" }}
          />
        </div>
      </div>
    </div>
  );
}