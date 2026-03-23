import ExcelJS from 'exceljs';

/**
 * Exporta una liquidación detallada a un archivo Excel.
 * @param {Object} liq - El objeto de la liquidación con sus detalles.
 */
export const exportLiquidacionToExcel = async (liq) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Gastos', {
      views: [{ showGridLines: true }],
      pageSetup: { orientation: 'landscape', paperSize: 9 }
    });

    // 1. CONFIGURACIÓN DE COLUMNAS (A = Categorías, B-H = Días, I = Totales)
    worksheet.columns = [
      { key: 'categoria', width: 32 }, // Col 1 (A)
      { key: 'dia1', width: 14 },      // Col 2 (B)
      { key: 'dia2', width: 14 },      // Col 3 (C) - Anaranjado
      { key: 'dia3', width: 14 },      // Col 4 (D)
      { key: 'dia4', width: 14 },      // Col 5 (E) - Anaranjado
      { key: 'dia5', width: 14 },      // Col 6 (F)
      { key: 'dia6', width: 14 },      // Col 7 (G) - Anaranjado
      { key: 'dia7', width: 25 },      // Col 8 (H)
      { key: 'total', width: 16 }      // Col 9 (I) - Anaranjado
    ];

    // Colores exactos
    const colors = {
      textBlue: 'FF0054A6',
      bgBlue: 'FF1F4E79',
      black: 'FF000000',
      orange: 'F5B27019', 
      white: 'FFFFFFFF'
    };

    // 2. ENCABEZADOS PRINCIPALES
    const titleRow1 = worksheet.addRow(['Tecnasa de Honduras']);
    titleRow1.getCell(1).font = { color: { argb: colors.textBlue }, size: 14, bold: true };

    const titleRow2 = worksheet.addRow(['Reporte de Gastos']);
    worksheet.mergeCells('A2:I2');
    const mainTitleCell = worksheet.getCell('A2');
    mainTitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bgBlue } };
    mainTitleCell.font = { color: { argb: colors.white }, size: 14, bold: true };
    mainTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    worksheet.addRow([`Nombre: ${liq.empleado_nombre || ''}`]);
    worksheet.addRow([`Semana que termina el (dd/mm/yy): ${liq.fecha_fin || ''}`]);
    worksheet.addRow([]); // Fila 5 vacía

    // 3. PREPARAR DATOS DE DÍAS (Extraer hasta 7 días)
    const detalles = Array.isArray(liq.detalle_diario) 
      ? liq.detalle_diario 
      : JSON.parse(liq.detalle_diario || '[]');

    const dias = [];
    for (let i = 0; i < 7; i++) {
      dias.push(detalles[i] || { dia: '', fecha: '', desayuno: 0, almuerzo: 0, cena: 0, hospedaje: 0 });
    }

    // 4. ENCABEZADO DE LA TABLA (Fila 6)
    const headerRow = worksheet.addRow([
      'Categoría de Gasto', 
      ...dias.map((d, index) => d.fecha ? `${index + 1}\n${d.fecha}` : `${index + 1}`), 
      'Totals'
    ]);
    headerRow.height = 30;
    
    headerRow.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.black } };
      cell.font = { color: { argb: colors.white }, bold: true };
      cell.alignment = { 
        horizontal: colNumber === 1 ? 'left' : (colNumber === 9 ? 'right' : 'center'), 
        vertical: 'middle', 
        wrapText: true 
      };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // --- FUNCIÓN AUXILIAR PARA DIBUJAR FILAS ---
    const addDataRow = (label, key, isGlobal = false, isSeparator = false, isBold = false) => {
      const rowData = [label];
      let rowTotal = 0;

      // Si es separador, se dibuja en blanco con bordes
      if (isSeparator) {
        const sepRow = worksheet.addRow(new Array(9).fill(''));
        sepRow.eachCell((cell) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
        return sepRow;
      }

      for (let i = 0; i < 7; i++) {
        let val = 0;
        if (!isGlobal && dias[i][key]) {
          val = Number(dias[i][key]);
        }
        rowData.push(val > 0 ? val.toFixed(2) : ''); 
        rowTotal += val;
      }

      if (isGlobal) {
        const globalVal = Number(liq[key] || 0);
        rowData.push(globalVal > 0 ? globalVal.toFixed(2) : '');
      } else {
        rowData.push(rowTotal > 0 ? rowTotal.toFixed(2) : '');
      }

      const newRow = worksheet.addRow(rowData);
      newRow.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        if (colNumber > 1 && cell.value !== '') {
          cell.alignment = { horizontal: 'right' };
        }
        // Aplicar color anaranjado a columnas 3, 5, 7 y 9
        if ([3, 5, 7, 9].includes(colNumber)) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.orange } };
        }
      });

      if (isBold) newRow.font = { bold: true };
      return newRow;
    };

    // 5. CONSTRUCCIÓN DE LA TABLA
    addDataRow('Factura de combustible', 'gasto_combustible', true); // Fila 7
    addDataRow('Vehículo propio Kms', 'kilometraje');               // Fila 8
    addDataRow('Peaje', 'gasto_peajes', true);                      // Fila 9
    addDataRow('Movilización diaria / Transporte', 'transporte_local'); // Fila 10
    addDataRow('Total transporte', 'total_transporte', false, false, true); // Fila 11
    
    addDataRow('', '', false, true); // Fila 12 (Separador EN BLANCO)

    addDataRow('Hospedaje', 'hospedaje'); // Fila 13
    addDataRow('Desayuno', 'desayuno');   // Fila 14
    addDataRow('Almuerzo', 'almuerzo');   // Fila 15
    addDataRow('Cena', 'cena');           // Fila 16
    
    // --- FÓRMULAS COLUMNA 9 (I) ---
    const rowSubComidas = addDataRow('Subtotal comidas', 'subtotal_comidas'); // Fila 17
    rowSubComidas.getCell(9).value = { formula: 'I14+I15+I16' };

    const rowTotHosp = addDataRow('Total hospedaje y comidas', 'total_hosp_comidas', false, false, true); // Fila 18
    rowTotHosp.getCell(9).value = { formula: 'I13+I14+I15+I16' };
    
    addDataRow('', '', false, true); // Fila 19 (Separador EN BLANCO)

    addDataRow('Suministros y equipos / Imprevistos', 'gasto_imprevistos', true); // Fila 20
    addDataRow('Gastos de representación', 'representacion');                     // Fila 21
    addDataRow('Total Otros', 'total_otros', false, false, true);                 // Fila 22

    // TOTAL POR DÍA (Fila Negra final - Fila 23)
    const rowTotalDia = worksheet.addRow(['Total por día']);
    let granTotal = 0;
    for (let i = 0; i < 7; i++) {
      const sumDia = Number(dias[i].desayuno || 0) + Number(dias[i].almuerzo || 0) + Number(dias[i].cena || 0) + Number(dias[i].hospedaje || 0);
      rowTotalDia.getCell(i + 2).value = sumDia > 0 ? sumDia.toFixed(2) : '';
      granTotal += sumDia;
    }
    granTotal += Number(liq.gasto_combustible || 0) + Number(liq.gasto_peajes || 0) + Number(liq.gasto_imprevistos || 0);
    rowTotalDia.getCell(9).value = granTotal.toFixed(2);

    rowTotalDia.eachCell((cell, colNumber) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.black } };
      cell.font = { color: { argb: colors.white }, bold: true };
      cell.alignment = { horizontal: colNumber === 1 ? 'left' : 'right' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 6. BLOQUE INFERIOR AJUSTADO (A:G para Propósito, H:I para Sumario)
    worksheet.addRow([]); // Fila 24 vacía
    
    // Fila 25: Cabeceras
    const row25 = worksheet.addRow(['Proposito viaje', '', '', '', '', '', '', 'Sumario', '']); 
    
    // Formato Cabecera "Proposito viaje" (A a G)
    worksheet.mergeCells(`A${row25.number}:G${row25.number}`);
    const propHeader = worksheet.getCell(`A${row25.number}`);
    propHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.black } };
    propHeader.font = { color: { argb: colors.white }, bold: true };
    propHeader.alignment = { horizontal: 'center' };
    propHeader.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // Formato Cabecera "Sumario" (H a I)
    worksheet.mergeCells(`H${row25.number}:I${row25.number}`);
    const sumHeader = worksheet.getCell(`H${row25.number}`);
    sumHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.black } };
    sumHeader.font = { color: { argb: colors.white }, bold: true };
    sumHeader.alignment = { horizontal: 'center' };
    sumHeader.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    // Valores para Cálculos del Sumario
    const asignacion = Number(liq.total_asignado || 0);
    const totalGastado = Number(liq.total_gastado || granTotal);
    const pdteEmpresa = totalGastado > asignacion ? (totalGastado - asignacion) : 0;
    const pdteEmpleado = asignacion > totalGastado ? (asignacion - totalGastado) : 0;

    // Función auxiliar para las filas del Sumario (H:I)
    const addSumarioData = (rowObj, label, value) => {
      const lblCell = rowObj.getCell(8); // H
      const valCell = rowObj.getCell(9); // I
      lblCell.value = label;
      valCell.value = Number(value).toFixed(2);
      
      lblCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      valCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.orange } };
      valCell.alignment = { horizontal: 'right' };
    };

    // Fila 26: Motivo de viaje (A:G) / Total Gastos (H:I)
    const row26 = worksheet.addRow([liq.motivo_viaje || 'Viaje a Bac', '', '', '', '', '', '', '', '']);
    worksheet.mergeCells(`A${row26.number}:G${row26.number}`);
    const propVal1 = worksheet.getCell(`A${row26.number}`);
    propVal1.alignment = { horizontal: 'center' };
    propVal1.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    addSumarioData(row26, 'Total gastos', totalGastado);

    // Fila 27: Ticket (A:G) / Asignación (H:I)
    const row27 = worksheet.addRow([`Ticket#LIQ - ${liq.codigo || '00141'}`, '', '', '', '', '', '', '', '']);
    worksheet.mergeCells(`A${row27.number}:G${row27.number}`);
    const propVal2 = worksheet.getCell(`A${row27.number}`);
    propVal2.alignment = { horizontal: 'center' };
    propVal2.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    addSumarioData(row27, 'Asignación de viaticos', asignacion);

    // Fila 28: Valor Pendiente Empresa (Sumario H:I)
    const row28 = worksheet.addRow([]);
    addSumarioData(row28, 'Valor pendiente empresa', pdteEmpresa);

    // Fila 29: Valor Pendiente Empleado (Sumario H:I)
    const row29 = worksheet.addRow([]);
    addSumarioData(row29, 'Valor pendiente empleado', pdteEmpleado);

    worksheet.addRow([]); // Fila 30 vacía

    // 7. SECCIÓN DE FIRMAS Y PIE DE PÁGINA
    const row31 = worksheet.addRow([
      'Preparado por: ', '', '', 
      `Fecha:  ${new Date().toLocaleDateString()}`, '', '', 
      'Aprobado por', '', 
      'Fecha: _______________'
    ]);
    row31.getCell(1).font = { bold: true };
    row31.getCell(4).font = { bold: true };
    row31.getCell(7).font = { bold: true };
    row31.getCell(9).font = { bold: true };

    worksheet.addRow([]); // Fila 32 vacía

    // Fila 33: Países (Centrado en todo el documento)
    const row33 = worksheet.addRow(['Panama - El Salvador - Nicaragua - Guatemala - Costa Rica - Honduras - Ecuador']);
    worksheet.mergeCells(`A${row33.number}:I${row33.number}`);
    row33.getCell(1).alignment = { horizontal: 'center' };

    // 8. GENERAR Y DESCARGAR ARCHIVO
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ReporteGastos_${liq.codigo || '000'}_${(liq.empleado_nombre || 'Empleado').replace(/\s/g, '')}.xlsx`;
    anchor.click();
    window.URL.revokeObjectURL(url);

  } catch (error) {
    console.error("Error exportando a excel:", error);
    throw error;
  }
};