import * as XLSX from 'xlsx';

/**
 * Exporta los datos de un viático a un archivo de Excel.
 * @param {object} viaticoData - Los datos del formulario del viático.
 * @param {string} fileName - El nombre del archivo a generar (sin extensión).
 */
export function exportToExcel(viaticoData, fileName = 'reporte_viatico') {
  // 1. Estructurar los datos en un formato de "etiqueta" y "valor"
  const dataForSheet = [
    { label: 'Empleado', value: viaticoData.nombre_empleado },
    { label: 'Cliente', value: viaticoData.cliente },
    { label: 'Origen', value: viaticoData.origen },
    { label: 'Destino', value: viaticoData.destino },
    { label: 'Fecha y Hora de Salida', value: viaticoData.fecha_salida },
    { label: 'Fecha y Hora de Regreso', value: viaticoData.fecha_regreso },
    { label: 'Distancia Estimada (km)', value: viaticoData.distancia_km },
    { label: 'Costo Total de Peajes (Lps)', value: viaticoData.costo_peajes },
    { label: 'Total de Alimentos (Lps)', value: viaticoData.total_alimentos },
    { label: 'Costo de Hospedaje (Lps)', value: viaticoData.costo_hospedaje },
    { label: 'Costo de Combustible (Lps)', value: viaticoData.costo_combustible },
    { label: 'Costo de Imprevistos (Lps)', value: viaticoData.costo_imprevistos },
    { label: '------------------', value: '------------------' },
    { label: 'TOTAL GENERAL (Lps)', value: viaticoData.total_general },
  ];

  // 2. Crear una hoja de cálculo a partir de los datos
  const worksheet = XLSX.utils.json_to_sheet(dataForSheet, {
    header: ['label', 'value'], // Usar nuestras propiedades como cabecera
    skipHeader: true, // No incluir una fila de cabecera "label" y "value"
  });

  // 3. Ajustar el ancho de las columnas para que se vea bien
  worksheet['!cols'] = [{ wch: 30 }, { wch: 30 }];

  // 4. Crear un nuevo libro de trabajo y añadir la hoja
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Viatico');

  // 5. Generar el archivo y forzar la descarga en el navegador
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
