import { showclients } from "../../service/auth.service";
import { useState, useEffect } from "react";

// Recibimos refreshTrigger. Cada vez que cambie, el useEffect se volverá a ejecutar.
export default function ShowClients({ refreshTrigger }) {
    const [clientes, setClientes] = useState([]);
    

    const mostrar_clientes = async () => {
        try {
            const res = await showclients();
            console.log("Respuesta al mostrar clientes:", res);
            setClientes(res);
        } catch(error) {
            console.log("Error al mostrar clientes:", error);
            // Evitamos que salte la alerta si el componente recién se monta y no hay datos
            console.error("No se pudieron cargar los clientes"); 
        }
    };

    useEffect(() => {
        mostrar_clientes();
    }, [refreshTrigger]); // <-- Aquí está la magia de la actualización automática

    return(
        <div>
            <div className="table-header-flex">
                <h2 className="section-title">Clientes Registrados</h2>
            </div>
            
            <div className="table-responsive">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Código</th>
                            <th>Descripción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {clientes.map((cliente, index) => (
                            <tr key={index} className="table-row">
                                <td className="fw-medium">{cliente.nombre}</td>
                                <td><span className="code-badge">{cliente.codigo}</span></td>
                                <td className="text-muted">{cliente.descripcion}</td>
                            </tr>
                        ))}
                        {clientes.length === 0 && (
                            <tr>
                                <td colSpan="3" className="empty-state">No hay clientes registrados aún.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}