import React, { createContext, useState, useEffect, useRef } from "react";
import { Backdrop, Box, Typography, IconButton, Tooltip } from "@mui/material";
import AlarmSound from "../assets/sounds/electric.mp3";
import SosSound from "../assets/sounds/sirena.mp3";
import PoliceSound from "../assets/sounds/police.mp3";
import GeofenceEnterSound from "../assets/sounds/geofence-enter.mp3";
import GeofenceExitSound from "../assets/sounds/geofence-exit.mp3";
import IgnitionOnSound from "../assets/sounds/ignition-on.mp3";
import IgnitionOffSound from "../assets/sounds/ignition-off.mp3";
import ImgRobo from "../assets/images/car-alarm.png"; // Para 'alarm'
import ImgSos from "../assets/images/mala-persona.png"; // Para 'sos'
import ImgAlert from "../assets/images/sos.png"; // Para 'info' y otros
import { playSound, stopSound } from "../utils/audioManager";
import {
  createSession,
  decodeBase64,
  getSession,
  WSS_INTERCEPTOR,
} from "../utils/common";

export const WebSocketContext = createContext();

export const WebSocketProvider = ({ children }) => {
  const [ws, setWs] = useState(null);
  const [devices, setDevices] = useState([]);
  const [event, setEvent] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertImage, setAlertImage] = useState(null);
  const [isBlinking, setIsBlinking] = useState(false);
  const [alertType, setAlertType] = useState(""); // 'sos', 'alarm', 'info'

  const alertTimeoutRef = useRef(null);

  const handleOpenAlert = (speak, message, image, soundSrc, type) => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }

    playSound(soundSrc);
    setAlertMessage(message);
    setAlertImage(image);
    setAlertType(type);
    setShowAlert(true);
    speakText(speak);

    if (type !== "sos") {
      // 'alarm' e 'info' se cerrarán automáticamente
      alertTimeoutRef.current = setTimeout(() => {
        handleCloseAlert();
      }, 10000); // 10 segundos
    }
  };

  const handleCloseAlert = () => {
    setShowAlert(false);
    stopSound();
    window.speechSynthesis.cancel();
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
      alertTimeoutRef.current = null;
    }
  };

  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    let interval;
    if (showAlert) {
      interval = setInterval(() => {
        setIsBlinking((prev) => !prev);
      }, 500);
    } else {
      setIsBlinking(false);
    }
    return () => clearInterval(interval);
  }, [showAlert]);

  useEffect(() => {
    const { username, password } = decodeBase64(getSession("SESSION_TOKEN"));
    if (!username || !password) {
      console.error("No se encontraron las credenciales de WebSocket");
      return;
    }

    const wsUrl = WSS_INTERCEPTOR + `?u=${username}&p=${password}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => console.log("Conexión WebSocket establecida");

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Mensaje recibido:", data);
        if (data.devices) {
          setDevices((prevDevices) =>
            mergeDeviceUpdates(prevDevices, data.devices)
          );
        }
        if (data.event) {
          const eventDetails = data.event;
          setEvent(eventDetails);

          const eventTime = new Date(eventDetails.eventtime);
          eventTime.setHours(eventTime.getHours() - 5); // Ajuste de zona horaria -5 UTC

          const now = new Date();
          let formattedTime;

          if (
            eventTime.getFullYear() === now.getFullYear() &&
            eventTime.getMonth() === now.getMonth() &&
            eventTime.getDate() === now.getDate()
          ) {
            // Mismo día: solo hora
            formattedTime =
              "a las " +
              eventTime.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });
          } else {
            // Diferente día: fecha y hora completas
            formattedTime =
              "el " +
              eventTime.toLocaleString("es-ES", {
                day: "numeric",
                month: "short", // 'short' para mes abreviado (e.g., "ene.")
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
          }

          let speak, message, image, soundSrc, type;

          switch (eventDetails.type) {
            case "alarm":
              message = `Movimiento inusual en el vehículo ${eventDetails.name} ${formattedTime}`;
              speak = `Movimiento inusual en el vehículo ${eventDetails.name}`;
              image = ImgRobo;
              soundSrc = AlarmSound;
              type = "alarm";
              break;
            case "sos":
              message = `¡SOS ACTIVADO! en el vehículo ${
                eventDetails.name
              } ${formattedTime}, puede comunicarse con los siguientes números: ${eventDetails.contactos
                .map((contacto) => contacto.phone)
                .join(", ")}`;
              speak = `Se ha activado la alerta S.O.S en el vehículo ${eventDetails.name}`;
              image = ImgSos;
              soundSrc = SosSound;
              type = "sos";
              break;
            case "ignitionOn":
              message = `Se encendió el vehículo ${eventDetails.name} ${formattedTime}`;
              speak = `Se ha encendido el vehículo ${eventDetails.name}`;
              image = ImgAlert;
              soundSrc = IgnitionOnSound;
              type = "info";
              break;
            case "ignitionOff":
              message = `Se apagó el vehículo ${eventDetails.name} ${formattedTime}`;
              speak = `Se ha apagado el vehículo ${eventDetails.name}`;
              image = ImgAlert;
              soundSrc = IgnitionOffSound;
              type = "info";
              break;
            case "geofenceEnter":
              message = `El vehículo ${eventDetails.name} ingresó a la geocerca ${eventDetails.geofencename} ${formattedTime}`;
              speak = `El vehículo ${eventDetails.name} entró a la geocerca ${eventDetails.geofencename}`;
              image = ImgAlert;
              soundSrc = GeofenceEnterSound;
              type = "info";
              break;
            case "geofenceExit":
              message = `El vehículo ${eventDetails.name} salió de la geocerca ${eventDetails.geofencename} ${formattedTime}`;
              speak = `El vehículo ${eventDetails.name} salió de la geocerca ${eventDetails.geofencename}`;
              image = ImgAlert;
              soundSrc = GeofenceExitSound;
              type = "info";
              break;
            case "deviceOverspeed":
              message = `El vehículo ${eventDetails.name} excedió el límite de velocidad ${formattedTime}`;
              speak = `El vehículo ${eventDetails.name} excedió el límite de velocidad`;
              image = ImgAlert;
              soundSrc = PoliceSound;
              type = "info";
              break;
            case "lowBattery":
              message = `Batería baja en el vehículo ${eventDetails.name} ${formattedTime}`;
              speak = `Batería baja en el vehículo ${eventDetails.name}`;
              image = ImgAlert;
              soundSrc = AlarmSound;
              type = "info";
              break;
            case "deviceOffline":
              message = `El dispositivo del vehículo ${eventDetails.name} está desconectado ${formattedTime}`;
              speak = `El dispositivo del vehículo ${eventDetails.name} está desconectado`;
              image = ImgAlert;
              soundSrc = AlarmSound;
              type = "info";
              break;
            case "deviceOnline":
              message = `El dispositivo del vehículo ${eventDetails.name} está conectado nuevamente ${formattedTime}`;
              speak = `El dispositivo del vehículo ${eventDetails.name} está conectado nuevamente`;
              image = ImgAlert;
              soundSrc = AlarmSound;
              type = "info";
              break;
            default:
              message = `Alerta ${eventDetails.type} en el vehículo ${eventDetails.name} ${formattedTime}`;
              speak = `Alerta de ${eventDetails.type} en el vehículo ${eventDetails.name}`;
              image = ImgAlert;
              soundSrc = AlarmSound;
              type = "info";
              break;
          }

          if (notificacionPermitida(eventDetails.type)) {
            handleOpenAlert(speak, message, image, soundSrc, type);
          }
        }
      } catch (error) {
        console.error("Error al procesar mensaje:", error);
      }
    };

    websocket.onerror = (error) => console.error("Error en WebSocket:", error);
    websocket.onclose = (event) =>
      console.log("Conexión WebSocket cerrada:", event);

    setWs(websocket);

    return () => {
      console.log(
        "Cerrando conexión WebSocket y limpiando temporizador de alerta"
      );
      if (websocket) websocket.close();
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  const obtenerNotificacionesActivas = () => {
    try {
      const data = getSession("NOTIFICACIONES_ACTIVAS");
      if (data === null || data === undefined) return [];
      if (!Array.isArray(data)) {
        createSession("NOTIFICACIONES_ACTIVAS", []);
        return [];
      }
      return data;
    } catch (error) {
      return [];
    }
  };

  const notificacionPermitida = (type) => {
    if (!type || typeof type !== "string") return false;
    try {
      return obtenerNotificacionesActivas().includes(type);
    } catch (error) {
      return false;
    }
  };

  // Determinar el color del fondo del Backdrop según el tipo de alerta
  const getBackdropBackgroundColor = () => {
    if (!isBlinking) return "rgba(0,0,0,0)"; // Transparente si no parpadea

    switch (alertType) {
      case "sos":
        return "rgba(255, 0, 0, 0.1)"; // Rojo
      case "alarm":
        return "rgba(255, 165, 0, 0.15)"; // Naranja/Ámbar (un poco más opaco para 'warning')
      case "info":
      default:
        return "rgba(0, 0, 255, 0.1)"; // Azul
    }
  };

  // Determinar el color principal del Box y el texto del botón
  const getMainAlertColor = (property = "main") => {
    switch (alertType) {
      case "sos":
        return `error.${property}`; // Rojo
      case "alarm":
        return `warning.${property}`; // Naranja/Ámbar
      case "info":
      default:
        return `info.${property}`; // Azul
    }
  };

  /**
   * Combina un estado actual de dispositivos con una nueva lista.
   * @param {Array<Object>} currentDevices - El array actual de dispositivos.
   * @param {Array<Object>} newDevicesUpdate - El nuevo array con las actualizaciones.
   * @returns {Array<Object>} Un nuevo array con los dispositivos combinados.
   */
  function mergeDeviceUpdates(currentDevices, newDevicesUpdate) {
    const deviceMap = new Map(
      currentDevices.map((device) => [device.id, device])
    );

    for (const newDeviceData of newDevicesUpdate) {
      // Si el dispositivo ya existe, combina sus datos. Si no, lo añade.
      // Usamos el spread operator para asegurarnos de que si llegan propiedades parciales,
      // no se pierda el resto de la información del objeto.
      const existingDevice = deviceMap.get(newDeviceData.id) || {};
      deviceMap.set(newDeviceData.id, { ...existingDevice, ...newDeviceData });
    }

    return Array.from(deviceMap.values());
  }

  return (
    <WebSocketContext.Provider
      value={{
        ws,
        devices,
        event,
        showAlert,
        alertMessage,
        alertImage,
        alertType,
        handleCloseAlert,
      }}
    >
      {children}
      <Backdrop
        sx={{
          color: "#fff",
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: getBackdropBackgroundColor(),
          transition: "background-color 0.4s ease", // Transición un poco más rápida
        }}
        open={showAlert}
        onClick={handleCloseAlert}
      >
        <Box
          onClick={(e) => e.stopPropagation()}
          sx={{
            p: { xs: 3, sm: 4, md: 5 }, // Ajuste de padding
            bgcolor: getMainAlertColor(),
            color: getMainAlertColor("contrastText"), // Para asegurar buen contraste del texto
            borderRadius: 3, // Bordes un poco más suaves
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            maxWidth: "480px",
            width: "90%",
            boxShadow: "0 12px 36px rgba(0,0,0,0.25)",
            animation: "float 3s ease-in-out infinite",
            "@keyframes float": {
              "0%, 100%": { transform: "translateY(0px)" },
              "50%": { transform: "translateY(-8px)" }, // Menor flotación
            },
          }}
        >
          <Typography
            variant="h5"
            component="h2"
            sx={{
              mb: 2,
              fontWeight: "600",
              color: getMainAlertColor("contrastText"),
            }}
          >
            ¡Alerta de Sistema!
          </Typography>
          {alertImage && (
            <img
              src={alertImage}
              alt="Alerta"
              width={80}
              height={80}
              style={{ marginBottom: 24, borderRadius: "10%" }}
            />
          )}
          <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
            {alertMessage}
          </Typography>
          <Tooltip title="Cerrar Alerta">
            <IconButton
              onClick={handleCloseAlert}
              sx={{
                bgcolor: getMainAlertColor("contrastText"), // Fondo blanco o el que contraste
                color: getMainAlertColor(), // Texto del color de la alerta
                p: "10px 20px",
                fontSize: "0.95rem",
                fontWeight: "bold",
                borderRadius: 2,
              }}
            >
              Cerrar
            </IconButton>
          </Tooltip>
          <Typography
            variant="caption"
            color="inherit"
            sx={{ opacity: 0.7, mt: 2 }}
          >
            O haz clic fuera del recuadro para cerrar.
          </Typography>
        </Box>
      </Backdrop>
    </WebSocketContext.Provider>
  );
};
