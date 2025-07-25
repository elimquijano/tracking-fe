import * as React from "react";
import { useEffect, useState, useContext } from "react";
import L from "leaflet";
import "leaflet-rotatedmarker";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  LayersControl,
  TileLayer,
  ZoomControl,
  Marker,
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
  CircularProgress,
} from "@mui/material";
import {
  ArrowBack,
  Circle,
  ExpandLess,
  ExpandMore,
  Tune,
} from "@mui/icons-material";
import { Circle as LeafletCircle } from "react-leaflet";
import GoogleStreetView from "../components/StreetView";
import { WebSocketContext } from "../contexts/SocketContext";
import { IconCircle } from "../components/iconCircle";
import { getTraccar } from "../utils/common";
import { theme } from "../theme/theme";

// Asegúrate de que los iconos de los marcadores se muestren correctamente
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

const columns = [{ id: "name", label: "Placa", minWidth: 5, key: 1 }];

export const MapaPage = () => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTable, setShowTable] = useState(true);
  const [vehiculos, setVehiculos] = useState([]);
  const [filteredVehiculos, setFilteredVehiculos] = useState([]);
  const [vehiculoActual, setVehiculoActual] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);
  const [grupos, setGrupos] = useState([]);
  const [geofences, setGeofences] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [camera, setCamera] = useState({
    lat: -9.9306,
    lng: -76.2422,
    zoom: 7,
  });

  const isMd = useMediaQuery((theme) => theme.breakpoints.up("md"));

  const { BaseLayer } = LayersControl;
  const { devices } = useContext(WebSocketContext);

  useEffect(() => {
    getGrupos();
    getGeofences();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (devices === null || devices === undefined) {
      setVehiculos([]); // Limpia los marcadores existentes
      return;
    }
    setVehiculos(devices);
    if (vehiculoActual) {
      const vehiculo = devices.find(
        (vehiculo) => vehiculo.id === vehiculoActual
      );
      setRouteCoordinates((prevCoordinates) => [
        ...prevCoordinates,
        [vehiculo.latitude || 0, vehiculo.longitude || 0],
      ]);
    }
  }, [devices]);

  useEffect(() => {
    if (vehiculoActual) {
      const vehiculo = vehiculos.find(
        (vehiculo) => vehiculo.id === vehiculoActual
      );
      setCamera({
        lat: vehiculo?.latitude || 0,
        lng: vehiculo?.longitude || 0,
        zoom: 18,
      });
      setShowTable(false);
    }
    setRouteCoordinates([]);
  }, [vehiculoActual]);

  useEffect(() => {
    // Filtrar la lista de vehículos cada vez que cambia el texto de búsqueda, el filtro de estado o el grupo seleccionado
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

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value); // Actualiza el texto de búsqueda
  };

  const handleShowTable = () => {
    setShowTable(!showTable);
  };

  const handleToggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const definirColorDeEstado = (estado) => {
    let color = "";
    switch (estado) {
      case "online":
        color = theme.palette.success.main;
        break;
      case "offline":
        color = theme.palette.error.main;
        break;
      case "unknown":
        color = theme.palette.warning.main;
        break;
      default:
        break;
    }
    return color;
  };

  const getTimeAgo = (fechaString) => {
    if (fechaString === null) return "Fuera de linea";

    const fechaPasada = new Date(fechaString);
    if (isNaN(fechaPasada.getTime())) return "Fecha inválida";

    // Obtener hora actual y sumarle 5 horas
    const ahoraOriginal = new Date();
    const ahora = new Date(ahoraOriginal.getTime() + 5 * 60 * 60 * 1000); // Suma 5 horas en milisegundos

    const diffMs = ahora.getTime() - fechaPasada.getTime();

    if (diffMs < 0) return "Fecha en el futuro"; // Comparado contra (ahora + 5h)

    const SEGUNDO = 1000,
      MINUTO = SEGUNDO * 60,
      HORA = MINUTO * 60,
      DIA = HORA * 24;
    const MES = DIA * 30.44,
      ANO = DIA * 365.25; // Aproximaciones

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
  };

  async function getGeofences() {
    try {
      const result = await getTraccar("geofences");
      setGeofences(result.data);
    } catch (error) {
      console.log("error: " + error);
    }
  }

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

  async function getGrupos() {
    try {
      const result = await getTraccar("groups");
      setGrupos(result.data);
    } catch (error) {
      console.log("error: " + error);
    }
  }

  function CameraMapOnPoint({ lat, lng, zoom = 15 }) {
    const map = useMap();

    useEffect(() => {
      if (lat && lng) {
        map.flyTo([lat, lng], zoom);
      }
    }, [lat, lng, map]);

    return null;
  }

  const getStatusCounts = () => {
    const counts = {
      online: 0,
      offline: 0,
      unknown: 0,
    };
    vehiculos.forEach((vehiculo) => {
      if (vehiculo.status) {
        counts[vehiculo.status]++;
      }
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100%" }}>
      {vehiculos.length > 0 ? (
        <Paper
          sx={{
            width: "100%",
            height: "100%",
            overflow: "hidden",
            padding: 1,
          }}
        >
          <Box sx={{ position: "relative", height: "100%" }}>
            <Paper sx={{ position: "absolute", zIndex: 500, margin: 1 }}>
              <Stack direction="row" alignItems="center">
                <Button
                  color="primary"
                  fullWidth
                  onClick={() => handleShowTable()}
                >
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
                          onChange={(event, newValue) => {
                            setStatusFilter(newValue);
                          }}
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
                          onChange={(event, newValue) => {
                            setSelectedGroup(newValue);
                          }}
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
                        {filteredVehiculos.map((row, index) => {
                          const tieneCoordenadas =
                            typeof row.latitude === "number" &&
                            typeof row.longitude === "number";

                          return (
                            <TableRow
                              key={index}
                              hover
                              role="checkbox"
                              tabIndex={-1}
                              onClick={
                                tieneCoordenadas
                                  ? () => setVehiculoActual(row.id)
                                  : () => {}
                              }
                              sx={{ cursor: "pointer" }}
                            >
                              {columns.map((column, index) => {
                                const value = row[column.id];
                                const status = definirColorDeEstado(
                                  row["status"]
                                );
                                const statusText =
                                  row.status === "online"
                                    ? "En Línea"
                                    : row.status === "offline"
                                    ? getTimeAgo(row.lastupdate)
                                    : "Desconocido";
                                return (
                                  <TableCell key={index} align={column.align}>
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
                                            {row["uniqueid"] || ""}
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
            <MapContainer
              style={{ width: "100%", height: "100%" }}
              center={[-9.9306, -76.2422]}
              zoom={2}
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
                    maxZoom={19} // Carto Voyager suele ir hasta zoom 19
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
              {vehiculos.map((vehiculo, index) => {
                const icon = L.icon({
                  iconUrl:
                    "https://cdn-icons-png.flaticon.com/128/809/809998.png",
                  iconSize: [32, 32], // Tamaño del icono
                  iconAnchor: [16, 16], // Punto del icono que se alineará con la posición del marcador
                  popupAnchor: [1, -12], // Punto desde el que se abrirá el popup en relación al icono
                });
                return (
                  <Marker
                    key={index}
                    title={vehiculo?.name}
                    position={[
                      vehiculo?.latitude || 0,
                      vehiculo?.longitude || 0,
                    ]}
                    icon={icon}
                    eventHandlers={{
                      click: () => setVehiculoActual(vehiculo.id), // Maneja el clic en el marcador
                    }}
                  >
                    {vehiculoActual === vehiculo.id && (
                      <LeafletCircle
                        center={[
                          vehiculo?.latitude || 0,
                          vehiculo?.longitude || 0,
                        ]}
                        radius={5} // Radio en metros
                        color="rgba(0, 128, 0, 0.0)" // Color del borde en formato RGBA (verde opaco)
                        fillColor="rgba(0, 128, 0, 0.3)"
                        fillOpacity={1} // Opacidad del relleno
                      />
                    )}
                  </Marker>
                );
              })}
              {geofences.map((row, index) => {
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
                    <Polygon
                      key={index}
                      positions={data.points}
                      color={color}
                    />
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
                    <Polyline
                      key={index}
                      positions={data.points}
                      color={color}
                    />
                  );
                }
                return null;
              })}
              {vehiculoActual && routeCoordinates.length > 1 && (
                <Polyline
                  positions={routeCoordinates}
                  strokeWidth={2}
                  strokeColor="secondary.main"
                />
              )}
              <CameraMapOnPoint
                lat={camera?.lat}
                lng={camera?.lng}
                zoom={camera?.zoom}
              />
            </MapContainer>
            {vehiculoActual && (
              <Paper
                sx={{
                  position: "absolute",
                  zIndex: 500,
                  bottom: 0,
                  right: 0,
                  borderRadius: 0,
                  width: {
                    xs: "calc(100% - 150px)",
                    md: "480px",
                  },
                  margin: 0,
                }}
              >
                <Stack direction={"column"} style={{ position: "relative" }}>
                  <Button
                    color="primary"
                    fullWidth
                    onClick={() => setVehiculoActual(null)}
                  >
                    <ExpandMore fontSize={isMd ? "medium" : "small"} />
                  </Button>
                  <>
                    <Typography
                      variant={isMd ? "h4" : "h5"}
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        color: "primary.main",
                      }}
                    >
                      {vehiculos.find((v) => v.id == vehiculoActual)?.name ||
                        "-"}
                    </Typography>
                    <Grid container spacing={isMd ? 2 : 1} sx={{ margin: 0 }}>
                      <Grid item xs={12} md={6}>
                        <Stack
                          direction="row"
                          spacing={isMd ? 2 : 1}
                          alignItems="flex-start"
                        >
                          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                            Velocidad:
                          </Typography>
                          <Typography variant={isMd ? "body1" : "caption"}>
                            {Number(
                              vehiculos.find((v) => v.id == vehiculoActual)
                                ?.speed || 0
                            ).toFixed(2)}{" "}
                            Km/h
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack
                          direction="row"
                          spacing={isMd ? 2 : 1}
                          alignItems="flex-start"
                        >
                          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
                            Estado:
                          </Typography>
                          <Typography variant={isMd ? "body1" : "caption"}>
                            {(vehiculos.find((v) => v.id == vehiculoActual)
                              ?.status === "online"
                              ? "En linea"
                              : "Fuera de linea") || "Desconocido"}
                          </Typography>
                        </Stack>
                      </Grid>
                      {isMd && (
                        <>
                          <Grid item xs={12} md={6}>
                            <Stack
                              direction="row"
                              spacing={isMd ? 2 : 1}
                              alignItems="flex-start"
                            >
                              <Typography
                                variant="h5"
                                sx={{ fontWeight: "bold" }}
                              >
                                Modelo:
                              </Typography>
                              <Typography variant={isMd ? "body1" : "caption"}>
                                {vehiculos.find((v) => v.id == vehiculoActual)
                                  ?.model || "-"}
                              </Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Stack
                              direction="row"
                              spacing={isMd ? 2 : 1}
                              alignItems="flex-start"
                            >
                              <Typography
                                variant="h5"
                                sx={{ fontWeight: "bold" }}
                              >
                                Conductor:
                              </Typography>
                              <Typography variant={isMd ? "body1" : "caption"}>
                                {vehiculos.find((v) => v.id == vehiculoActual)
                                  ?.driver || "-"}
                              </Typography>
                            </Stack>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Stack
                              direction="row"
                              spacing={isMd ? 2 : 1}
                              alignItems="flex-start"
                            >
                              <Typography
                                variant="h5"
                                sx={{ fontWeight: "bold" }}
                              >
                                Rumbo:
                              </Typography>
                              <Typography
                                variant={isMd ? "body1" : "caption"}
                                sx={{ position: "relative" }}
                              >
                                <Box
                                  position="absolute"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transform: `translate(-50%, -50%) rotate(${
                                      vehiculos.find(
                                        (v) => v.id == vehiculoActual
                                      )?.course + 90 || 0
                                    }deg)`, // Rota el ícono según el heading
                                  }}
                                >
                                  <ArrowBack color="primary" />
                                </Box>
                              </Typography>
                            </Stack>
                          </Grid>
                        </>
                      )}
                    </Grid>
                    <GoogleStreetView
                      latitude={
                        vehiculos.find((v) => v.id == vehiculoActual)
                          .latitude || 0
                      }
                      longitude={
                        vehiculos.find((v) => v.id == vehiculoActual)
                          .longitude || 0
                      }
                      heading={
                        vehiculos.find((v) => v.id == vehiculoActual)?.course ||
                        0
                      }
                    />
                  </>
                </Stack>
              </Paper>
            )}
          </Box>
        </Paper>
      ) : (
        <Paper sx={{ width: "100%", overflow: "hidden" }} className="p-3">
          <div className="alert alert-warning" role="alert">
            No tiene ningún vehículo asignado.
          </div>
        </Paper>
      )}
    </Box>
  );
};
