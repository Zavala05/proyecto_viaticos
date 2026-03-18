import React from "react";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { CENTRO_HN, LIMITES_HONDURAS, PEAJES_GPS } from "./viaticosConstans";

// IMPORTANTE: A veces los iconos de Leaflet no cargan bien en React.
// Si los pines (marcadores azules) no se ven en tu mapa, avísame y te paso 
// un pequeño bloque de código extra para arreglarlo.

export default function MapaHonduras({ rutaCoords, peajesCruzados }) {
  return (
    <div 
      style={{ 
        height: "400px", 
        width: "100%", 
        marginTop: "20px", 
        borderRadius: "8px", 
        overflow: "hidden", 
        border: "1px solid #e2e8f0",
        position: "relative",
        zIndex: 0 // Esto evita que el mapa tape los menús desplegables
      }}
    >
      <MapContainer
        center={CENTRO_HN}
        zoom={7}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        maxBounds={LIMITES_HONDURAS}
        maxBoundsViscosity={1.0}
        minZoom={6}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Trazado de la ruta azul */}
        {rutaCoords && rutaCoords.length > 0 && (
          <Polyline 
            positions={rutaCoords} 
            color="#2563eb" 
            weight={5} 
            opacity={0.8} 
          />
        )}

        {/* Marcadores de los peajes */}
        {PEAJES_GPS.map((peaje) => {
          // Verificamos si este peaje en particular fue cruzado en la ruta actual
          const isCruzado = peajesCruzados.includes(peaje.nombre);
          
          return (
            <Marker key={peaje.id} position={[peaje.lat, peaje.lng]}>
              <Popup>
                <strong>{peaje.nombre}</strong><br />
                Estado: <span style={{ color: isCruzado ? "red" : "green", fontWeight: "bold" }}>
                  {isCruzado ? "Cruzado (Cobrado)" : "Fuera de ruta"}
                </span>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}