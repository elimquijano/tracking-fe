import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  LayersControl,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Snackbar,
  Backdrop,
  useMediaQuery,
  Paper,
  Button,
  Stack,
  Grid,
} from "@mui/material";
import { WSS_INTERCEPTOR } from "../utils/common";
import RotatedMarker from "../components/RotatedMarker";
import Draggable from "react-draggable";
import { ArrowBack } from "@mui/icons-material";
import { theme } from "../theme/theme";
import { IconEngineFilled } from "@tabler/icons-react";
import { Circle as LeafletCircle } from "react-leaflet";

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
const MapController = ({ vehiculoActual, marcadores }) => {
  const map = useMap();

  useEffect(() => {
    if (vehiculoActual) {
      const marcador = marcadores?.find((m) => m.id == vehiculoActual);
      if (marcador?.latitude && marcador?.longitude) {
        map.setView([marcador.latitude, marcador.longitude], 15);
      }
    }
  }, [marcadores, map]);

  useEffect(() => {
    if (vehiculoActual) {
      const marcador = marcadores?.find((m) => m.id == vehiculoActual);
      if (marcador?.latitude && marcador?.longitude) {
        map.flyTo([marcador.latitude, marcador.longitude], 15);
      }
    } else {
      map.flyTo([-9.9306, -76.2422], 17); // Vista por defecto
    }
  }, [vehiculoActual, map]);

  useEffect(() => {
    if (marcadores?.length > 0) {
      const firstVehicle = marcadores[0];
      if (firstVehicle?.latitude && firstVehicle?.longitude) {
        map.setView([firstVehicle.latitude, firstVehicle.longitude], 17);
      }
    } else {
      map.setView([-9.9306, -76.2422], 17); // Vista por defecto
    }
  }, []);

  return null;
};

export const Landing = () => {
  const location = useLocation();
  const [devices, setDevices] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingState, setLoadingState] = useState("connecting"); // connecting, connected, error
  const [vehiculoActual, setVehiculoActual] = useState(null);
  const wsRef = useRef(null);

  const { BaseLayer } = LayersControl;

  // Use theme and media query for responsive layout
  const navigate = useNavigate();
  const isMd = useMediaQuery((theme) => theme.breakpoints.up("md"));

  // Clean up function for websocket
  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      if (
        wsRef.current.readyState == WebSocket.OPEN ||
        wsRef.current.readyState == WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("t");
    const deviceId = params.get("d");

    if (!token || !deviceId) {
      setErrorMessage(
        'La URL no contiene los parámetros "t" con el token de acceso y "d" con el ID del dispositivo.'
      );
      setLoadingState("error");
      return;
    }

    setVehiculoActual(deviceId);

    const wsUrl = `${WSS_INTERCEPTOR}guest?t=${token}`;

    setLoadingState("connecting");
    console.log("Intentando conectar al WebSocket...");

    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log("Conectado al servidor WebSocket");
      setLoadingState("connected");
      wsRef.current.send("Hello Server!");
    };

    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.devices && Array.isArray(data.devices)) {
          setDevices(data.devices);
        }
      } catch (err) {
        console.error("Error al procesar mensaje:", err);
      }
    };

    wsRef.current.onclose = (event) => {
      if (event.wasClean) {
        console.log("Conexión WebSocket cerrada limpiamente.");
        setErrorMessage("El token de acceso ha expirado.");
      } else {
        console.error("Conexión WebSocket cerrada abruptamente.");
        setErrorMessage(
          "El token de acceso ha expirado o es inválido, gracias por usar nuestro servicio."
        );
      }

      setLoadingState("error");
    };

    wsRef.current.onerror = () => {
      console.error("Error en WebSocket");
      setErrorMessage(
        "El token ha expirado o es inválido. La conexión no pudo establecerse."
      );
      setLoadingState("error");
    };

    // Cleanup function
    return () => {
      cleanupWebSocket();
    };
  }, [location.search]); // Only re-run if the URL search params change

  // Handle error message dismissal
  const handleCloseError = () => {};

  const getTimeAgo = useCallback((fechaString) => {
    if (fechaString == null) return "Fuera de linea";

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

  // Styles for map and info container
  const containerStyle = {
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#f0f2f5",
  };

  return (
    <Box sx={containerStyle}>
      {/* Map container */}
      {loadingState == "connected" && (
        <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
          <MapContainer
            style={{ width: "100%", height: "100%" }}
            center={[0, 0]}
            zoom={1}
            zoomControl={false}
          >
            <LayersControl position="topright">
              <BaseLayer name="Carto">
                <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
              </BaseLayer>
              <BaseLayer name="OpenStreetMap">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              </BaseLayer>
              <BaseLayer checked name="Google">
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
            <ZoomControl position="bottomleft" />
            <MapController
              vehiculoActual={vehiculoActual}
              marcadores={devices}
            />
            {devices.map((device) => {
              const vehicleIcon = L.icon({
                iconUrl: getIconUrl(device?.category || "car"),
                iconSize: [42, 48], // Tamaño del icono, puedes ajustarlo según tus necesidades
                iconAnchor: [21, 24], // Punto del icono que corresponderá a la ubicación del marcador
                popupAnchor: [0, -12], // Punto desde el cual se abrirá el popup en relación con iconAnchor
              });
              return (
                <RotatedMarker
                  key={device.id}
                  title={device?.name || "Sin nombre"}
                  position={[device.latitude, device.longitude]}
                  icon={vehicleIcon}
                  rotationOrigin="center center"
                  rotationAngle={(device.course || 0) + 90}
                >
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -20]}
                    opacity={0.8}
                  >
                    {device?.name || "Sin nombre"}
                  </Tooltip>
                </RotatedMarker>
              );
            })}
            {/* Círculo del vehículo seleccionado - SIN key cambiante */}
            {vehiculoActual && (
              <LeafletCircle
                center={[
                  devices?.find((m) => m.id == vehiculoActual)?.latitude || 0,
                  devices?.find((m) => m.id == vehiculoActual)?.longitude || 0,
                ]}
                radius={500}
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
            <Box
              sx={{
                position: "absolute",
                bottom: 25,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                zIndex: 1000,
                pointerEvents: "none", // Permite clics en el mapa
              }}
            >
              <Draggable handle=".handle">
                <Paper
                  onMouseDown={(e) => e.stopPropagation()}
                  sx={{
                    pointerEvents: "auto", // Reactiva eventos para el panel
                    borderRadius: 0,
                    width: { xs: "calc(100% - 50px)", md: "480px" },
                    margin: 0,
                    boxShadow: "0px 0px 15px rgba(0,0,0,0.2)",
                  }}
                >
                  <Stack direction={"column"} style={{ position: "relative" }}>
                    <Stack
                      className="handle"
                      direction={"row"}
                      justifyContent={"space-between"}
                      alignItems={"center"}
                      sx={{
                        cursor: "move",
                      }}
                    >
                      <Typography
                        variant={isMd ? "h4" : "h6"}
                        sx={{
                          fontWeight: "bold",
                          color: "primary.main",
                          padding: 1,
                        }}
                      >
                        {devices.find((v) => v.id == vehiculoActual)?.name ||
                          "-"}
                      </Typography>
                      <></>
                    </Stack>
                    <Box sx={{ padding: 1 }}>
                      <Grid container spacing={isMd ? 1 : 0}>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems={"center"}
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Velocidad:
                            </Typography>
                            <Typography variant={"caption"}>
                              {Number(
                                devices?.find((m) => m.id == vehiculoActual)
                                  ?.speed * 1.852 || 0
                              ).toFixed(2)}{" "}
                              Km/h
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={6} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems={"center"}
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
                                  devices.find((v) => v.id == vehiculoActual)
                                    ?.status
                                ),
                              }}
                            >
                              {devices.find((v) => v.id == vehiculoActual)
                                ?.status == "online"
                                ? "En linea"
                                : getTimeAgo(
                                    devices.find((v) => v.id == vehiculoActual)
                                      ?.lastUpdate
                                  ) || "Desconocido"}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={6} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems={"center"}
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Bateria:
                            </Typography>
                            <Typography variant={"caption"}>
                              {devices?.find((m) => m.id == vehiculoActual)
                                ?.attributes?.batteryLevel || "100"}{" "}
                              %
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems={"center"}
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Distancia Total:
                            </Typography>
                            <Typography variant={"caption"}>
                              {Number(
                                devices?.find((m) => m.id == vehiculoActual)
                                  ?.attributes?.totalDistance / 1000 || 0
                              ).toFixed(2)}{" "}
                              km
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={6} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems={"center"}
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
                                    (devices?.find(
                                      (m) => m.id == vehiculoActual
                                    )?.course || 0) + 90
                                  }deg)`,
                                }}
                              >
                                <ArrowBack color="primary" fontSize="small" />
                              </Box>
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid item xs={6} md={6}>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems={"center"}
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
                                    devices?.find((m) => m.id == vehiculoActual)
                                      ?.attributes?.ignition
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
                            alignItems={"center"}
                          >
                            <Typography
                              variant={"caption"}
                              sx={{ fontWeight: "bold" }}
                            >
                              Última actualización:
                            </Typography>
                            <Typography variant={"caption"}>
                              {restarCincoHoras(
                                devices.find((v) => v.id == vehiculoActual)
                                  ?.lastUpdate || ""
                              )}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  </Stack>
                </Paper>
              </Draggable>
            </Box>
          )}
        </Box>
      )}

      {/* Error message as a snackbar */}
      <Snackbar
        open={!!errorMessage && loadingState !== "error"}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        autoHideDuration={6000}
      >
        <Box
          sx={{
            bgcolor: "error.dark",
            color: "white",
            py: 2,
            px: 3,
            borderRadius: 1,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <Typography variant="body1">{errorMessage}</Typography>
        </Box>
      </Snackbar>

      {/* Error overlay with semi-transparent backdrop */}
      <Backdrop
        sx={{ color: "#fff", zIndex: 1000 }}
        open={loadingState == "error"}
        onClick={handleCloseError}
      >
        <Box
          sx={{
            p: 4,
            bgcolor: "error.main",
            borderRadius: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "80%",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            align="center"
            color="white"
            sx={{ mb: 2 }}
          >
            Error de Conexión
          </Typography>
          <img
            src={require("../assets/images/advertencia.png")}
            alt="Error"
            width={100}
            height={100}
            style={{ marginBottom: 16 }}
          />
          <Typography variant="body1" align="center" color="white">
            {errorMessage}
          </Typography>
          <Button
            color="warning"
            onClick={() => navigate("/login")}
            variant="contained"
            sx={{ margin: 2 }}
          >
            Ir a Login
          </Button>
        </Box>
      </Backdrop>
    </Box>
  );
};
