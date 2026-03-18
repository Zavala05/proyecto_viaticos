// viaticosConstants.js

export const PEAJES_GPS = [
  { id: "zambrano", nombre: "Peaje Zambrano", lat: 14.267324, lng: -87.391585 },
  {
    id: "siguatepeque",
    nombre: "Peaje Siguatepeque",
    lat: 14.567086,
    lng: -87.834017,
  },
  {
    id: "yojoa",
    nombre: "Peaje Yojoa (La Barca)",
    lat: 15.0306287,
    lng: -87.9305255,
  },
];

export const PRECIO_FIJO_PEAJE = 22;
export const CENTRO_HN = [14.0818, -87.2068]; // Coordenadas centrales de Honduras

export const LIMITES_HONDURAS = [
  [12.9, -89.4], // Esquina Suroeste
  [16.5, -83.1], // Esquina Noreste
];

// Fórmula matemática (Fórmula del semiverseno o Haversine) para medir distancias en línea recta
export function calcularDistanciaGPS(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radio de la Tierra en kilómetros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}