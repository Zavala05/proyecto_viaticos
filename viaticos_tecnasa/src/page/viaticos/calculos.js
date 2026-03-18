// calculos.js

// 1. Convertidor de fechas de texto a objetos Date
export const parseDateTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

// 2. Contador de noches de hospedaje
export const countNights = (salidaDate, regresoDate) => {
  if (!salidaDate || !regresoDate || regresoDate < salidaDate) return 0;
  
  // Reseteamos las horas para contar solo los días calendario
  const start = new Date(salidaDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(regresoDate);
  end.setHours(0, 0, 0, 0);

  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  
  return diffDays;
};

// 3. Calculadora automática de comidas según horarios
export const countMeals = (salidaDate, regresoDate) => {
  if (!salidaDate || !regresoDate || regresoDate < salidaDate) {
    return { desayunos: 0, almuerzos: 0, cenas: 0 };
  }

  let desayunos = 0;
  let almuerzos = 0;
  let cenas = 0;

  const start = new Date(salidaDate);
  const end = new Date(regresoDate);
  
  // Copia para iterar día por día
  let current = new Date(start);
  current.setHours(0, 0, 0, 0);
  
  const endDay = new Date(end);
  endDay.setHours(0, 0, 0, 0);

  while (current <= endDay) {
    const isFirstDay = current.getTime() === start.setHours(0,0,0,0);
    const isLastDay = current.getTime() === endDay.getTime();
    
    if (isFirstDay && isLastDay) {
      // Viaje de un solo día
      if (salidaDate.getHours() <= 8) desayunos++;
      if (salidaDate.getHours() <= 13 && regresoDate.getHours() >= 13) almuerzos++;
      if (regresoDate.getHours() >= 18) cenas++;
    } else if (isFirstDay) {
      // Día de salida
      if (salidaDate.getHours() <= 8) desayunos++;
      if (salidaDate.getHours() <= 13) almuerzos++;
      cenas++; 
    } else if (isLastDay) {
      // Día de regreso
      desayunos++;
      if (regresoDate.getHours() >= 13) almuerzos++;
      if (regresoDate.getHours() >= 19) cenas++;
    } else {
      // Días intermedios enteros en el destino
      desayunos++;
      almuerzos++;
      cenas++;
    }
    
    current.setDate(current.getDate() + 1);
  }

  return { desayunos, almuerzos, cenas };
};