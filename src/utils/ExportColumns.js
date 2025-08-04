export const columnsReportTraccarCombinado = [
  { header: 'VEHICULO', key: 'deviceName', width: 10 },
  { header: 'FECHA Y HORA', key: 'datetime', width: 30 },
  { header: 'TIPO DE EVENTO', key: 'type', width: 30 }
];

export const columnsReportTraccarRuta = [
  { header: 'VEHICULO', key: 'deviceId', width: 30 },
  { header: 'HORA FIJO', key: 'fixTime', width: 30 },
  { header: 'LATITUD', key: 'latitude', width: 30 },
  { header: 'LONGITUD', key: 'longitude', width: 30 },
  { header: 'VELOCIDAD', key: 'speed', width: 30 },
  { header: 'RUMBO', key: 'course', width: 30 },
  { header: 'ALTITUD', key: 'altitude', width: 30 },
  { header: 'VALIDO', key: 'valid', width: 30 },
  { header: 'PROTOCOLO', key: 'protocol', width: 30 },
  { header: 'HORA SERVIDOR', key: 'serverTime', width: 30 },
  { header: 'HORA DISPOSITIVO', key: 'deviceTime', width: 30 },
  { header: 'GEOCERCA', key: 'geofenceIds', width: 30 },
  { header: 'DISTANCIA', key: 'distance', width: 30 },
  { header: 'DISTANCIA TOTAL', key: 'totalDistance', width: 30 },
  { header: 'MOVIMIENTO', key: 'motion', width: 30 },
  { header: 'PRECISION', key: 'accuracy', width: 30 }
];

export const columnsReportTraccarEventos = [
  { header: "VEHICULO", key: "deviceId", width: 30 },
  { header: "HORA FIJO", key: "eventTime", width: 30 },
  { header: "TIPO", key: "type", width: 30 },
  { header: "DATOS", key: "attributes", width: 30 },
  { header: "GEOCERCA", key: "geofenceId", width: 30 },
  { header: "MANTENIMIENTO", key: "maintenanceId", width: 30 },
];

export const columnsReportTraccarViajes = [
  { header: 'VEHICULO', key: 'deviceId', width: 30 },
  { header: 'HORA DE INICIO', key: 'startTime', width: 30 },
  { header: 'HORA DE FIN', key: 'endTime', width: 30 },
  { header: 'DISTANCIA', key: 'distance', width: 30 },
  { header: 'VELOCIDAD PROMEDIO', key: 'averageSpeed', width: 30 },
  { header: 'ODOMETRO INICIAL', key: 'startOdometer', width: 30 },
  { header: 'DIRECCION INICIAL', key: 'startAddress', width: 80 },
  { header: 'ODOMETRO FINAL', key: 'endOdometer', width: 30 },
  { header: 'VELOCIDAD MAXIMA', key: 'maxSpeed', width: 30 },
  { header: 'DURACION', key: 'duration', width: 30 },
  { header: 'COMBUSTIBLE GASTADO', key: 'spentFuel', width: 30 },
  { header: 'CONDUCTOR', key: 'driverName', width: 30 }
];

export const columnsReportTraccarParadas = [
  { header: 'VEHICULO', key: 'deviceId', width: 30 },
  { header: 'HORA DE INICIO', key: 'startTime', width: 30 },
  { header: 'HORA DE FIN', key: 'endTime', width: 30 },
  { header: 'ODOMETRO FINAL', key: 'endOdometer', width: 30 },
  { header: 'DIRECCION', key: 'address', width: 30 },
  { header: 'DURACION', key: 'duration', width: 30 },
  { header: 'HORAS DE MOTOR', key: 'engineHours', width: 30 },
  { header: 'COMBUSTIBLE GASTADO', key: 'spendFuel', width: 30 }
];

export const columnsReportTraccarResumen = [
  { header: 'VEHICULO', key: 'deviceId', width: 30 },
  { header: 'HORA DE INICIO', key: 'startTime', width: 30 },
  { header: 'DISTANCIA', key: 'distance', width: 30 },
  { header: 'VELOCIDAD PROMEDIO', key: 'averageSpeed', width: 30 },
  { header: 'ODOMETRO INICIAL', key: 'startOdometer', width: 30 },
  { header: 'ODOMETRO FINAL', key: 'endOdometer', width: 30 },
  { header: 'VELOCIDAD MAXIMA', key: 'maxSpeed', width: 30 },
  { header: 'HORAS DE MOTOR', key: 'engineHours', width: 30 },
  { header: 'HORAS DE MOTOR EN MARCHA', key: 'engineHoursMoving', width: 30 },
  { header: 'HORAS DE MOTOR PARADO', key: 'engineHoursIdle', width: 30 },
  { header: 'COMBUSTIBLE GASTADO', key: 'spentFuel', width: 30 }
];

export const columnsTPositionsList = [
  { header: "Vehiculo", key: "name", width: 30 },
  { header: "Fecha y Hora", key: "deviceTime", width: 40 },
  { header: "Latitud", key: "latitude", width: 10 },
  { header: "Longitud", key: "longitude", width: 10 },
  { header: "Altitud", key: "altitude", width: 10 },
  { header: "Velocidad", key: "speed", width: 20 },
  { header: "Curso", key: "course", width: 10 },
  { header: "Atributos", key: "attributes", width: 120 },
];
