import { useState, useEffect } from "react";

export default function FormularioPractica() {
  // 1. LAS CAJITAS DE MEMORIA (ESTADOS)
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [usuarios, setUsuarios] = useState([]);
  
  // Lo llamaremos idEditando para que coincida con todo tu código
  const [idEditando, setIdEditando] = useState(null); 

  // Función para obtener los usuarios
  const obtenerusuarios = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/practica");
      const resul = await res.json();

      if (resul.success) {
        setUsuarios(resul.data);
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  useEffect(() => {
    obtenerusuarios();
  }, []);

  // 2. LA FUNCIÓN INTELIGENTE (POST / PUT)
  const guardarContacto = async (e) => {
    e.preventDefault();
    try {
      const paqueteDeDatos = {
        nombre_completo: nombre,
        telefono: telefono,
        parentesco: parentesco,
      };

      let url = "http://localhost:3000/api/practica";
      let metodoDeEnvio = "POST";

      if (idEditando !== null) {
        url = `http://localhost:3000/api/practica/${idEditando}`;
        metodoDeEnvio = "PUT";
      }

      const respuesta = await fetch(url, {
        method: metodoDeEnvio,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paqueteDeDatos),
      });

      const resultado = await respuesta.json();

      if (respuesta.ok) {
        alert(idEditando ? "¡Contacto actualizado!" : "¡Éxito! Contacto guardado.");
        
        // Limpiamos todo
        setNombre("");
        setTelefono("");
        setParentesco("");
        setIdEditando(null); 
        
        // CORREGIDO: Llamamos a la función con el nombre correcto
        obtenerusuarios(); 
      } else {
        alert("Hubo un problema: " + resultado.message);
      }
    } catch (error) {
      console.error("Error al enviar los datos:", error);
    }
  };

  // FUNCION PARA ELIMINAR USUARIOS
  const eliminar_usuario = async (id) => {
    const ventana_confirmacion = window.confirm("¿Estás seguro de querer eliminar este usuario?")
    if (!ventana_confirmacion) return;

    try{
      const respuesta = await fetch(`http://localhost:3000/api/practica/${id}`,{
        method: "DELETE",
      });

      const resultado = await respuesta.json();
      if (respuesta.ok){
        alert("CONTACTO ELIMINADO EXITOSAMENTE");
        obtenerusuarios();
      } else {
        alert("No se pudo eliminar: "+ resultado.message);
      }
    } catch(error) {
      console.log("Error al intentar eliminar: ", error);
    }
  }

  // 3. LA FUNCIÓN QUE PREPARA LA EDICIÓN
  const preparar_edicion = (usuario) => {
    // CORREGIDO: Se usan paréntesis, NO el signo de igual
    setNombre(usuario.nombre_completo);
    setTelefono(usuario.telefono);
    setParentesco(usuario.parentesco);
    setIdEditando(usuario.id);

    window.scrollTo(0, 0);
  }

  // 4. LA VISTA
  return (
    <div style={{ padding: "20px", maxWidth: "400px", margin: "0 auto", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Directorio de Práctica</h2>
      
      <form onSubmit={guardarContacto}>
        <div style={{ marginBottom: "10px" }}>
          <label>Nombre Completo:</label>
          <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Teléfono:</label>
          <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Parentesco:</label>
          <input type="text" value={parentesco} onChange={(e) => setParentesco(e.target.value)} required style={{ width: "100%", padding: "8px" }} />
        </div>

        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer", backgroundColor: idEditando ? "#eab308" : "#0f172a", color: "white", width: "100%", borderRadius: "4px" }}>
          {idEditando ? "Actualizar Contacto" : "Guardar Contacto"}
        </button>
      </form>

      <h1>Usuarios Registrados</h1>
      <table style={{ width: "100%", textAlign: "left" }}>
        <thead>
          <tr>
            <th>Nombre Completo</th>
            <th>Teléfono</th>
            <th>Parentesco</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td>{usuario.nombre_completo}</td>
              <td>{usuario.telefono}</td>
              <td>{usuario.parentesco}</td>
              <td>
                <button onClick={() => preparar_edicion(usuario)}>Editar</button>
                <button onClick={() => eliminar_usuario(usuario.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}