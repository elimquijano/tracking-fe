import * as React from "react";
import { useEffect, useState, useContext, useCallback } from "react";
import L from "leaflet";
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  LayersControl,
  TileLayer,
  ZoomControl,
  Polygon,
  Polyline,
  useMap,
} from "react-leaflet";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Button,
  InputAdornment,
  TextField,
  Typography,
  Box,
  Autocomplete,
  Stack,
  Grid,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowBack,
  Circle,
  Close,
  ExpandLess,
  ExpandMore,
  Tune,
} from "@mui/icons-material";
import { Circle as LeafletCircle } from "react-leaflet";
import { WebSocketContext } from "../contexts/SocketContext";
import { IconCircle } from "../components/iconCircle";
import { getTraccar } from "../utils/common";
import { theme } from "../theme/theme";
import { IconEngineFilled } from "@tabler/icons-react";
import RotatedMarker from "../components/RotatedMarker";
import Draggable from "react-draggable";

// Configuración de iconos
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const getIconUrl = (category) => {
  switch (category) {
    case "car":
      return require("../assets/images/icons/auto.png");
    case "motorcycle":
      return require("../assets/images/icons/motocicleta.png");
    case "scooter":
      return require("../assets/images/icons/bajaj2.png");
    case "trolleybus":
      return require("../assets/images/icons/coaster.png");
    case "pickup":
      return require("../assets/images/icons/camioneta.png");
    case "offroad":
      return require("../assets/images/icons/camioneta.png");
    case "bus":
      return require("../assets/images/icons/minivan.png");
    default:
      return require("../assets/images/icons/auto.png");
  }
};

// Componente simple para controlar el mapa
const MapController = ({ vehiculoActual, marcadores, setVehiculoActual }) => {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e) => {
      // Si el clic no es en un marcador, deselecciona el vehículo
      if (e.originalEvent.target.classList.contains("leaflet-container")) {
        setVehiculoActual(null);
      }
    };

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
    };
  }, [map, setVehiculoActual]);

  useEffect(() => {
    if (vehiculoActual) {
      const marcador = marcadores?.find((m) => m.deviceId === vehiculoActual);
      if (marcador?.latitude && marcador?.longitude) {
        map.setView([marcador.latitude, marcador.longitude], 17);
      }
    }
  }, [marcadores, map]);

  useEffect(() => {
    if (vehiculoActual) {
      const marcador = marcadores?.find((m) => m.deviceId === vehiculoActual);
      if (marcador?.latitude && marcador?.longitude) {
        map.flyTo([marcador.latitude, marcador.longitude], 17);
      }
    } else {
      map.flyTo([-9.9306, -76.2422], 10); // Vista por defecto
    }
  }, [vehiculoActual, map]);

  useEffect(() => {
    if (marcadores?.length > 0) {
      const firstVehicle = marcadores[0];
      if (firstVehicle?.latitude && firstVehicle?.longitude) {
        map.setView([firstVehicle.latitude, firstVehicle.longitude], 10);
      }
    } else {
      map.setView([-9.9306, -76.2422], 10); // Vista por defecto
    }
  }, []);

  return null;
};

const columns = [{ id: "name", label: "Placa", minWidth: 5, key: 1 }];

export const MapaPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showTable, setShowTable] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [marcadores, setMarcadores] = useState([]);
  const [filteredVehiculos, setFilteredVehiculos] = useState([]);
  const [vehiculoActual, setVehiculoActual] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const isMd = useMediaQuery((theme) => theme.breakpoints.up("md"));
  const { BaseLayer } = LayersControl;
  const { devices, positions } = useContext(WebSocketContext);

  // Inicialización
  useEffect(() => {
    const initializeMap = async () => {
      try {
        await Promise.all([getVehiculos(), getGrupos(), getGeofences()]);
      } catch (error) {
        console.error("Error initializing map:", error);
      }
    };
    initializeMap();
  }, []);

  // Actualización de dispositivos (sin throttling para evitar lag)
  useEffect(() => {
    if (devices.length > 0) {
      actualizarVehiculos(devices);
    }
  }, [devices]);
  useEffect(() => {
    if (positions.length > 0) {
      actualizarMarcadores(positions);
    }
  }, [positions]);

  // Filtrado de vehículos
  useEffect(() => {
    let filtered = vehiculos;

    if (searchTerm) {
      filtered = filtered.filter((vehiculo) =>
        vehiculo.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (vehiculo) => vehiculo.status === statusFilter.value
      );
    }

    if (selectedGroup) {
      filtered = filtered.filter(
        (vehiculo) => vehiculo.groupid === selectedGroup.id
      );
    }

    setFilteredVehiculos(filtered);
  }, [searchTerm, statusFilter, selectedGroup, vehiculos]);

  // Callbacks
  const handleVehicleClick = useCallback((vehicleId) => {
    setVehiculoActual(vehicleId);
    setShowTable(false);
  }, []);

  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleShowTable = useCallback(() => {
    setShowTable(!showTable);
  }, [showTable]);

  const handleToggleFilters = useCallback(() => {
    setShowFilters(!showFilters);
  }, [showFilters]);

  const actualizarMarcadores = (nuevosDatos) => {
    setMarcadores((prevMarcadores) => {
      const marcadoresMap = new Map();

      // Agregar marcadores existentes al Map
      prevMarcadores.forEach((marcador) => {
        marcadoresMap.set(marcador.deviceId, marcador);
      });

      // Sobrescribir/agregar nuevos datos
      nuevosDatos.forEach((marcador) => {
        marcadoresMap.set(marcador.deviceId, marcador);
      });

      // Convertir Map de vuelta a array
      return Array.from(marcadoresMap.values());
    });
  };

  const actualizarVehiculos = (nuevosDatos) => {
    setVehiculos((prevVehiculos) => {
      const vehiculosMap = new Map();

      // Agregar vehículos existentes al Map
      prevVehiculos.forEach((vehiculo) => {
        vehiculosMap.set(vehiculo.id, vehiculo);
      });

      // Sobrescribir/agregar nuevos datos
      nuevosDatos.forEach((vehiculo) => {
        vehiculosMap.set(vehiculo.id, vehiculo);
      });

      // Convertir Map de vuelta a array
      return Array.from(vehiculosMap.values());
    });
  };

  const definirColorDeEstado = useCallback((estado) => {
    switch (estado) {
      case "online":
        return theme.palette.success.main;
      case "offline":
        return theme.palette.error.main;
      case "unknown":
        return theme.palette.warning.main;
      default:
        return theme.palette.grey.main;
    }
  }, []);

  const getTimeAgo = useCallback((fechaString) => {
    if (fechaString === null) return "Fuera de linea";

    const fechaPasada = new Date(fechaString);
    if (isNaN(fechaPasada.getTime())) return "Fecha inválida";

    const ahoraOriginal = new Date();
    const ahora = new Date(ahoraOriginal.getTime() + 5 * 60 * 60 * 1000);
    const diffMs = ahora.getTime() - fechaPasada.getTime();

    if (diffMs < 0) return "Fecha en el futuro";

    const SEGUNDO = 1000,
      MINUTO = SEGUNDO * 60,
      HORA = MINUTO * 60,
      DIA = HORA * 24;
    const MES = DIA * 30.44,
      ANO = DIA * 365.25;

    const diffYears = Math.round(diffMs / ANO);
    if (diffYears >= 1)
      return `Hace ${diffYears} año${diffYears > 1 ? "s" : ""}`;

    const diffMonths = Math.round(diffMs / MES);
    if (diffMonths >= 1)
      return `Hace ${diffMonths} mes${diffMonths > 1 ? "es" : ""}`;

    const diffDays = Math.round(diffMs / DIA);
    if (diffDays >= 1) return `Hace ${diffDays} día${diffDays > 1 ? "s" : ""}`;

    const diffHours = Math.round(diffMs / HORA);
    if (diffHours >= 1)
      return `Hace ${diffHours} hora${diffHours > 1 ? "s" : ""}`;

    const diffMinutes = Math.round(diffMs / MINUTO);
    if (diffMinutes >= 1)
      return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? "s" : ""}`;

    const diffSeconds = Math.round(diffMs / SEGUNDO);
    if (diffSeconds >= 10)
      return `Hace ${diffSeconds} segundo${diffSeconds > 1 ? "s" : ""}`;

    return "Hace unos segundos";
  }, []);

  async function getGeofences() {
    try {
      const result = await getTraccar("geofences");
      setGeofences(result.data);
    } catch (error) {
      console.log("error: " + error);
    }
  }

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

  async function getVehiculos() {
    try {
      const result = await getTraccar("devices");
      setVehiculos(result.data);
    } catch (error) {
      console.log("error: " + error);
    }
  }

  async function getGrupos() {
    try {
      const result = await getTraccar("groups");
      setGrupos(result.data);
    } catch (error) {
      console.log("error: " + error);
    }
  }

  const restarCincoHoras = useCallback((dateString) => {
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
  }, []);

  const getStatusCounts = useCallback(() => {
    const counts = { online: 0, offline: 0, unknown: 0 };
    vehiculos.forEach((vehiculo) => {
      if (vehiculo.status) {
        counts[vehiculo.status]++;
      }
    });
    return counts;
  }, [vehiculos]);

  const statusCounts = getStatusCounts();

  return (
    <Box sx={{ height: "100%" }}>
      {vehiculos.length > 0 ? (
        <Paper
          sx={{ width: "100%", height: "100%", overflow: "hidden", padding: 1 }}
        >
          <Box sx={{ position: "relative", height: "100%" }}>
            {/* Panel de control */}
            <Paper sx={{ position: "absolute", zIndex: 500, margin: 1 }}>
              <Stack direction="row" alignItems="center">
                <Button color="primary" fullWidth onClick={handleShowTable}>
                  {showTable ? <ExpandLess /> : <ExpandMore />}
                </Button>
              </Stack>
              {showTable && (
                <Box sx={{ padding: 1 }}>
                  <Stack
                    sx={{ position: "relative" }}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    justifyContent="space-between"
                  >
                    <TextField
                      id="form_name"
                      name="form_name"
                      placeholder="Busca tu vehículo..."
                      sx={{ margin: { xs: 1, md: 2 } }}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Button
                              color="primary"
                              onClick={handleToggleFilters}
                            >
                              <Tune />
                            </Button>
                          </InputAdornment>
                        ),
                      }}
                      value={searchTerm}
                      onChange={handleSearchChange}
                      variant="outlined"
                      size="small"
                      fullWidth
                    />
                    {showFilters && (
                      <Paper
                        sx={{
                          position: "absolute",
                          top: "100%",
                          width: "100%",
                          left: 32,
                          padding: { xs: 1, md: 2 },
                        }}
                        elevation={3}
                      >
                        <Autocomplete
                          sx={{ marginBottom: { xs: 1, md: 2 } }}
                          options={[
                            {
                              label: "En línea",
                              value: "online",
                              count: statusCounts.online,
                            },
                            {
                              label: "Fuera de línea",
                              value: "offline",
                              count: statusCounts.offline,
                            },
                            {
                              label: "Desconocido",
                              value: "unknown",
                              count: statusCounts.unknown,
                            },
                          ]}
                          getOptionLabel={(option) =>
                            option.label + " (" + option.count + ")"
                          }
                          value={statusFilter}
                          onChange={(event, newValue) =>
                            setStatusFilter(newValue)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Estado"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                        <Autocomplete
                          options={grupos}
                          getOptionLabel={(option) => option.name}
                          value={selectedGroup}
                          onChange={(event, newValue) =>
                            setSelectedGroup(newValue)
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Grupo"
                              variant="outlined"
                              size="small"
                            />
                          )}
                        />
                      </Paper>
                    )}
                  </Stack>
                  <TableContainer
                    sx={{ maxHeight: { xs: "200px", md: "400px" } }}
                  >
                    <Table size="small">
                      <TableBody>
                        {filteredVehiculos.map((row) => {
                          const tieneCoordenadas =
                            marcadores?.find((m) => m.deviceId == row.id) ||
                            false;
                          return (
                            <TableRow
                              key={row.id}
                              hover
                              role="checkbox"
                              tabIndex={-1}
                              onClick={
                                tieneCoordenadas
                                  ? () => handleVehicleClick(row.id)
                                  : () => {}
                              }
                              sx={{ cursor: "pointer" }}
                            >
                              {columns.map((column, colIndex) => {
                                const value = row[column.id];
                                const status = definirColorDeEstado(
                                  row["status"]
                                );
                                const statusText =
                                  row.status === "online"
                                    ? "En Línea"
                                    : row.status === "offline"
                                    ? getTimeAgo(row.lastUpdate)
                                    : "Desconocido";
                                return (
                                  <TableCell
                                    key={colIndex}
                                    align={column.align}
                                  >
                                    <Stack
                                      direction="row"
                                      alignItems="center"
                                      spacing={2}
                                    >
                                      <IconCircle
                                        icon={row["category"]}
                                        color={"primary"}
                                      />
                                      <Stack>
                                        <Typography variant="subtitle1">
                                          {column.format &&
                                          typeof value === "number"
                                            ? column.format(value)
                                            : value}
                                        </Typography>
                                        <Stack
                                          direction="row"
                                          alignItems="center"
                                          spacing={1}
                                        >
                                          <Typography
                                            variant="caption"
                                            color={"text.secondary"}
                                          >
                                            {row["uniqueId"] || ""}
                                          </Typography>
                                          <Circle
                                            fontSize="small"
                                            sx={{
                                              fontSize: "4px",
                                              color: status,
                                            }}
                                          />
                                          <Typography
                                            variant="caption"
                                            sx={{ color: status }}
                                          >
                                            {statusText}
                                          </Typography>
                                        </Stack>
                                      </Stack>
                                    </Stack>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>

            {/* Mapa simplificado */}
            <MapContainer
              style={{ width: "100%", height: "100%" }}
              center={[0, 0]}
              zoom={1}
              zoomControl={false}
            >
              <LayersControl position="topright">
                <BaseLayer checked name="Google">
                  <TileLayer
                    url="http://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    subdomains={["mt0", "mt1", "mt2", "mt3"]}
                    maxZoom={20}
                    attribution="© Google"
                  />
                </BaseLayer>
                <BaseLayer name="Carto Voyager">
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>'
                    subdomains={["a", "b", "c", "d"]}
                    maxZoom={19}
                  />
                </BaseLayer>
                <BaseLayer name="OpenStreetMap">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                </BaseLayer>
                <BaseLayer name="Google Satélite">
                  <TileLayer
                    url="http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    subdomains={["mt0", "mt1", "mt2", "mt3"]}
                    maxZoom={20}
                    attribution="© Google"
                  />
                </BaseLayer>
                <BaseLayer name="Google Híbrido">
                  <TileLayer
                    url="http://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}"
                    subdomains={["mt0", "mt1", "mt2", "mt3"]}
                    maxZoom={20}
                    attribution="© Google"
                  />
                </BaseLayer>
                <BaseLayer name="Google Relieve">
                  <TileLayer
                    url="http://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"
                    subdomains={["mt0", "mt1", "mt2", "mt3"]}
                    maxZoom={20}
                    attribution="© Google"
                  />
                </BaseLayer>
              </LayersControl>

              <ZoomControl position="bottomleft" />

              <MapController
                vehiculoActual={vehiculoActual}
                marcadores={marcadores}
                setVehiculoActual={setVehiculoActual}
              />

              {/* Renderizado DIRECTO de vehículos - Como Traccar */}
              {marcadores
                .filter(
                  (marcador) =>
                    marcador.latitude &&
                    marcador.longitude &&
                    !isNaN(marcador.latitude) &&
                    !isNaN(marcador.longitude)
                )
                .map((marcador) => {
                  const vehicleIcon = L.icon({
                    iconUrl: getIconUrl(
                      vehiculos.find((v) => v.id === marcador.deviceId)
                        ?.category || "car"
                    ),
                    iconSize: [42, 48], // Tamaño del icono, puedes ajustarlo según tus necesidades
                    iconAnchor: [21, 24], // Punto del icono que corresponderá a la ubicación del marcador
                    popupAnchor: [0, -12], // Punto desde el cual se abrirá el popup en relación con iconAnchor
                  });

                  return (
                    <RotatedMarker
                      key={marcador.id}
                      title={
                        vehiculos.find((v) => v.id == marcador.deviceId)
                          ?.name || "Sin nombre"
                      }
                      position={[marcador.latitude, marcador.longitude]}
                      icon={vehicleIcon}
                      eventHandlers={{
                        click: (e) => {
                          L.DomEvent.stopPropagation(e);
                          handleVehicleClick(marcador.deviceId);
                        },
                      }}
                      rotationOrigin="center center"
                      rotationAngle={(marcador.course || 0) + 90}
                    />
                  );
                })}

              {/* Geofences */}
              {geofences.map((row, index) => {
                let type, data;
                const area = String(row.area);

                if (area.includes("CIRCLE")) {
                  type = "CIRCLE";
                  data = parseCircle(row.area);
                } else if (area.includes("POLYGON")) {
                  type = "POLYGON";
                  data = parsePolygon(row.area);
                } else if (area.includes("LINESTRING")) {
                  type = "LINESTRING";
                  data = parseLineString(row.area);
                }

                const color = row?.attributes?.color || "blue";

                if (type === "POLYGON" && data) {
                  return (
                    <Polygon
                      key={index}
                      positions={data.points}
                      color={color}
                    />
                  );
                } else if (type === "CIRCLE" && data) {
                  return (
                    <LeafletCircle
                      key={index}
                      center={data.center}
                      radius={data.radius}
                      color={color}
                    />
                  );
                } else if (type === "LINESTRING" && data) {
                  return (
                    <Polyline
                      key={index}
                      positions={data.points}
                      color={color}
                    />
                  );
                }
                return null;
              })}

              {/* Círculo del vehículo seleccionado - SIN key cambiante */}
              {vehiculoActual && (
                <LeafletCircle
                  center={[
                    marcadores?.find((m) => m.deviceId === vehiculoActual)
                      ?.latitude,
                    marcadores?.find((m) => m.deviceId === vehiculoActual)
                      ?.longitude,
                  ]}
                  radius={30}
                  pathOptions={{
                    color: "rgba(0, 128, 0, 0.0)",
                    fillColor: "rgba(141, 36, 170, 1)",
                    fillOpacity: 0.2,
                  }}
                />
              )}
            </MapContainer>

            {/* Panel de vehículo seleccionado */}
            {vehiculoActual && (
              <Draggable handle=".handle">
                <Paper
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    position: "absolute",
                    zIndex: 1000, // Aumentado para estar por encima de otros elementos
                    bottom: 20,
                    borderRadius: 0,
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: { xs: "calc(100% - 40px)", md: "480px" },
                    margin: 0,
                    boxShadow: "0px 0px 15px rgba(0,0,0,0.2)",
                  }}
                >
                  <Stack direction={"column"} style={{ position: "relative" }}>
                    <Stack
                      className="handle"
                      direction={"row"}
                      justifyContent={"space-between"}
                      alignItems="center"
                      sx={{
                        cursor: "move",
                        paddingLeft: 2,
                      }}
                    >
                      <Typography
                        variant={isMd ? "h6" : "subtitle1"}
                        sx={{
                          fontWeight: "bold",
                          color: "primary.main",
                        }}
                      >
                        {vehiculos.find((v) => v.id === vehiculoActual).name ||
                          "-"}
                      </Typography>
                      <Button
                        color="primary"
                        onClick={() => setVehiculoActual(null)}
                        sx={{ minWidth: "auto", padding: 1 }}
                      >
                        <Close fontSize={isMd ? "medium" : "small"} />
                      </Button>
                    </Stack>
                    <Box sx={{ padding: 2 }}>
                      <Grid container spacing={isMd ? 2 : 1}>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Velocidad:
                            </Typography>
                            <Typography variant={"caption"}>
                              {Number(
                                marcadores?.find(
                                  (m) => m.deviceId === vehiculoActual
                                )?.speed || 0
                              ).toFixed(2)}{" "}
                              Km/h
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Estado:
                            </Typography>
                            <Typography
                              variant={"caption"}
                              sx={{
                                color: definirColorDeEstado(
                                  vehiculos.find((v) => v.id === vehiculoActual)
                                    .status
                                ),
                              }}
                            >
                              {vehiculos.find((v) => v.id === vehiculoActual)
                                .status === "online"
                                ? "En linea"
                                : getTimeAgo(
                                    vehiculos.find(
                                      (v) => v.id === vehiculoActual
                                    ).lastUpdate
                                  ) || "Desconocido"}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Distancia Total:
                            </Typography>
                            <Typography variant={"caption"}>
                              {Number(
                                marcadores?.find(
                                  (m) => m.deviceId === vehiculoActual
                                )?.attributes?.totalDistance || 0
                              ).toFixed(2)}{" "}
                              km
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Bateria:
                            </Typography>
                            <Typography variant={"caption"}>
                              {marcadores?.find(
                                (m) => m.deviceId === vehiculoActual
                              )?.attributes?.batteryLevel || "100"}{" "}
                              %
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Rumbo:
                            </Typography>
                            <Typography
                              variant={"caption"}
                              sx={{ position: "relative" }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transform: `rotate(${
                                    (marcadores?.find(
                                      (m) => m.deviceId === vehiculoActual
                                    )?.course || 0) + 90
                                  }deg)`,
                                }}
                              >
                                <ArrowBack color="primary" fontSize="small" />
                              </Box>
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Motor:
                            </Typography>
                            <Typography variant={"caption"}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <IconEngineFilled
                                  color={
                                    marcadores?.find(
                                      (m) => m.deviceId === vehiculoActual
                                    )?.attributes?.ignition
                                      ? "green"
                                      : "red"
                                  }
                                  size={16}
                                />
                              </Box>
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Última actualización:
                            </Typography>
                            <Typography variant={"caption"}>
                              {restarCincoHoras(
                                vehiculos.find((v) => v.id === vehiculoActual)
                                  .lastUpdate || ""
                              )}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                </Paper>
              </Draggable>
            )}
          </Box>
        </Paper>
      ) : (
        <Box p={2} bgcolor="warning.light" color="warning.contrastText">
          <Typography>No se encontraron resultados.</Typography>
        </Box>
      )}
    </Box>
  );
};
