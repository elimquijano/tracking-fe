import * as React from "react";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  LayersControl,
  TileLayer,
  Polyline,
  Polygon,
  Tooltip,
  ZoomControl,
} from "react-leaflet";
import {
  Paper,
  Button,
  Slider,
  IconButton,
  Select,
  MenuItem,
  TextField,
  Autocomplete,
  Box,
  Stack,
  Grid,
  Typography,
} from "@mui/material";
import {
  CleaningServices,
  FastForwardRounded,
  FastRewindRounded,
  GetApp,
  PauseRounded,
  PlayArrowRounded,
  Search,
  Tune,
} from "@mui/icons-material";
import { Circle as LeafletCircle } from "react-leaflet";
import { exportToExcel, getTraccar } from "../utils/common";
import { notificationSwal } from "../utils/swal-helpers";
import { columnsTPositionsList } from "../utils/exportColumns";
import RotatedMarker from "../components/RotatedMarker";
import { theme } from "../theme/theme";

const Statistics = () => {
  const [filteredRows, setFilteredRows] = useState([]);
  const [searchFilter, setSearchFilter] = useState({
    date_filter: "today",
  });
  const [totalItems, setTotalItems] = useState(0);
  const [vehiculos, setVehiculos] = useState([]);
  const [geocercas, setGeocercas] = useState([]);
  const [posiciones, setPosiciones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [positionActual, setPositionActual] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [paused, setPaused] = useState(true);
  const [mapCenter, setMapCenter] = useState([-9.930648, -76.241496]);
  const [mapZoom, setMapZoom] = useState(7);
  const [mapKey, setMapKey] = useState(Date.now());
  const { BaseLayer } = LayersControl;
  const getIcon = (iconUrl) =>
    new L.Icon({
      iconUrl:
        iconUrl || "https://cdn-icons-png.flaticon.com/128/809/809998.png", // URL por defecto si no hay un icono específico
      iconSize: [35, 35], // Tamaño del icono
      iconAnchor: [17, 35], // Punto del icono que corresponderá a la ubicación del marcador
      popupAnchor: [0, -35], // Punto desde el cual se abrirá el popup en relación con iconAnchor
    });
  const currentRow = filteredRows[positionActual];

  const iconUrl = "https://cdn-icons-png.flaticon.com/128/809/809998.png"; // URL por defecto

  const customIcon = getIcon(iconUrl);

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const result = await getTraccar("/devices");
        if (result.status == 200) {
          setVehiculos(result.data);
        }
      } catch (error) {
        console.error("Error en la solicitud de Dispositivos:", error);
      }
    };
    const fetchGeocercas = async () => {
      try {
        const result = await getTraccar("/geofences");
        if (result.status == 200) {
          setGeocercas(result.data);
        }
      } catch (error) {
        console.error("Error en la solicitud de Dispositivos:", error);
      }
    };
    fetchVehiculos();
    fetchGeocercas();
  }, []);

  useEffect(() => {
    let intervalId = null;

    if (!paused) {
      intervalId = setInterval(() => {
        setPositionActual((prevPosition) => {
          // Incrementa positionActual hasta un máximo de totalItems - 1
          const nextPosition = prevPosition + 1;
          if (nextPosition == totalItems - 1) {
            setPaused(true);
          }
          return nextPosition < totalItems ? nextPosition : prevPosition;
        });
      }, 500); // Incrementa positionActual cada medio segundo
    }

    return () => {
      if (intervalId !== null) {
        clearInterval(intervalId); // Limpia el intervalo cuando paused es true o cuando el componente se desmonta
      }
    };
  }, [paused, totalItems]); // Vuelve a ejecutar useEffect cuando paused o totalItems cambian

  async function SearchFilter() {
    if (ValidacionItemSave(searchFilter) === false) {
      return;
    }
    setIsLoading(true);
    const { from, to } = calculateDateRange(searchFilter.date_filter);
    try {
      const result = await getTraccar(
        `/positions?deviceId=${searchFilter.deviceid}&from=${from}&to=${to}`
      );
      if (result.status == 200) {
        setFilteredRows(result.data);
        setShowForm(false);
      } else {
        notificationSwal("No hay datos", "No se encontraron datos", "error");
      }
    } catch (error) {
      notificationSwal(
        "Error",
        error?.message || "Error al obtener datos",
        "error"
      );
    } finally {
      setIsLoading(false);
    }
  }

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

  useEffect(() => {
    setTotalItems(filteredRows.length);
    setPosiciones(filteredRows.map((row) => [row.latitude, row.longitude]));
    if (filteredRows.length > 0) {
      setMapCenter([
        filteredRows[positionActual].latitude,
        filteredRows[positionActual].longitude,
      ]);
      setMapZoom(14);
      setMapKey(Date.now());
    }
  }, [filteredRows]);

  useEffect(() => {
    if (showForm) {
      setMapCenter([-9.930648, -76.241496]);
      setMapZoom(7);
      setMapKey(Date.now());
      setPositionActual(0);
      setFilteredRows([]);
    }
  }, [showForm]);

  function CleanFilter() {
    setSearchFilter({ date_filter: "today" });
  }

  function ValidacionItemSave(filter) {
    let response = true;
    let msgResponse = "";

    if (!filter || Object.keys(filter).length === 0) {
      msgResponse += "* Debe completar los campos obligatorios.<br>";
      response = false;
    } else {
      if (!filter.deviceid) {
        msgResponse += "* Debe seleccionar un Vehiculo.<br>";
        response = false;
      }
      if (!filter.date_filter) {
        msgResponse += "* Debe seleccionar una fecha.<br>";
        response = false;
      }
    }

    if (response === false) {
      notificationSwal("error", msgResponse);
    }

    return response;
  }

  async function ExportFilter() {
    try {
      const result = filteredRows.map((row) => ({
        ...row,
        name:
          vehiculos.find((vehiculo) => vehiculo.id === row.deviceId)?.name ||
          "",
        deviceTime: restarCincoHoras(row.deviceTime),
      }));
      if (result.length > 0) {
        exportToExcel(result, columnsTPositionsList, "Posiciones");
      } else {
        notificationSwal("Alerta", "No hay datos para exportar.", "info");
      }
    } catch (error) {
      notificationSwal(
        "Error",
        error?.message || "Error al exportar.",
        "error"
      );
    }
  }

  const handleSearchChange = (event) => {
    const { name, value } = event.target;
    setSearchFilter((prevSearch) => ({
      ...prevSearch,
      [name]: value,
    }));
  };

  const changePosition = (row, index) => {
    setPositionActual(index);
    console.log(row);
  };

  const handleShowForm = () => {
    setShowForm(true);
  };

  const handleChangeSliderValue = (event, newValue) => {
    setPositionActual(newValue);
  };

  const previousPosition = () => {
    if (positionActual > 0) {
      setPositionActual(positionActual - 1);
    }
  };

  const nextPosition = () => {
    if (positionActual < totalItems - 1) {
      setPositionActual(positionActual + 1);
    }
  };

  const rotatePoints = (center, angleInDegrees) => {
    const size = 0.0001;
    const points = [
      [center[0] + size, center[1] + size / 2],
      [center[0] + size, center[1] - size / 2],
      [center[0] - size, center[1]],
    ];
    const angleInRadians = (angleInDegrees + 180) * (Math.PI / 180);
    const rotatedPoints = points.map((point) => {
      const xRotated =
        Math.cos(angleInRadians) * (point[0] - center[0]) -
        Math.sin(angleInRadians) * (point[1] - center[1]) +
        center[0];
      const yRotated =
        Math.sin(angleInRadians) * (point[0] - center[0]) +
        Math.cos(angleInRadians) * (point[1] - center[1]) +
        center[1];

      return [xRotated, yRotated];
    });

    return rotatedPoints;
  };

  // Función para parsear un string de tipo CIRCLE
  function parseCircle(circleString) {
    const regex = /CIRCLE\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*,\s*([\d.]+)\s*\)/;
    const match = circleString.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      const radius = parseFloat(match[3]);
      return { center: [lat, lng], radius };
    }
    return null;
  }

  // Función para parsear un string de tipo POLYGON
  function parsePolygon(polygonString) {
    const regex = /POLYGON\s*\(\(\s*([-\d.\s,]+)\s*\)\)/;
    const match = polygonString.match(regex);
    if (match) {
      const pointsString = match[1];
      const points = pointsString.split(",").map((point) => {
        const [lat, lng] = point.trim().split(/\s+/).map(parseFloat);
        return [lat, lng];
      });
      return { points };
    }
    return null;
  }

  // Función para parsear un string de tipo LINESTRING
  function parseLineString(lineString) {
    const regex = /LINESTRING\s*\(\s*([-\d.\s,]+)\s*\)/;
    const match = lineString.match(regex);
    if (match) {
      const pointsString = match[1];
      const points = pointsString.split(",").map((point) => {
        const [lat, lng] = point.trim().split(/\s+/).map(parseFloat);
        return [lat, lng];
      });
      return { points };
    }
    return null;
  }

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
    <Box sx={{ height: "100%" }}>
      <Paper
        sx={{ width: "100%", height: "100%", overflow: "hidden", padding: 1 }}
      >
        <Box sx={{ position: "relative", height: "100%" }}>
          <Paper sx={{ position: "absolute", zIndex: 500, margin: 1 }}>
            {showForm ? (
              <Paper elevation={3} sx={{ p: 2 }}>
                <Stack
                  spacing={2}
                  component="form"
                  noValidate
                  autoComplete="off"
                  minWidth={250}
                >
                  {/* Campo de Autocompletar Vehículo */}
                  <Autocomplete
                    size="small"
                    options={vehiculos}
                    getOptionLabel={(option) => option.name}
                    onChange={(event, newValue) => {
                      setSearchFilter({
                        ...searchFilter,
                        deviceid: newValue ? newValue.id : "",
                      });
                    }}
                    value={
                      vehiculos.find(
                        (device) => device.id === searchFilter.deviceid
                      ) || null
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccione un Vehículo" />
                    )}
                  />

                  {/* Campo de Selección de Fecha */}
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
                  </Select>

                  {/* Botón de Búsqueda */}
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    disabled={isLoading}
                    onClick={SearchFilter}
                    startIcon={<Search />}
                  >
                    {isLoading ? "Cargando..." : "BUSCAR"}
                  </Button>

                  {/* Botón de Limpiar */}
                  <Button
                    fullWidth
                    variant="contained"
                    color="error"
                    onClick={CleanFilter}
                    startIcon={<CleaningServices />}
                  >
                    LIMPIAR
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <Box sx={{ p: 2 }}>
                {/* Barra superior con botones y título */}
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  spacing={1}
                >
                  <IconButton onClick={handleShowForm} aria-label="filtros">
                    <Tune />
                  </IconButton>
                  <Typography
                    variant="subtitle1"
                    noWrap
                    sx={{ flexGrow: 1, textAlign: "center" }}
                  >
                    {filteredRows[positionActual]?.name || ""}
                  </Typography>
                  <IconButton onClick={ExportFilter} aria-label="exportar">
                    <GetApp />
                  </IconButton>
                </Stack>

                {/* Slider de progreso */}
                <Slider
                  value={positionActual}
                  onChange={handleChangeSliderValue}
                  min={0}
                  max={totalItems > 0 ? totalItems - 1 : 0}
                  aria-labelledby="player-slider"
                />

                {/* Controles de reproducción y datos (usando Grid) */}
                <Grid
                  container
                  spacing={1}
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {/* Contador de posición */}
                  <Grid item xs={3} sx={{ textAlign: "left" }}>
                    <Typography variant="caption">
                      {totalItems > 0 ? positionActual + 1 : 0}/{totalItems}
                    </Typography>
                  </Grid>

                  {/* Controles de Play/Pausa */}
                  <Grid item xs={6} sx={{ textAlign: "center" }}>
                    <IconButton
                      onClick={previousPosition}
                      disabled={positionActual === 0}
                    >
                      <FastRewindRounded />
                    </IconButton>
                    <IconButton
                      onClick={() => setPaused(!paused)}
                      disabled={positionActual === totalItems - 1}
                    >
                      {paused ? <PlayArrowRounded /> : <PauseRounded />}
                    </IconButton>
                    <IconButton
                      onClick={nextPosition}
                      disabled={positionActual === totalItems - 1}
                    >
                      <FastForwardRounded />
                    </IconButton>
                  </Grid>

                  {/* Marca de tiempo */}
                  <Grid item xs={3} sx={{ textAlign: "right" }}>
                    <Typography variant="caption">
                      {restarCincoHoras(
                        filteredRows[positionActual]?.deviceTime
                      ) || ""}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
          <MapContainer
            key={mapKey}
            style={{ minHeight: 500, width: "100%", height: "100%" }}
            center={mapCenter}
            zoom={mapZoom}
            zoomControl={false}
          >
            <ZoomControl position="bottomright" />
            <LayersControl position="topright">
              <BaseLayer checked name="Carto">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              </BaseLayer>
              <BaseLayer name="OpenStreetMap">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </BaseLayer>
              <BaseLayer name="Google">
                <TileLayer
                  url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                  maxZoom={20}
                />
              </BaseLayer>
              <BaseLayer name="Google Satélite">
                <TileLayer
                  url="http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                  maxZoom={20}
                />
              </BaseLayer>
              <BaseLayer name="Google Híbrido">
                <TileLayer
                  url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                  maxZoom={20}
                />
              </BaseLayer>
              <BaseLayer name="Google Relieve">
                <TileLayer
                  url="http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                  subdomains={["mt0", "mt1", "mt2", "mt3"]}
                  maxZoom={20}
                />
              </BaseLayer>
            </LayersControl>
            {totalItems > 0 ? (
              <>
                {filteredRows.map((position, index) => {
                  const triangle = rotatePoints(
                    [position?.latitude, position?.longitude],
                    position?.course
                  );
                  return (
                    <React.Fragment key={index}>
                      <Polygon
                        positions={triangle}
                        color={theme.palette.primary.main}
                        fillColor={theme.palette.primary.main}
                        fillOpacity={1}
                        eventHandlers={{
                          click: () => changePosition(position, index),
                        }}
                      />
                    </React.Fragment>
                  );
                })}
                <RotatedMarker
                  position={[
                    currentRow?.latitude || 0,
                    currentRow?.longitude || 0,
                  ]}
                  icon={customIcon}
                  rotationOrigin={"center center"}
                  rotationAngle={currentRow?.course + 180 || 0}
                >
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -20]}
                    opacity={0.6}
                  >
                    {restarCincoHoras(
                      filteredRows[positionActual]?.deviceTime
                    ) || ""}
                  </Tooltip>
                </RotatedMarker>
                <Polyline positions={posiciones} color={theme.palette.primary.main} />
              </>
            ) : (
              <div className="alert alert-warning" role="alert">
                No se encontraron resultados.
              </div>
            )}
            {geocercas.map((row, index) => {
              let type;
              let data;

              if (String(row.area).includes("CIRCLE")) {
                type = "CIRCLE";
                data = parseCircle(row.area);
              } else if (String(row.area).includes("POLYGON")) {
                type = "POLYGON";
                data = parsePolygon(row.area);
              } else if (String(row.area).includes("LINESTRING")) {
                type = "LINESTRING";
                data = parseLineString(row.area);
              }

              const color = row?.attributes?.color || "blue";
              if (type === "POLYGON") {
                return (
                  <Polygon key={index} positions={data.points} color={color} />
                );
              } else if (type === "CIRCLE") {
                return (
                  <LeafletCircle
                    key={index}
                    center={data.center}
                    radius={data.radius}
                    color={color}
                  />
                );
              } else if (type === "LINESTRING") {
                return (
                  <Polyline key={index} positions={data.points} color={color} />
                );
              }
              return null;
            })}
          </MapContainer>
        </Box>
      </Paper>
    </Box>
  );
};


export default Statistics;