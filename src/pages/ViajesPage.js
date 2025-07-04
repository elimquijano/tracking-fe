import * as React from "react";
import { useState, useEffect } from "react";
import {
  Autocomplete,
  TextField,
  Select,
  MenuItem,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Grid,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DownloadIcon from "@mui/icons-material/Download";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getTraccar } from "../utils/common";
import { exportToExcel } from "../utils/exportToExcel";
import { columnsReportTraccarViajes } from "../utils/ExportColumns";
import { notificationSwal } from "../utils/swal-helpers";

const columns = [
  { id: "deviceId", label: "VEHICULO", minWidth: 170, key: 1 },
  { id: "startTime", label: "HORA DE INICIO", minWidth: 170, key: 2 },
  { id: "endTime", label: "HORA DE FIN", minWidth: 170, key: 3 },
  { id: "distance", label: "DISTANCIA", minWidth: 170, key: 4 },
  { id: "averageSpeed", label: "VELOCIDAD PROMEDIO", minWidth: 170, key: 5 },
  { id: "startOdometer", label: "ODOMETRO INICIAL", minWidth: 170, key: 6 },
  { id: "startAddress", label: "DIRECCION INICIAL", minWidth: 170, key: 7 },
  { id: "endOdometer", label: "ODOMETRO FINAL", minWidth: 170, key: 8 },
  { id: "endAddress", label: "DIRECCION FINAL", minWidth: 170, key: 9 },
  { id: "maxSpeed", label: "VELOCIDAD MAXIMA", minWidth: 170, key: 10 },
  { id: "duration", label: "DURACION", minWidth: 170, key: 11 },
  { id: "spentFuel", label: "COMBUSTIBLE GASTADO", minWidth: 170, key: 12 },
  { id: "driverName", label: "CONDUCTOR", minWidth: 170, key: 13 },
];

const MostrarCalle = ({ row }) => {
  const [calle, setCalle] = useState("");

  const handleClick = async () => {
    const response = await getTraccar(
      `server/geocode?latitude=${row.endLat}&longitude=${row.endLon}`
    );
    if (response) {
      setCalle(response.data);
    } else {
      setCalle("No se pudo obtener la dirección");
    }
  };

  return (
    <>
      {calle ? (
        <Typography>{calle}</Typography>
      ) : (
        <Button onClick={handleClick}>Mostrar Calle</Button>
      )}
    </>
  );
};

export const ViajesPage = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [searchFilter, setSearchFilter] = useState({ date_filter: "today" });
  const [data, setData] = useState([]);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const result = await getTraccar("/devices");
        if (result.status == 200) {
          setVehiculos(result.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchVehiculos();
  }, []);

  async function SearchFilter() {
    if (!searchFilter.deviceId && !searchFilter.groupId) {
      notificationSwal("error", "Debe seleccionar un dispositivo o un grupo");
      return;
    }

    const { from, to } = calculateDateRange(searchFilter.date_filter);

    try {
      const result = await getTraccar(
        "/reports/trips" + construirUrl({ ...searchFilter, from: from, to: to })
      );
      if (result.status == 200) {
        const dataParsed = result.data.map((item) => ({
          ...item,
          startTime: restarCincoHoras(item.startTime),
          endTime: restarCincoHoras(item.endTime),
          deviceId: vehiculos.find((vehiculo) => vehiculo.id === item.deviceId)
            ?.name,
          distance: (item.distance / 1000).toFixed(2) + " km",
          averageSpeed: (item.averageSpeed * 1.852).toFixed(2) + " km/h",
          maxSpeed: (item.maxSpeed * 1.852).toFixed(2) + " km/h",
          startOdometer: (item.startOdometer / 1000).toFixed(2) + " km",
          endOdometer: (item.endOdometer / 1000).toFixed(2) + " km",
          duration: formatDuration(item.duration),
        }));
        setData(dataParsed);
        if (dataParsed.length === 0) {
          notificationSwal("info", "No se encontraron datos");
        }
      }
    } catch (error) {
      notificationSwal("error", error);
    }
  }

  useEffect(() => {
    setTotalItems(data.length);
  }, [data]);

  const construirUrl = (params) => {
    const queryParts = []; // Array para almacenar las partes de la consulta

    // Iterar sobre las propiedades del objeto params
    for (const key in params) {
      if (params[key] !== undefined && params[key] !== null) {
        // Verifica que el valor no sea undefined o null
        queryParts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
        ); // Agrega el parámetro codificado
      }
    }

    return queryParts.length > 0 ? `?${queryParts.join("&")}` : ""; // Devuelve la cadena de consulta
  };

  function CleanFilter() {
    setData([]);
    setSearchFilter({ date_filter: "today" });
  }

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    const cleanedValue = value.trim();
    setSearchFilter((prevSearch) => ({
      ...prevSearch,
      [name]: cleanedValue,
    }));
  };

  const ExportFilter = async () => {
    try {
      const dataParse = data.map((item) => ({
        ...item,
      }));
      exportToExcel(dataParse, columnsReportTraccarViajes, "Viajes");
    } catch (error) {
      console.error("Error al exportar los datos:", error);
    }
  };

  const calculateDateRange = (dateFilter) => {
    const todayReference = new Date();
    let from, to;
    switch (dateFilter) {
      case "today":
        from = new Date(todayReference);
        from.setHours(0, 0, 0, 0);
        to = new Date(todayReference);
        to.setHours(23, 59, 59, 999);
        break;
      case "yesterday":
        from = new Date(todayReference); // Empezar con una copia fresca
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(from); // 'to' se basa en la fecha de 'from' (ayer)
        to.setHours(23, 59, 59, 999);
        break;
      case "this_week":
        from = new Date(todayReference);
        from.setDate(from.getDate() - (from.getDay() || 7) + 1);
        from.setHours(0, 0, 0, 0);

        to = new Date(from); // 'to' comienza desde el Lunes calculado
        to.setDate(to.getDate() + 6); // Sumar 6 días para llegar al Domingo
        to.setHours(23, 59, 59, 999);
        break;
      case "prev_week":
        from = new Date(todayReference);
        // Ir al Lunes de la semana actual y luego restar 7 días
        from.setDate(from.getDate() - (from.getDay() || 7) + 1 - 7);
        from.setHours(0, 0, 0, 0);

        to = new Date(from); // 'to' comienza desde el Lunes de la semana pasada
        to.setDate(to.getDate() + 6); // Sumar 6 días para llegar al Domingo de la semana pasada
        to.setHours(23, 59, 59, 999);
        break;
      case "this_month":
        from = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth(),
          1
        );
        // from.setHours(0,0,0,0) es implícito por el constructor
        to = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth() + 1,
          0
        ); // El día 0 del mes siguiente es el último día del mes actual
        to.setHours(23, 59, 59, 999);
        break;
      case "prev_month":
        from = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth() - 1,
          1
        );
        // from.setHours(0,0,0,0) es implícito
        to = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth(),
          0
        ); // El día 0 del mes actual es el último día del mes anterior
        to.setHours(23, 59, 59, 999);
        break;
      default: // Por defecto, se comporta como "today"
        from = new Date(todayReference);
        from.setHours(0, 0, 0, 0);
        to = new Date(todayReference);
        to.setHours(23, 59, 59, 999);
    }

    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  };

  const restarCincoHoras = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const date = new Date(dateString);
      const formatter = new Intl.DateTimeFormat("es-PE", {
        timeZone: "America/Lima",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      return formatter.format(date);
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return "Error en fecha";
    }
  };

  const formatDuration = (duration) => {
    const totalSeconds = Math.floor(duration / 1000); // Convertir milisegundos a segundos
    const hours = Math.floor(totalSeconds / 3600); // Calcular horas
    const minutes = Math.floor((totalSeconds % 3600) / 60); // Calcular minutos

    return `${hours} h ${minutes} m`; // Formatear la cadena de salida
  };

  return (
    <Box>
      <Paper className="form" sx={{ padding: 2, marginBottom: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={9}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography mb={1}>Vehículo:</Typography>
                <Autocomplete
                  size="small"
                  fullWidth
                  options={vehiculos}
                  getOptionLabel={(option) => option.name}
                  onChange={(event, newValue) => {
                    setSearchFilter({
                      ...searchFilter,
                      deviceId: newValue ? newValue.id : "",
                    });
                  }}
                  value={
                    vehiculos.find((d) => d.id === searchFilter.deviceId) ||
                    null
                  }
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography mb={1}>Periodo:</Typography>
                <Select
                  id="date_filter"
                  name="date_filter"
                  fullWidth
                  size="small"
                  onChange={handleSearchChange}
                  value={searchFilter.date_filter || ""}
                >
                  <MenuItem value="today">Hoy</MenuItem>
                  <MenuItem value="yesterday">Ayer</MenuItem>
                  <MenuItem value="this_week">Esta semana</MenuItem>
                  <MenuItem value="prev_week">Semana Anterior</MenuItem>
                  <MenuItem value="this_month">Este mes</MenuItem>
                  <MenuItem value="prev_month">Mes Anterior</MenuItem>
                </Select>
              </Grid>
            </Grid>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Grid container spacing={1}>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={SearchFilter}
                  startIcon={<SearchIcon />}
                >
                  BUSCAR
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="warning"
                  fullWidth
                  onClick={ExportFilter}
                  startIcon={<DownloadIcon />}
                >
                  EXPORTAR
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="error"
                  fullWidth
                  onClick={CleanFilter}
                  startIcon={<CleaningServicesIcon />}
                >
                  LIMPIAR
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {totalItems > 0 ? (
          <TableContainer>
            <Table stickyHeader aria-label="sticky table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.key} align={column.align}>
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align}
                        sx={{ position: "relative" }}
                      >
                        {column.id === "course" ? (
                          <Box
                            position="absolute"
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              transform: `translate(-50%, -50%) rotate(${
                                row[column.id] + 90 || 0
                              }deg)`,
                            }}
                          >
                            <ArrowBackIcon color="secondary" />
                          </Box>
                        ) : column.id === "endAddress" ? (
                          <MostrarCalle row={row} />
                        ) : (
                          row[column.id]
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box p={2} bgcolor="warning.light" color="warning.contrastText">
            <Typography>No se encontraron resultados.</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};
