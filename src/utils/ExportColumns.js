export const columnsReportTraccarEventos = [
  { header: "VEHICULO", key: "deviceId", width: 30 },
  { header: "HORA FIJO", key: "eventTime", width: 30 },
  { header: "TIPO", key: "type", width: 30 },
  { header: "DATOS", key: "attributes", width: 30 },
  { header: "GEOCERCA", key: "geofenceId", width: 30 },
  { header: "MANTENIMIENTO", key: "maintenanceId", width: 30 },
];

export const columnsReportTraccarViajes = [
  { header: "VEHICULO", key: "deviceId", width: 30 },
  { header: "HORA DE INICIO", key: "startTime", width: 30 },
  { header: "HORA DE FIN", key: "endTime", width: 30 },
  { header: "DISTANCIA", key: "distance", width: 30 },
  { header: "VELOCIDAD PROMEDIO", key: "averageSpeed", width: 30 },
  { header: "ODOMETRO INICIAL", key: "startOdometer", width: 30 },
  { header: "DIRECCION INICIAL", key: "startAddress", width: 80 },
  { header: "ODOMETRO FINAL", key: "endOdometer", width: 30 },
  { header: "VELOCIDAD MAXIMA", key: "maxSpeed", width: 30 },
  { header: "DURACION", key: "duration", width: 30 },
  { header: "COMBUSTIBLE GASTADO", key: "spentFuel", width: 30 },
  { header: "CONDUCTOR", key: "driverName", width: 30 },
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
