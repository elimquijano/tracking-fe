import * as React from "react";
import { useState, useEffect } from "react";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  TextField,
  Button,
  Grid,
  Box,
  Alert,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import DownloadIcon from "@mui/icons-material/Download";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTraccar } from "../../utils/common";
import { notificationSwal } from "../../utils/swal-helpers";
import { exportToExcel } from "../../utils/exportToExcel";
import { columnsReportTraccarCombinado } from "../../utils/ExportColumns";

const customIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/2776/2776067.png",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [1, -34],
});

const types = [
  { id: "allEvents", name: "Todos los eventos" },
  { id: "deviceOnline", name: "Dispositivo en línea" },
  { id: "deviceUnknown", name: "Dispositivo desconocido" },
  { id: "deviceOffline", name: "Dispositivo fuera de línea" },
  { id: "deviceStopped", name: "Dispositivo detenido" },
  { id: "deviceMoving", name: "Dispositivo en movimiento" },
  { id: "deviceOverspeed", name: "Dispositivo excediendo velocidad" },
  { id: "geofenceEnter", name: "Ingreso a geocerca" },
  { id: "geofenceExit", name: "Salida de geocerca" },
  { id: "alarm", name: "Alarma" },
  { id: "ignitionOn", name: "Encendido del motor" },
  { id: "ignitionOff", name: "Apagado del motor" },
  { id: "maintenance", name: "Mantenimiento" },
  { id: "commandResult", name: "Resultado de comando" },
  { id: "deviceFuelDrop", name: "Caída de combustible" },
  { id: "lowDCVoltage", name: "Bajo voltaje DC" },
  { id: "highDCVoltage", name: "Alto voltaje DC" },
  { id: "lowBatteryLevel", name: "Bajo nivel de batería" },
  { id: "hardAcceleration", name: "Aceleración brusca" },
  { id: "hardBraking", name: "Frenado brusco" },
  { id: "hardCornering", name: "Curva brusca" },
  { id: "powerCut", name: "Corte de energía" },
  { id: "powerRestored", name: "Energía restaurada" },
  { id: "tow", name: "Remolque" },
  { id: "immobilizer", name: "Inmovilización" },
  { id: "sos", name: "SOS" },
  { id: "noMovement", name: "Sin movimiento" },
  { id: "aggressiveDriving", name: "Conducción agresiva" },
  { id: "idling", name: "En espera" },
  { id: "accident", name: "Accidente" },
];

const columns = [
  { id: "deviceId", label: "VEHICULO", minWidth: 170, key: 1 },
  { id: "eventTime", label: "HORA AJUSTADA", minWidth: 170, key: 1 },
  { id: "type", label: "EVENTO", minWidth: 170, key: 1 },
];

export default function CombinadoPage() {
  const [vehiculos, setVehiculos] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [searchFilter, setSearchFilter] = useState({ date_filter: "today" });
  const [events, setEvents] = useState([]);
  const [positions, setPositions] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [mapKey, setMapKey] = useState(0);
  const [centerMap, setCenterMap] = useState([
    -9.935471539483416, -76.24764000722851,
  ]);
  const [zoomMap, setZoomMap] = useState(7);

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const result = await getTraccar("/devices");
        if (result.status === 200) {
          setVehiculos(result.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    const fetchGrupos = async () => {
      try {
        const result = await getTraccar("/groups");
        if (result.status === 200) {
          setGrupos(result.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchVehiculos();
    fetchGrupos();
  }, []);

  async function SearchFilter() {
    if (!searchFilter.deviceId && !searchFilter.groupId) {
      notificationSwal("error", "Debe seleccionar un dispositivo o un grupo");
      return;
    }
    const { from, to } = calculateDateRange(searchFilter.date_filter);
    try {
      const result = await getTraccar(
        "/reports/combined" +
          construirUrl({
            ...searchFilter,
            from: from,
            to: to,
            from_date: undefined,
            to_date: undefined,
          })
      );
      if (result.status === 200 && Array.isArray(result.data)) {
        const allEvents = result.data.flatMap((item) => item?.events || []);
        const allPositions = result.data.flatMap(
          (item) => item?.positions || []
        );
        const allRoutes = result.data.flatMap((item) =>
          (item?.route || []).map((route) => [route[1], route[0]])
        );
        setEvents(allEvents);
        setPositions(allPositions);
        setRoutes(allRoutes);
        if (
          allEvents.length === 0 &&
          allPositions.length === 0 &&
          allRoutes.length === 0
        ) {
          notificationSwal("info", "No se encontraron datos");
        }
      }
    } catch (error) {
      console.error("Error fetching Traccar data:", error);
    }
  }

  useEffect(() => {
    setTotalItems(events.length);
  }, [events]);

  useEffect(() => {
    if (routes.length === 0) return;
    setCenterMap(routes[0]);
    setZoomMap(8);
    setMapKey((prevKey) => prevKey + 1);
  }, [routes]);

  const construirUrl = (params) => {
    const queryParts = [];
    for (const key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key)) {
        const value = params[key];
        if (value !== undefined && value !== null && value !== "") {
          queryParts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
          );
        }
      }
    }
    return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  };

  function CleanFilter() {
    setEvents([]);
    setPositions([]);
    setRoutes([]);
    setSearchFilter({ date_filter: "today", from_date: "", to_date: "" });
  }

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    setSearchFilter((prevSearch) => ({
      ...prevSearch,
      [name]: value,
    }));
  };

  const ExportFilter = async () => {
    try {
      const dataParse = events.map((item) => ({
        deviceName: vehiculos.find((vehiculo) => vehiculo.id === item.deviceId)
          ?.name,
        datetime: restarCincoHoras(item.eventTime),
        type: types.find((type) => type.id === item["type"])?.name,
      }));
      exportToExcel(dataParse, columnsReportTraccarCombinado, "Combinado");
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
        from = new Date(todayReference);
        from.setDate(from.getDate() - 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      case "this_week":
        from = new Date(todayReference);
        from.setDate(from.getDate() - (from.getDay() || 7) + 1);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case "prev_week":
        from = new Date(todayReference);
        from.setDate(from.getDate() - (from.getDay() || 7) + 1 - 7);
        from.setHours(0, 0, 0, 0);
        to = new Date(from);
        to.setDate(to.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      case "this_month":
        from = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth(),
          1
        );
        to = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth() + 1,
          0
        );
        to.setHours(23, 59, 59, 999);
        break;
      case "prev_month":
        from = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth() - 1,
          1
        );
        to = new Date(
          todayReference.getFullYear(),
          todayReference.getMonth(),
          0
        );
        to.setHours(23, 59, 59, 999);
        break;
      case "custom":
        from = new Date(searchFilter.from_date);
        to = new Date(searchFilter.to_date);
        break;
      default:
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

  return (
    <Box sx={{ p: 2 }}>
      <MapContainer
        key={mapKey}
        center={centerMap}
        zoom={zoomMap}
        zoomControl={false}
        style={{ height: 200, width: "100%" }}
      >
        <TileLayer
          url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={["mt0", "mt1", "mt2", "mt3"]}
          maxZoom={20}
        />
        <ZoomControl position="bottomleft" />
        <Polyline positions={routes} color="blue" />
        {positions.map((position, index) => (
          <Marker
            key={index}
            position={[position?.latitude || 0, position?.longitude || 0]}
            icon={customIcon}
          />
        ))}
      </MapContainer>
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={4}>
              <Box sx={{ mb: 1 }}>
                <label>Vehículo:</label>
              </Box>
              <Autocomplete
                size="small"
                options={vehiculos}
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                  setSearchFilter({
                    ...searchFilter,
                    deviceId: newValue ? newValue.id : "",
                  });
                }}
                value={
                  vehiculos.find((d) => d.id === searchFilter.deviceId) || null
                }
                renderInput={(params) => <TextField {...params} />}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <Box sx={{ mb: 1 }}>
                <label>Grupo:</label>
              </Box>
              <Autocomplete
                size="small"
                options={grupos}
                getOptionLabel={(option) => option.name}
                onChange={(event, newValue) => {
                  setSearchFilter({
                    ...searchFilter,
                    groupId: newValue ? newValue.id : "",
                  });
                }}
                value={
                  grupos.find(
                    (groupId) => groupId.id === searchFilter.groupId
                  ) || null
                }
                renderInput={(params) => <TextField {...params} />}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <Box sx={{ mb: 1 }}>
                <label>Periodo:</label>
              </Box>
              <TextField
                select
                name="date_filter"
                value={searchFilter.date_filter || ""}
                onChange={handleSearchChange}
                size="small"
                fullWidth
              >
                <MenuItem value="today">Hoy</MenuItem>
                <MenuItem value="yesterday">Ayer</MenuItem>
                <MenuItem value="this_week">Esta semana</MenuItem>
                <MenuItem value="prev_week">Semana Anterior</MenuItem>
                <MenuItem value="this_month">Este mes</MenuItem>
                <MenuItem value="prev_month">Mes Anterior</MenuItem>
                <MenuItem value="custom">Personalizado</MenuItem>
              </TextField>
            </Grid>
            {searchFilter.date_filter === "custom" && (
              <>
                <Grid item xs={6} md={3}>
                  <Box sx={{ mb: 1 }}>
                    <label>Desde:</label>
                  </Box>
                  <TextField
                    type="datetime-local"
                    name="from_date"
                    value={searchFilter.from_date || ""}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ mb: 1 }}>
                    <label>Hasta:</label>
                  </Box>
                  <TextField
                    type="datetime-local"
                    name="to_date"
                    value={searchFilter.to_date || ""}
                    onChange={handleSearchChange}
                    size="small"
                    fullWidth
                  />
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
        <Grid item xs={12} md={3}>
          <Grid container spacing={2} direction="column">
            <Grid item>
              <Button
                variant="contained"
                color="success"
                startIcon={<SearchIcon />}
                onClick={SearchFilter}
                fullWidth
              >
                Buscar
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="warning"
                startIcon={<DownloadIcon />}
                onClick={ExportFilter}
                fullWidth
              >
                Exportar
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                color="error"
                startIcon={<CleaningServicesIcon />}
                onClick={CleanFilter}
                fullWidth
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Paper sx={{ width: "100%", overflow: "hidden", mt: 2 }}>
        {totalItems > 0 ? (
          <TableContainer sx={{ maxHeight: 300 }}>
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
                {events.map((row) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={row.id}>
                    {columns.map((column) => {
                      const value =
                        column.id === "deviceId"
                          ? vehiculos.find(
                              (vehiculo) => vehiculo.id === row.deviceId
                            )?.name
                          : column.id === "eventTime"
                          ? restarCincoHoras(row[column.id])
                          : column.id === "type"
                          ? types.find((type) => type.id === row[column.id])
                              ?.name
                          : row[column.id];
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {typeof value === "object" && value !== null
                            ? JSON.stringify(value)
                            : value !== null
                            ? value
                            : ""}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="warning">No se encontraron resultados.</Alert>
        )}
      </Paper>
    </Box>
  );
}
