import ExcelJS from 'exceljs';

const styles = {
  boldFont: { bold: true },
  redBoldFont: { bold: true, color: { argb: 'FFFF0000' } },
  centered: { vertical: 'middle', horizontal: 'center' },
  rightAligned: { vertical: 'middle', horizontal: 'right' },
  leftAligned: { vertical: 'middle', horizontal: 'left' },
  borderThin: { top: { style: 'thin', color: { argb: 'FF000000' } }, left: { style: 'thin', color: { argb: 'FF000000' } }, bottom: { style: 'thin', color: { argb: 'FF000000' } }, right: { style: 'thin', color: { argb: 'FF000000' } } },
  borderMediumOuter: { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }
};

function formatearFechaHora(fechaString) {
  if (!fechaString) return '';
  
  // Intentamos parsear manualmente para evitar desfases de zona horaria (UTC vs Local)
  try {
    const regex = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/;
    const match = String(fechaString).match(regex);
    
    if (match) {
      const [_, anio, mes, dia, hora24, min] = match;
      let hora = parseInt(hora24);
      const ampm = hora >= 12 ? 'P.M' : 'A.M';
      hora = hora % 12;
      hora = hora ? hora : 12;
      return `${hora}:${min} ${ampm} ${dia}-${mes}-${anio}`;
    }
  } catch (e) {
    console.error("Error parseando fecha en excel:", e);
  }

  // Fallback si el regex falla
  const date = new Date(fechaString);
  if (isNaN(date.getTime())) return fechaString; 
  let horas = date.getHours();
  let minutos = date.getMinutes();
  const ampm = horas >= 12 ? 'P.M' : 'A.M';
  horas = horas % 12;
  horas = horas ? horas : 12; 
  minutos = minutos < 10 ? '0' + minutos : minutos;
  const dia = date.getDate().toString().padStart(2, '0');
  const mes = (date.getMonth() + 1).toString().padStart(2, '0'); 
  const anio = date.getFullYear();
  return `${horas}:${minutos} ${ampm} ${dia}-${mes}-${anio}`;
}

function addSection(worksheet, systemRow, sectionLetter, sectionTitle, colHeaders, dataItems, minRows = 3) {
  let rIdx = systemRow;

  // 1. FILA DE ENCABEZADOS DE COLUMNA
  const rCols = worksheet.getRow(rIdx);
  rCols.getCell('A').value = sectionLetter; 
  rCols.getCell('B').value = sectionTitle;  
  rCols.getCell('C').value = colHeaders[0]; 
  rCols.getCell('D').value = colHeaders[1]; 
  
  worksheet.mergeCells(`E${rIdx}:F${rIdx}`);
  rCols.getCell('E').value = colHeaders[2]; 
  
  ['A','B','C','D','E','F'].forEach(c => {
    rCols.getCell(c).font = styles.boldFont;
    rCols.getCell(c).alignment = styles.centered;
    if (c !== 'A') rCols.getCell(c).border = styles.borderThin;
  });
  rCols.getCell('A').border = {}; 
  rIdx++;

  const startItemRow = rIdx;
  
  let safeDataItems = dataItems ? [...dataItems] : [];
  while(safeDataItems.length < minRows) {
    safeDataItems.push({ label: '', days: '', rate: '' });
  }
  
  // 2. FILAS DE DATOS
  safeDataItems.forEach((item, i) => {
      const rData = worksheet.getRow(rIdx++);
      rData.getCell('B').value = item.label;
      rData.getCell('C').value = item.days;
      rData.getCell('D').value = item.rate;
      
      // ¡AQUÍ ESTÁ LA MAGIA! 
      // Solo ponemos la 'L' y la fórmula si la fila tiene un título (ej. "Hotel" o "Desayuno")
      if (item.label !== '') {
          rData.getCell('E').value = 'L';
          const subTotalFormula = `IF(C${rIdx-1}<>0, C${rIdx-1}*D${rIdx-1}, "")`;
          rData.getCell('F').value = { formula: subTotalFormula };
      }

      rData.getCell('B').alignment = styles.leftAligned;
      ['C','D'].forEach(c => rData.getCell(c).alignment = styles.centered);
      ['E','F'].forEach(c => rData.getCell(c).alignment = styles.rightAligned);
      
      rData.getCell('D').numFmt = '#,##0.00';
      rData.getCell('F').numFmt = '#,##0.00';

      ['B','C','D','E','F'].forEach(c => rData.getCell(c).border = styles.borderThin);
  });

  // 3. FILA DE TOTAL
  const rTotal = worksheet.getRow(rIdx++);
  rTotal.getCell('E').value = 'L';
  rTotal.getCell('F').value = { formula: `SUM(F${startItemRow}:F${rIdx-2})` };
  
  rTotal.getCell('F').font = styles.boldFont;
  rTotal.getCell('F').numFmt = '#,##0.00';
  ['E','F'].forEach(c => rTotal.getCell(c).alignment = styles.rightAligned);
  ['E','F'].forEach(c => rTotal.getCell(c).border = styles.borderThin);
  
  worksheet.addRow([]); // Fila separadora en blanco
  return rIdx + 1;
}

// Agregamos customFormat = '#,##0.00' al final de los parámetros
function addOtherSection(worksheet, systemRow, sectionLetter, sectionTitle, headerC, headerD, dataItems, formulaBuilder, customFormat = '#,##0.00') {
    let rIdx = systemRow;

    // ... (El código de los encabezados se mantiene igual) ...
    const rCols = worksheet.getRow(rIdx);
    rCols.getCell('A').value = sectionLetter; 
    rCols.getCell('B').value = sectionTitle;  
    rCols.getCell('C').value = headerC; 
    rCols.getCell('D').value = headerD; 
    worksheet.mergeCells(`E${rIdx}:F${rIdx}`); 
    
    ['A','B','C','D','E','F'].forEach(c => {
        rCols.getCell(c).font = styles.boldFont;
        rCols.getCell(c).alignment = styles.centered;
        if (c !== 'A') rCols.getCell(c).border = styles.borderThin;
    });
    rIdx++;

    const startItemRow = rIdx;
    
    let safeDataItems = dataItems ? [...dataItems] : [];
    
    while(safeDataItems.length < 3) {
        safeDataItems.push({ cVal: '', dVal: '', isPadding: true });
    }
    
    safeDataItems.forEach((item, i) => {
        const rData = worksheet.getRow(rIdx++);
        
        if (i === 0) rData.getCell('B').value = sectionTitle;
        
        rData.getCell('C').value = item.cVal;
        rData.getCell('D').value = item.dVal;
        
        if (!item.isPadding) {
            rData.getCell('E').value = 'L';
            rData.getCell('F').value = { formula: formulaBuilder(rIdx - 1) };
        }

        rData.getCell('B').alignment = styles.leftAligned;
        ['C','D'].forEach(c => rData.getCell(c).alignment = styles.centered);
        ['E','F'].forEach(c => rData.getCell(c).alignment = styles.rightAligned);
        
        // ¡AQUÍ ESTÁ EL CAMBIO! Usamos customFormat en lugar del texto fijo
        ['C','D','F'].forEach(c => rData.getCell(c).numFmt = customFormat);
        
        ['B','C','D','E','F'].forEach(c => rData.getCell(c).border = styles.borderThin);
    });

    const rTotal = worksheet.getRow(rIdx++);
    rTotal.getCell('E').value = 'L';
    rTotal.getCell('F').value = { formula: `SUM(F${startItemRow}:F${rIdx-2})` };
    
    rTotal.getCell('F').font = styles.boldFont;
    
    // ¡AQUÍ TAMBIÉN! Usamos customFormat para el total
    rTotal.getCell('F').numFmt = customFormat;
    
    ['E','F'].forEach(c => rTotal.getCell(c).alignment = styles.rightAligned);
    ['E','F'].forEach(c => rTotal.getCell(c).border = styles.borderThin);
    
    worksheet.addRow([]);
    return rIdx + 1; 
}


export async function exportToExcel(viaticoData, fileName = 'hoja_calculo_viaticos') {
  const data = viaticoData || {};
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Hoja de Cálculo');

  // --- ANCHOS DE COLUMNA ---
  worksheet.getColumn('A').width = 4;
  worksheet.getColumn('B').width = 30; 
  worksheet.getColumn('C').width = 25; 
  worksheet.getColumn('D').width = 25; 
  worksheet.getColumn('E').width = 4;  
  worksheet.getColumn('F').width = 15; 

  // --- CABECERA ---
  worksheet.mergeCells('B1:F1');
  const titleCell = worksheet.getCell('B1');
  titleCell.value = 'HOJA DE CALCULO DE VIATICOS';
  titleCell.font = { bold: true, size: 14, underline: true };
  titleCell.alignment = styles.centered;

  worksheet.mergeCells('B2:F2');
  const paraCell = worksheet.getCell('B2');
  paraCell.value = `Para : ${data.nombre_empleado || 'No especificado'}`;
  paraCell.font = styles.boldFont;
  paraCell.alignment = styles.centered;

  worksheet.mergeCells('B3:F3');
  const divisionCell = worksheet.getCell('B3');
  divisionCell.value = {
    richText: [
      { text: 'Division: ', font: styles.redBoldFont },
      { text: 'SOL-FIN/ATM', font: styles.boldFont } 
    ]
  };
  divisionCell.alignment = styles.centered;

  let sysRow = 4; 

  worksheet.mergeCells(`B${sysRow}:F${sysRow}`);
  const rMission = worksheet.getCell(`B${sysRow}`);
  rMission.value = data.motivo_viaje || data.motivoViaje || 'MOTIVO NO ENCONTRADO';
  rMission.font = styles.boldFont;
  rMission.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  rMission.border = styles.borderMediumOuter; 
  worksheet.getRow(sysRow).height = 30;
  sysRow++;

  // --- FILA 5: FECHAS ---
  const rDateLabels = worksheet.getRow(sysRow++);
  rDateLabels.getCell('B').value = 'Fecha y Hora de Salida';
  rDateLabels.getCell('C').value = formatearFechaHora(data.fecha_salida);
  rDateLabels.getCell('D').value = 'Fecha y hora de Regreso';
  worksheet.mergeCells(`E${sysRow-1}:F${sysRow-1}`); 
  rDateLabels.getCell('E').value = formatearFechaHora(data.fecha_regreso);
  
  ['B','C','D','E','F'].forEach(c => {
      rDateLabels.getCell(c).alignment = styles.centered;
      rDateLabels.getCell(c).border = styles.borderThin;
  });
  rDateLabels.getCell('B').font = styles.boldFont;
  rDateLabels.getCell('D').font = styles.boldFont;


  // === AQUÍ GUARDAMOS LOS TOTALES DE CADA SECCIÓN ===
  let celdasTotales = [];

  // --- SECCIÓN A ---
  const datosAlimentacion = [
    { label: 'Desayuno', days: data.desayunos_count || 0, rate: 150 }, 
    { label: 'Almuerzo', days: data.almuerzos_count || 0, rate: 200 },
    { label: 'Cena', days: data.cenas_count || 0, rate: 200 }
  ];
  sysRow = addSection(worksheet, sysRow, 'A.', 'Alimentación', ['No. de días', 'Asignación por Día', 'Sub Total'], datosAlimentacion, 3);
  celdasTotales.push(`F${sysRow - 2}`); // Guardamos la coordenada del total

  // --- SECCIÓN B ---
  const datosHospedaje = [ { label: 'Hotel', days: data.noches_count || 0, rate: data.costo_hospedaje_diario || 0 } ];
  sysRow = addSection(worksheet, sysRow, 'B.', 'Hospedaje', ['No. de dias', 'Asignación por Día', 'Sub Total'], datosHospedaje, 4);
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN C ---
  const datosPeajes = [{ cVal: data.costo_peajes || 0, dVal: data.costo_peajes || 0 }]; // Reemplaza por variables reales después
  sysRow = addOtherSection(worksheet, sysRow, 'C.', 'Peajes', 'Ida', 'Regreso', datosPeajes, (row) => `SUM(C${row}:D${row})`);
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN D ---
 const datosCombustible = [
    { 
      cVal: data.costo_combustible / 2 || 0, // Ponemos el total en la "Ida"
      dVal: data.costo_combustible / 2 || 0    // Dejamos el "Regreso" en blanco
    }
  ];

  sysRow = addOtherSection(worksheet, sysRow, 'D.', 'Combustible', 'Ida', 'Regreso', datosCombustible, (row) => `SUM(C${row}:D${row})`);
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN E ---
  sysRow = addOtherSection(worksheet, sysRow, 'E.', 'Movilización # de Días', 'Asignación Diaria', 'Asignación Adicional', [], (row) => `SUM(C${row}:D${row})`);
  celdasTotales.push(`F${sysRow - 2}`);

  // --- SECCIÓN F ---
  const datosImprevisto = [{ cVal: data.noches_count = 1 || 0, dVal: data.costo_imprevistos || 0 }]; // Asumiendo que el número de días de imprevisto es igual al número de noches, y el costo total de imprevistos viene en data.total_imprevistos
  sysRow = addOtherSection(
      worksheet, 
      sysRow, 
      'F.', 
      'Imprevistos', 
      'Monto', 
      '', 
      datosImprevisto, 
      (row) => `C${row}*D${row}`,
      '#,##0' 
  );
  celdasTotales.push(`F${sysRow - 2}`);

  // ==========================================
  // --- FOOTER Y TOTALES FINALES ---
  // ==========================================
  const rowFooterStart = sysRow;

  // Cuadro de Advertencia
  worksheet.mergeCells(`A${rowFooterStart}:C${rowFooterStart + 6}`);
  const warningCell = worksheet.getCell(`A${rowFooterStart}`);
  warningCell.value = "Es obligatorio presentar la Liquidacion\nde Viaticos a mas tardar 5 dias despues\nde que concluye el viaje. Las\nliquidaciones que se presenten tarde o\nsea despues de 5 dias seran cargados\nal empleado y deducidos por planilla. Y\nse hara el reembolso hasta que\npresente la liquidacion.";
  warningCell.font = { bold: true, size: 9 };
  warningCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  warningCell.border = styles.borderMediumOuter;

  // Función para las filas de totales
  const pintarFilaTotal = (fila, titulo, formulaStr) => {
      const r = worksheet.getRow(fila);
      r.getCell('D').value = titulo;
      r.getCell('E').value = 'L';
      if (formulaStr) r.getCell('F').value = { formula: formulaStr };
      
      r.getCell('D').font = styles.boldFont;
      r.getCell('F').font = styles.boldFont;
      r.getCell('D').alignment = styles.rightAligned;
      ['E','F'].forEach(c => r.getCell(c).alignment = styles.rightAligned);
      r.getCell('F').numFmt = '#,##0.00';
      ['D','E','F'].forEach(c => r.getCell(c).border = styles.borderThin);
  };

  const formulaSumaTotal = celdasTotales.join('+'); // Une: F13+F20+F27...

  pintarFilaTotal(rowFooterStart + 1, 'TOTAL Viáticos a Empleado', formulaSumaTotal);
  pintarFilaTotal(rowFooterStart + 3, 'TOTAL Pago a Proveedores', '');
  pintarFilaTotal(rowFooterStart + 5, 'Valor TOTAL de este Viaje', `F${rowFooterStart + 1}+F${rowFooterStart + 3}`);
  
  sysRow = rowFooterStart + 7;

  // ==========================================
  // --- FIRMAS Y CHECKBOX ---
  // ==========================================
  worksheet.mergeCells(`B${sysRow}:C${sysRow}`);
  worksheet.getCell(`B${sysRow}`).value = 'El cliente pagará este viaje ?';
  worksheet.getCell(`B${sysRow}`).alignment = { horizontal: 'center', italic: true };
  sysRow++;

  worksheet.getCell('C'+sysRow).value = 'Si   X';
  worksheet.getCell('D'+sysRow).value = 'No';
  worksheet.getCell('C'+sysRow).alignment = styles.centered;
  worksheet.getCell('D'+sysRow).alignment = styles.centered;
  worksheet.getCell('C'+sysRow).border = styles.borderThin;
  worksheet.getCell('D'+sysRow).border = styles.borderThin;
  sysRow++;

  worksheet.mergeCells(`B${sysRow}:F${sysRow}`);
  worksheet.getCell(`B${sysRow}`).value = '* Si es afirmativo Contabilidad estará dando recibo por el valor reembolsable y el empleado a su regreso deberá traer cheque por el valor indicado en el recibo.';
  worksheet.getCell(`B${sysRow}`).font = { size: 9, italic: true };
  sysRow += 2; 

  worksheet.getCell(`B${sysRow}`).value = 'Aprobado:';
  worksheet.getCell(`B${sysRow}`).font = styles.boldFont;
  worksheet.getCell(`B${sysRow}`).alignment = styles.rightAligned;
  worksheet.mergeCells(`C${sysRow}:E${sysRow}`);
  worksheet.getCell(`C${sysRow}`).border = { bottom: styles.borderThin }; 
  sysRow++;

  worksheet.mergeCells(`C${sysRow}:E${sysRow}`);
  worksheet.getCell(`C${sysRow}`).value = 'Recursos Humanos';
  worksheet.getCell(`C${sysRow}`).font = styles.boldFont;
  worksheet.getCell(`C${sysRow}`).alignment = styles.centered;

  // --- EXPORTAR ---
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);  
}