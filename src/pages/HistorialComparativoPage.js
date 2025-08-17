import * as React from "react";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  LayersControl,
  TileLayer,
  Polyline,
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
  Chip,
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
import { useMap } from "react-leaflet";
import { getTraccar, LOCATIONIQ_ACCESS_TOKEN } from "../utils/common";
import { notificationSwal } from "../utils/swal-helpers";
import { columnsTPositionsList } from "../utils/ExportColumns";
import RotatedMarker from "../components/RotatedMarker";
import { exportToExcel } from "../utils/exportToExcel";
import { useTheme as useCustomTheme } from "../contexts/ThemeContext";

const vehicleColors = ["#1976d2", "#d32f2f", "#388e3c"]; // Blue, Red, Green

const getIconUrl = (category, color) => {
  // For simplicity, we'll use the same icon but ideally, you could have different colored icons
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

export const HistorialComparativoPage = () => {
  const { isDarkMode } = useCustomTheme();
  const [searchFilter, setSearchFilter] = useState({
    date_filter: "today",
    deviceIds: [],
  });
  const [positions, setPositions] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [vehiculos, setVehiculos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [showForm, setShowForm] = useState(true);
  const [paused, setPaused] = useState(true);
  const [mapCenter, setMapCenter] = useState([-9.930648, -76.241496]);
  const [mapZoom, setMapZoom] = useState(7);
  const [mapKey, setMapKey] = useState(Date.now());
  const [currentPositions, setCurrentPositions] = useState({}); // { deviceId: position }
  const [paths, setPaths] = useState({}); // { deviceId: [[lat, lng]] }
  const { BaseLayer } = LayersControl;

  const getIcon = (category, color) =>
    new L.icon({
      iconUrl: getIconUrl(category),
      iconSize: [42, 48],
      iconAnchor: [21, 24],
      popupAnchor: [0, -12],
    });

  useEffect(() => {
    const fetchVehiculos = async () => {
      try {
        const result = await getTraccar("/devices");
        if (result.status === 200) {
          setVehiculos(result.data);
        }
      } catch (error) {
        console.error("Error fetching devices:", error);
      }
    };
    fetchVehiculos();
  }, []);

  useEffect(() => {
    let intervalId = null;
    if (!paused && totalItems > 0) {
      intervalId = setInterval(() => {
        setSliderValue((prev) => {
          const next = prev + 1;
          if (next >= totalItems) {
            setPaused(true);
            return prev;
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(intervalId);
  }, [paused, totalItems]);

  useEffect(() => {
    if (positions.length > 0) {
      const currentData = positions[sliderValue];
      if (currentData) {
        setCurrentPositions((prev) => ({
          ...prev,
          [currentData.deviceId]: currentData,
        }));
      }
    }
  }, [sliderValue, positions]);

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
      // Add other cases as needed
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

  const handleConsultar = async () => {
    if (searchFilter.deviceIds.length === 0 || searchFilter.deviceIds.length > 3) {
      notificationSwal("Error de validación", "Seleccione de 1 a 3 vehículos.", "error");
      return;
    }
    setIsLoading(true);
    const { from, to } = calculateDateRange(searchFilter.date_filter);

    try {
      const promises = searchFilter.deviceIds.map(deviceId =>
        getTraccar(`/positions?deviceId=${deviceId}&from=${from}&to=${to}`)
      );
      const results = await Promise.all(promises);

      const allPositions = results.flatMap(result => result.data);
      allPositions.sort((a, b) => new Date(a.fixTime) - new Date(b.fixTime));

      if (allPositions.length > 0) {
        setPositions(allPositions);
        setTotalItems(allPositions.length);
        
        const initialPositions = {};
        const newPaths = {};
        searchFilter.deviceIds.forEach(id => {
            const vehiclePositions = allPositions.filter(p => p.deviceId === id);
            if(vehiclePositions.length > 0) {
                initialPositions[id] = vehiclePositions[0];
                newPaths[id] = vehiclePositions.map(p => [p.latitude, p.longitude]);
            }
        });

        setPaths(newPaths);
        setCurrentPositions(initialPositions);
        setSliderValue(0);
        setMapCenter([allPositions[0].latitude, allPositions[0].longitude]);
        setMapZoom(14);
        setMapKey(Date.now());
        setShowForm(false);
      } else {
        notificationSwal("No hay datos", "No se encontraron datos para los vehículos seleccionados.", "error");
      }
    } catch (error) {
      notificationSwal("Error", error?.message || "Error al obtener datos", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowForm = () => {
    setShowForm(true);
    setPositions([]);
    setPaths({});
    setCurrentPositions({});
    setSliderValue(0);
    setTotalItems(0);
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
    <Box sx={{ height: "100%" }}>
      <Paper sx={{ width: "100%", height: "100%", overflow: "hidden", padding: 1 }}>
        <Box sx={{ position: "relative", height: "100%" }}>
          <Paper sx={{ position: "absolute", zIndex: 500, margin: 1 }}>
            {showForm ? (
              <Paper elevation={3} sx={{ p: 2, minWidth: 300 }}>
                <Stack spacing={2}>
                  <Typography variant="h6">Historial Comparativo</Typography>
                  <Autocomplete
                    multiple
                    limitTags={2}
                    options={vehiculos}
                    getOptionLabel={(option) => option.name}
                    value={vehiculos.filter(v => searchFilter.deviceIds.includes(v.id))}
                    onChange={(event, newValue) => {
                      setSearchFilter(prev => ({
                        ...prev,
                        deviceIds: newValue.map(v => v.id),
                      }));
                    }}
                    getOptionDisabled={(option) =>
                      searchFilter.deviceIds.length >= 3 && !searchFilter.deviceIds.includes(option.id)
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Seleccione hasta 3 Vehículos" />
                    )}
                  />
                  <Select
                    fullWidth
                    size="small"
                    value={searchFilter.date_filter}
                    onChange={(e) => setSearchFilter(prev => ({...prev, date_filter: e.target.value}))}
                  >
                    <MenuItem value="today">Hoy</MenuItem>
                    <MenuItem value="yesterday">Ayer</MenuItem>
                  </Select>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    disabled={isLoading}
                    onClick={handleConsultar}
                    startIcon={<Search />}
                  >
                    {isLoading ? "Cargando..." : "BUSCAR"}
                  </Button>
                </Stack>
              </Paper>
            ) : (
              <Box sx={{ p: 2, minWidth: 300 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                  <IconButton onClick={handleShowForm} aria-label="filtros">
                    <Tune />
                  </IconButton>
                  <IconButton onClick={() => {}} aria-label="exportar">
                    <GetApp />
                  </IconButton>
                </Stack>
                <Slider
                  value={sliderValue}
                  onChange={(e, val) => setSliderValue(val)}
                  min={0}
                  max={totalItems > 0 ? totalItems - 1 : 0}
                />
                <Grid container spacing={1} alignItems="center" justifyContent="space-between">
                  <Grid item xs={3} sx={{ textAlign: "left" }}>
                    <Typography variant="caption">
                      {totalItems > 0 ? sliderValue + 1 : 0}/{totalItems}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: "center" }}>
                    <IconButton onClick={() => setSliderValue(prev => Math.max(0, prev - 1))}>
                      <FastRewindRounded />
                    </IconButton>
                    <IconButton onClick={() => setPaused(!paused)} disabled={sliderValue === totalItems - 1}>
                      {paused ? <PlayArrowRounded /> : <PauseRounded />}
                    </IconButton>
                    <IconButton onClick={() => setSliderValue(prev => Math.min(totalItems - 1, prev + 1))}>
                      <FastForwardRounded />
                    </IconButton>
                  </Grid>
                  <Grid item xs={3} sx={{ textAlign: "right" }}>
                    <Typography variant="caption">
                      {restarCincoHoras(positions[sliderValue]?.fixTime) || ""}
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
               <BaseLayer checked={!isDarkMode} name="Carto">
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
            </LayersControl>
            
            {Object.entries(paths).map(([deviceId, path], index) => (
                <Polyline
                    key={deviceId}
                    positions={path}
                    color={vehicleColors[index % vehicleColors.length]}
                    weight={3}
                />
            ))}

            {Object.values(currentPositions).map((pos, index) => {
              const vehicle = vehiculos.find(v => v.id === pos.deviceId);
              if (!vehicle) return null;
              return (
                <RotatedMarker
                  key={pos.deviceId}
                  position={[pos.latitude, pos.longitude]}
                  icon={getIcon(vehicle.category, vehicleColors[index % vehicleColors.length])}
                  rotationOrigin={"center center"}
                  rotationAngle={pos.course + 90 || 0}
                >
                  <Tooltip permanent direction="top" offset={[0, -20]} opacity={0.8}>
                    <div style={{ textAlign: "center", color: vehicleColors[index % vehicleColors.length] }}>
                      <strong>{vehicle.name}</strong>
                      <br />
                      {restarCincoHoras(pos.fixTime)}
                      <br />
                      <strong>{Math.round(pos.speed * 1.852)} km/h</strong>
                    </div>
                  </Tooltip>
                </RotatedMarker>
              );
            })}
          </MapContainer>
        </Box>
      </Paper>
    </Box>
  );
};
