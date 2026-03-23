import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { parseDateTime, countMeals, countNights } from "./calculos.js";
import { 
  show, showclients, getAtms, ObtenerViaticoById, 
  ActualizarViatico, VerificarDisponibilidad 
} from "../../service/auth.service.js";

// Importaremos las constantes desde el archivo que crearemos en el siguiente paso
import { PEAJES_GPS, PRECIO_FIJO_PEAJE, calcularDistanciaGPS } from "./viaticosConstans.js";

const API_URL = "http://localhost:3000/api/viaticos";

export const useViaticosLogic = (viaticosId, setUser, onSuccess) => {
  const navigate = useNavigate();
  const isEditing = !!viaticosId;

  // ================= ESTADOS =================
  const [empleado, setEmpleado] = useState("");
  const [cliente, setCliente] = useState("");
  const [motivoViaje, setMotivoViaje] = useState("");
  const [origen, setOrigen] = useState("Tegucigalpa");
  const [destino, setDestino] = useState(""); // Ajustado para que por defecto pida un ATM
  const [salida, setSalida] = useState("");
  const [regreso, setRegreso] = useState("");
  const [contarDesayuno, setContarDesayuno] = useState(true);
  
  const [costoHospedaje, setCostoHospedaje] = useState("");
  const [combustible, setCombustible] = useState("");
  const [imprevistos, setImprevistos] = useState("");
  
  const [empleados, setEmpleados] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [atms, setAtms] = useState([]);
  
  const [cargandoEdicion, setCargandoEdicion] = useState(isEditing);
  const [conflictosDisponibilidad, setConflictosDisponibilidad] = useState([]);
  const [verificandoDisponibilidad, setVerificandoDisponibilidad] = useState(false);

  const [rutaCoords, setRutaCoords] = useState([]);
  const [peajesCruzados, setPeajesCruzados] = useState([]);
  const [costoPeajes, setCostoPeajes] = useState(0);
  const [distanciaTotal, setDistanciaTotal] = useState("");
  const [cargando, setCargando] = useState(false);
  const [cargandoRegistro, setCargandoRegistro] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const [desayunosManual, setDesayunosManual] = useState(0);
  const [almuerzosManual, setAlmuerzosManual] = useState(0);
  const [cenasManual, setCenasManual] = useState(0);
  const [nochesManual, setNochesManual] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState("Activo");

  const { logout, userData, checkingSession, hasPermiso } = useAuth();

  // ================= PERMISOS =================
  const isAdmin = (userData?.rol || "").toLowerCase() === "admin";
  const can = useCallback((p) => isAdmin || hasPermiso(p), [isAdmin, hasPermiso]);
  const canView = can("ver_usuarios");
  const canViewClients = can("ver_companias");

  // ================= FUNCIONES DE UTILIDAD =================
  const limpiarFormulario = () => {
    setEmpleado(""); setCliente(""); setMotivoViaje(""); setOrigen("Tegucigalpa"); setDestino("");
    setSalida(""); setRegreso(""); setContarDesayuno(true);
    setCostoHospedaje(""); setCombustible(""); setImprevistos("");
    setDesayunosManual(0); setAlmuerzosManual(0); setCenasManual(0); setNochesManual(0);
    setRutaCoords([]); setPeajesCruzados([]); setCostoPeajes(0); setDistanciaTotal("");
  };

  const handleCurrencyChange = (setter) => (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) setter(value);
  };

  // ================= EFECTOS (USE EFFECT) =================

  // 1. Cargar datos iniciales (Empleados, Clientes, ATMs)
  const load = useCallback(async () => {
    if (checkingSession) return;
    if (canView) {
      try { const usersRes = await show(); setEmpleados(Array.isArray(usersRes) ? usersRes : []); } 
      catch (err) { console.log(err?.message); }
    }
    if (canViewClients) {
      try { const clientsRes = await showclients(); setClientes(Array.isArray(clientsRes) ? clientsRes : []); } 
      catch (err) { console.log(err?.message); }
    }
    try { const atmsRes = await getAtms(); setAtms(Array.isArray(atmsRes) ? atmsRes : []); } 
    catch (err) { console.log(err?.message); }
  }, [checkingSession, canView, canViewClients]);

  useEffect(() => { load(); }, [load]);

  // 2. Cargar viático para edición
  useEffect(() => {
    if (isEditing && viaticosId) {
      setShowModal(true); // Abrimos el modal si estamos editando
      const toInputDateTime = (v) => {
        if (!v) return "";
        if (typeof v === "string") {
          let s = v.trim().replace(" ", "T").replace(/Z$/, "");
          if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.substring(0, 16);
        }
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return "";
        const pad = (n) => String(n).padStart(2, "0");
        const y = d.getFullYear();
        const m = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const hh = pad(d.getHours());
        const mm = pad(d.getMinutes());
        return `${y}-${m}-${day}T${hh}:${mm}`;
      };
      const cargarViatico = async () => {
        try {
          const data = await ObtenerViaticoById(viaticosId);
          if (data) {
            setEmpleado(data.nombre_empleado || ""); setCliente(data.cliente || ""); setMotivoViaje(data.motivo_viaje || "");
            setOrigen(data.origen || "Tegucigalpa"); setDestino(data.destino || "");
            setSalida(toInputDateTime(data.fecha_salida));
            setRegreso(toInputDateTime(data.fecha_regreso));
            setCostoHospedaje(data.costo_hospedaje || ""); setCombustible(data.costo_combustible || "");
            setImprevistos(data.costo_imprevistos || "");
            setDesayunosManual(data.desayunos_count || 0); setAlmuerzosManual(data.almuerzos_count || 0);
            setCenasManual(data.cenas_count || 0); setNochesManual(data.noches_count || 0);
            setDistanciaTotal(`${data.distancia_km} km`); setCostoPeajes(data.costo_peajes || 0);
            setPeajesCruzados(data.casetas ? (typeof data.casetas === 'string' ? data.casetas.split(", ") : data.casetas) : []);
          } else {
            alert("Viático no encontrado"); navigate("/");
          }
        } catch (err) {
          console.error("Error cargando viático:", err); alert("Error cargando el viático"); navigate("/admin/ver_viaticos");
        } finally {
          setCargandoEdicion(false);
        }
      };
      cargarViatico();
    } else {
      setCargandoEdicion(false);
    }
  }, [isEditing, viaticosId, navigate]);

  // 3. Actualizar comidas y noches al cambiar fechas
  useEffect(() => {
    const s = parseDateTime(salida); const r = parseDateTime(regreso);
    const meals = countMeals(s, r); const noches = countNights(s, r);
    setDesayunosManual(contarDesayuno ? meals.desayunos : 0);
    setAlmuerzosManual(meals.almuerzos); setCenasManual(meals.cenas); setNochesManual(noches);
  }, [salida, regreso, contarDesayuno]);

  // 4. Verificar disponibilidad del empleado
  useEffect(() => {
    const verificarDisp = async () => {
      if (isEditing || !empleado || !salida || !regreso) {
        setConflictosDisponibilidad([]); setVerificandoDisponibilidad(false); return;
      }
      setVerificandoDisponibilidad(true);
      try {
        const empleadoObj = empleados.find(e => e.nombre === empleado);
        if (!empleadoObj) return;
        const resultado = await VerificarDisponibilidad(empleadoObj.id_usuario, salida, regreso);
        setConflictosDisponibilidad(!resultado.disponible ? resultado.conflictos : []);
      } catch (error) {
        console.error("Error:", error); setConflictosDisponibilidad([]);
      } finally {
        setVerificandoDisponibilidad(false);
      }
    };
    verificarDisp();
  }, [empleado, salida, regreso, empleados, isEditing]);

  // ================= CÁLCULOS (USE MEMO) =================
  const calculos = useMemo(() => {
    const s = parseDateTime(salida); const r = parseDateTime(regreso);
    const noches = countNights(s, r);
    const totalAlimentos = (desayunosManual * 150) + (almuerzosManual * 200) + (cenasManual * 200);
    const totalHospedaje = Number(costoHospedaje || 0) * noches;
    const totalCombustible = Number(combustible || 0);
    const totalImprevistos = Number(imprevistos || 0);
    const totalGeneral = totalAlimentos + totalHospedaje + totalCombustible + totalImprevistos + (Number(costoPeajes || 0) * 2);
    
    return {
      desayunos: desayunosManual, almuerzos: almuerzosManual, cenas: cenasManual,
      noches, totalAlimentos, totalHospedaje, totalCombustible, totalImprevistos, totalGeneral,
    };
  }, [salida, regreso, contarDesayuno, costoHospedaje, combustible, costoPeajes, imprevistos, desayunosManual, almuerzosManual, cenasManual]);

  // ================= MANEJADORES DE ACCIÓN =================
  const obtenerCoordenadas = async (lugar) => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(lugar)}&count=10&language=es&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Error del servidor: ${res.status}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const resultadoHonduras = data.results.find((item) => item.country_code === "HN");
        if (resultadoHonduras) return { lat: resultadoHonduras.latitude, lng: resultadoHonduras.longitude };
      }
      return null;
    } catch (error) { return null; }
  };

  const calcularRuta = async () => {
    if (!origen || !destino) return;
    setCargando(true); setRutaCoords([]); setPeajesCruzados([]);
    try {
      const coordsOrigen = await obtenerCoordenadas(origen);
      const atmDestino = atms.find(atm => atm.nombre === destino);
      if (!coordsOrigen || !atmDestino) {
        alert("No se pudo encontrar la ubicación."); setCargando(false); return;
      }
      const coordsDestino = { lat: atmDestino.latitud, lng: atmDestino.longitud };
      const urlRuta = `https://router.project-osrm.org/route/v1/driving/${coordsOrigen.lng},${coordsOrigen.lat};${coordsDestino.lng},${coordsDestino.lat}?geometries=geojson&overview=full`;
      
      const resRuta = await fetch(urlRuta);
      const dataRuta = await resRuta.json();
      if (dataRuta.code !== "Ok") throw new Error("Fallo OSRM");

      const coordenadasInvertidas = dataRuta.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      setRutaCoords(coordenadasInvertidas);
      setDistanciaTotal(`${(dataRuta.routes[0].distance / 1000).toFixed(1)} km`);

      let peajesEncontrados = [];
      PEAJES_GPS.forEach((peaje) => {
        for (let i = 0; i < coordenadasInvertidas.length; i++) {
          const punto = coordenadasInvertidas[i];
          if (calcularDistanciaGPS(peaje.lat, peaje.lng, punto[0], punto[1]) < 2) {
            peajesEncontrados.push(peaje.nombre); break;
          }
        }
      });
      setPeajesCruzados(peajesEncontrados);
      setCostoPeajes(peajesEncontrados.length * PRECIO_FIJO_PEAJE);
    } catch (error) {
      alert("Hubo un error al calcular la ruta.");
    } finally {
      setCargando(false);
    }
  };

  const registrarViatico = async () => {
    if (!empleado || !cliente) { alert("Empleado y Cliente son obligatorios."); return; }
    
    // Nueva validación: Verificar que el cliente tenga un supervisor asignado
    const clienteObj = clientes.find(c => c.nombre === cliente);
    if (!clienteObj || !clienteObj.supervisor_id) {
      alert("El cliente seleccionado no tiene un supervisor asignado. No se puede registrar el viático.");
      return;
    }

    if (conflictosDisponibilidad.length > 0) { alert("Hay conflictos de disponibilidad."); return; }

    const formatForDb = (value) => {
      if (!value) return null;
      // datetime-local value is like "YYYY-MM-DDTHH:MM" (no seconds)
      // MySQL DATETIME expects "YYYY-MM-DD HH:MM:SS".
      const base = value.replace("T", " ");
      return base.length === 16 ? `${base}:00` : base;
    };

    setCargandoRegistro(true);
    try {
      const empleadoObj = empleados.find(e => e.nombre === empleado);
      if (!empleadoObj) return;

      const payload = {
        empleado_id: empleadoObj.id_usuario, nombre_empleado: empleado, cliente,
        motivo_viaje: motivoViaje || `Ruta ${origen} → ${destino}`,
        fecha_salida: formatForDb(salida),
        fecha_regreso: formatForDb(regreso),
        origen, destino, distancia_km: parseFloat((distanciaTotal || "0").replace(" km", "")) || 0,
        peajes_count: peajesCruzados.length, casetas: peajesCruzados, costo_peajes: Number(costoPeajes || 0),
        desayunos_count: calculos.desayunos, almuerzos_count: calculos.almuerzos,
        cenas_count: calculos.cenas, noches_count: calculos.noches, total_alimentos: calculos.totalAlimentos,
        costo_hospedaje: Number(costoHospedaje || 0), costo_combustible: Number(combustible || 0),
        costo_imprevistos: Number(imprevistos || 0), total_general: calculos.totalGeneral,
      };

      if (isEditing) {
        const response = await ActualizarViatico(viaticosId, payload);
        alert("Viático actualizado correctamente");
        setShowModal(false);
        navigate("/admin/viaticos");
      } else {
        const res = await fetch(API_URL, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
        });
        if (res.ok) { 
          alert("Viático registrado"); 
          limpiarFormulario(); 
          setShowModal(false);
          if (onSuccess) onSuccess();
        } 
        else alert("Error al registrar");
      }
    } catch (err) { alert("Error de red"); }
    finally { setCargandoRegistro(false); }
  };

  const handleLogout = useCallback(() => {
    if (window.confirm("¿Seguro que quieres cerrar sesión?")) {
      logout(); localStorage.clear(); sessionStorage.clear();
    }
  }, [logout]);

  const toggleModal = (val) => {
    if (val === false && !isEditing) {
      limpiarFormulario();
    }
    setShowModal(val);
  };

  const handleCloseModal = () => {
    if (isEditing) {
      navigate("/admin/viaticos");
    }
    toggleModal(false);
  };

  // Retornamos un objeto súper limpio para que la interfaz lo use
  // Retornamos un objeto súper limpio para que la interfaz lo use
  return {
    state: {
      empleado, cliente, motivoViaje, origen, destino, salida, regreso, contarDesayuno, costoHospedaje,
      combustible, imprevistos, empleados, clientes, atms, cargandoEdicion, 
      conflictosDisponibilidad, verificandoDisponibilidad, rutaCoords, peajesCruzados,
      costoPeajes, distanciaTotal, cargando, cargandoRegistro, desayunosManual, almuerzosManual, cenasManual, nochesManual, isEditing, showModal, userData,
      filtroEstado
    },
    setters: {
      setEmpleado, setCliente, setMotivoViaje, setOrigen, setDestino, setSalida, setRegreso, setContarDesayuno,
      setCostoHospedaje, setCombustible, setImprevistos, setDesayunosManual, setAlmuerzosManual,
      setCenasManual, setNochesManual, handleCurrencyChange, setShowModal, toggleModal, // <-- ¡Aquí agregamos toggleModal!
      setFiltroEstado
    },
    calculos,
    handlers: { calcularRuta, registrarViatico, handleLogout, handleCloseModal }
  };
};
