import React, { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Snackbar,
  Backdrop,
  useMediaQuery,
  useTheme,
  Button,
} from "@mui/material";
import { WSS_INTERCEPTOR } from "../utils/common";
import RotatedMarker from "../components/RotatedMarker";

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

// Component to handle map view animation
const MapViewHandler = ({ devices }) => {
  const map = useMap();
  const initialized = useRef(false);

  useEffect(() => {
    if (devices.length > 0 && !initialized.current) {
      const points = devices.map((device) => [
        device.latitude,
        device.longitude,
      ]);
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
      initialized.current = true;
    }
  }, [devices, map]);

  return null;
};

export const Landing = () => {
  const location = useLocation();
  const [devices, setDevices] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadingState, setLoadingState] = useState("connecting"); // connecting, connected, error
  const wsRef = useRef(null);

  // Use theme and media query for responsive layout
  const theme = useTheme();
  const navigate = useNavigate();
  const isDesktopOrTablet = useMediaQuery(theme.breakpoints.up("sm"));

  // Clean up function for websocket
  const cleanupWebSocket = () => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;

      if (
        wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING
      ) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const t = params.get("t");

    if (!t) {
      setErrorMessage(
        'La URL no contiene el parámetro "t" con el token de acceso.'
      );
      setLoadingState("error");
      return;
    }

    const wsUrl = `${WSS_INTERCEPTOR}guest?t=${t}`;

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
      console.log("Limpiando componente Map");
      cleanupWebSocket();
    };
  }, [location.search]); // Only re-run if the URL search params change

  // Handle error message dismissal
  const handleCloseError = () => {};

  // Styles for map and info container
  const containerStyle = {
    height: "100vh",
    width: "100%",
    overflow: "hidden",
    display: "flex",
    flexDirection: isDesktopOrTablet ? "row" : "column",
    backgroundColor: "#f0f2f5",
  };

  return (
    <Box sx={containerStyle}>
      {/* Map container */}
      <Box
        sx={{
          flex: isDesktopOrTablet ? 2 : 2,
          position: "relative",
          height: isDesktopOrTablet ? "100%" : "50%",
        }}
      >
        {loadingState === "connected" && (
          <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
            <MapContainer
              center={[-9.92998, -76.2422]}
              zoom={14}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
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
                  />
                );
              })}
              <MapViewHandler devices={devices} />
            </MapContainer>
          </Box>
        )}
      </Box>

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
        open={loadingState === "error"}
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
