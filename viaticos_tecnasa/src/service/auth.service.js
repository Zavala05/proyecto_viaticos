const API_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export async function login(username, password, code = null) {
  try {
    const payload = { username, password };
    if (code) {
      payload.code = code;
    }
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok)
      throw new Error(data?.error || data?.message || "Login failed");

    return data;
  } catch (err) {
    console.error("Login error:", err);
    throw err;
  }
}

export async function me() {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    // ¡ESTA ES LA LÍNEA MÁGICA QUE FALTA PARA QUE ENVÍE LA COOKIE!
    credentials: "include", 
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("No autenticado");
  }

  return res.json();
}

export async function logout() {
  try {
    // 2. Intentamos avisar al servidor, pero no esperamos por él para salir
    // Usamos un timeout corto para que la UI no se trabe si el servidor tarda
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
  } catch (error) {
    console.log("El servidor no respondió a tiempo, pero la sesión local ya fue borrada.");
  }
}

export async function register(nombre, email, username, password, rol, puesto, supervisor_id) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ nombre, email, username, password, rol, puesto, supervisor_id }),
  });
  console.log("Respuesta del registro (raw):", res);
  if(res.ok){
    return res.json();
  } else{
    console.log("Error al registrar usuario:", res.statusText);
  }
}


export async function show() {
  try {
    const res = await fetch(`${API_URL}/auth/usuarios`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      // Si la respuesta no es OK, lanzamos un error para que el catch lo maneje
      throw new Error(`Error al obtener usuarios: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Datos obtenidos:", data);
    return data;
  } catch (error) {
    console.error("Error en la función show:", error);
    // En caso de cualquier error, devolvemos un array vacío para evitar el .map is undefined
    return [];
  }
}

export async function getAtms() {
  try {
    const res = await fetch(`${API_URL}/atms`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      throw new Error(`Error al obtener ATMs: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error en la función getAtms:", error);
    return [];
  }
}

export async function addclient(nombre, codigo, descripcion, estatus, supervisor_id){
  const res = await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ nombre, codigo, descripcion, estatus, supervisor_id }),
  });
  console.log("Respuesta del registro (raw):", res);
  if(res.ok){
    return res.json();
  } else{
    console.log("Error al registrar cliente:", res.statusText);
  }
}


export async function showclients() {
  try {
    const res = await fetch(`${API_URL}/clientes`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      // Si la respuesta no es OK, lanzamos un error para que el catch lo maneje
      throw new Error(`Error al obtener clientes: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Datos obtenidos:", data);
    return data;
  } catch (error) {
    console.error("Error en la función showclients:", error);
    // En caso de cualquier error, devolvemos un array vacío para evitar el .map is undefined
    return [];
  }
}

//OBTENER VIATICOS
export async function ObtenerViaticos(){
  try{
    const res = await fetch(`${API_URL}/viaticos`,{
      method: "GET",
      headers: { "Content-Type": "application/json" }, // O getAuthHeaders() si ya lo arreglamos
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Error al obtener viaticos: ${res.statusText}`);
    }

    const result = await res.json(); // <-- Aquí recibes el objeto { success: true, data: [...] }
    
    // Aquí está la clave: retornamos result.data, no el objeto completo
    console.log("Datos desempaquetados:", result.data); 
    return result.data || []; 
    
  } catch (error) {
    console.error("Error en la función ObtenerViaticos:", error);
    return [];
  }
}

//OBTENER UN VIÁTICO POR ID
export async function ObtenerViaticoById(id){
  try{
    const res = await fetch(`${API_URL}/viaticos/${id}`,{
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Error al obtener viático: ${res.statusText}`);
    }

    const result = await res.json();
    return result.data || null; 
    
  } catch (error) {
    console.error("Error en la función ObtenerViaticoById:", error);
    return null;
  }
}

//ACTUALIZAR VIÁTICO
export async function ActualizarViatico(id, datos){
  try{
    const res = await fetch(`${API_URL}/viaticos/${id}`,{
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(datos),
    });

    if (!res.ok) {
      throw new Error(`Error al actualizar viático: ${res.statusText}`);
    }

    const result = await res.json();
    return result;
    
  } catch (error) {
    console.error("Error en la función ActualizarViatico:", error);
    throw error;
  }
}

//crear una nueva ubicación (ATM)
export async function crearubicacion(nombre, latitud, longitud){
  const res = await fetch(`${API_URL}/atms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ nombre, latitud, longitud }),
  });
  console.log("Respuesta del registro (raw):", res);
  if(res.ok){
    return res.json();
  } else{
    console.log("Error al registrar ubicación:", res.statusText);
  }
}

//OBTENER VIÁTICOS POR EMPLEADO
export async function ObtenerViaticosByEmpleado(empleado_id){
  try{
    const res = await fetch(`${API_URL}/viaticos/empleado/${empleado_id}`,{
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Error al obtener viáticos del empleado: ${res.statusText}`);
    }

    const result = await res.json();
    return result.data || []; 
  } catch (error) {
    console.error("Error en la función ObtenerViaticosByEmpleado:", error);
    return [];
  }
}

// OBTENER LIQUIDACIONES DEL EQUIPO (PARA SUPERVISORES)
export async function ObtenerLiquidacionesEquipo() {
  try {
    const res = await fetch(`${API_URL}/liquidaciones/equipo`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Error al obtener liquidaciones del equipo: ${res.statusText}`);
    }

    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Error en la función ObtenerLiquidacionesEquipo:", error);
    return [];
  }
}

// OBTENER TODAS LAS LIQUIDACIONES (PARA FINANZAS / ADMIN)
export async function ObtenerTodasLiquidaciones() {
  try {
    const res = await fetch(`${API_URL}/liquidaciones/todas`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Error al obtener todas las liquidaciones: ${res.statusText}`);
    }

    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Error en la función ObtenerTodasLiquidaciones:", error);
    return [];
  }
}

// APROBAR O RECHAZAR LIQUIDACIÓN
export async function ActualizarEstadoLiquidacion(id, estado, observaciones = null) {
  try {
    const res = await fetch(`${API_URL}/liquidaciones/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ estado, observaciones }),
    });

    if (!res.ok) {
      throw new Error(`Error al actualizar estado de liquidación: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error en la función ActualizarEstadoLiquidacion:", error);
    throw error;
  }
}

//VERIFICAR DISPONIBILIDAD DE EMPLEADO EN FECHAS
export async function VerificarDisponibilidad(empleado_id, fecha_salida, fecha_regreso){
  try{
    const viaticos = await ObtenerViaticosByEmpleado(empleado_id);
    
    // Convertir fechas a objetos Date para comparación
    const fechaSalida = new Date(fecha_salida);
    const fechaRegreso = new Date(fecha_regreso);
    
    // Buscar conflictos
    const conflictos = viaticos.filter(v => {
      const viaticSalida = new Date(v.fecha_salida);
      const viaticRegreso = new Date(v.fecha_regreso);
      
      // Hay conflicto si los períodos se solapan
      return (fechaSalida <= viaticRegreso && fechaRegreso >= viaticSalida);
    });
    
    return {
      disponible: conflictos.length === 0,
      conflictos: conflictos
    };
    
  } catch (error) {
    console.error("Error en la función VerificarDisponibilidad:", error);
    return {
      disponible: true,
      conflictos: []
    };
  }
}

//funcion para obtener mis viaticos
// src/service/auth.service.js
export async function getMisViaticos() {
  try {
    const res = await fetch(`${API_URL}/viaticos/mis-viaticos`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`Error al obtener mis viáticos: ${res.statusText}`);
    }

    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Error en getMisViaticos:", error);
    return [];
  }
}






