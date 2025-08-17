import { useState, useRef, useEffect } from "react";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
  Avatar,
  Badge,
  Box,
  Button,
  ButtonBase,
  Card,
  CardActions,
  Chip,
  ClickAwayListener,
  Divider,
  Grid,
  IconButton,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";

// assets
import { useContext } from "react";
import { WebSocketContext } from "../contexts/SocketContext";
import { Notifications } from "@mui/icons-material";
import NotificationList from "./NotificationList";
import Transitions from "./Transitions";

// notification status options
const status = [
  {
    value: "all",
    label: "Todas las notificaciones",
  },
  {
    value: "read",
    label: "Leídas",
  },
  {
    value: "unread",
    label: "No leídas",
  },
];

// ==============================|| NOTIFICATION ||============================== //

const NotificationSection = () => {
  const theme = useTheme();
  const matchesXs = useMediaQuery(theme.breakpoints.down("md"));

  const { event } = useContext(WebSocketContext);

  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] =
    useState(notifications);

  /**
   * anchorRef is used on different componets and specifying one type leads to other components throwing an error
   * */
  const anchorRef = useRef(null);

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }
    setOpen(false);
  };

  const prevOpen = useRef(open);

  useEffect(() => {
    if (prevOpen.current === true && open === false) {
      anchorRef.current.focus();
    }
    if (open) {
      readAllNotifications();
    }

    prevOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!event) return;

    const formattedTime = restarCincoHoras(event.eventTime);

    let parseEvent = {
      image: "sos.png",
      title: "Nueva notificación",
      description: "Descripción de la notificación",
      time: formattedTime,
      unread: !open,
    };
    switch (event.type) {
      case "alarm":
        parseEvent = {
          ...parseEvent,
          title: "¡Alarma activada!",
          description: `Movimiento inusual en el vehículo ${event.name} el ${formattedTime}`,
          image: "car-alarm.png",
        };
        break;
      case "sos":
        parseEvent = {
          ...parseEvent,
          title: "¡SOS recibido!",
          description: `¡SOS ACTIVADO! en el vehículo ${event.name} el ${formattedTime}, puede comunicarse con los siguientes números: ${event.contact}`,
          image: "mala-persona.png",
        };
        break;
      case "ignitionOn":
        parseEvent = {
          ...parseEvent,
          title: "Encendido de motor",
          description: `Se encendió el vehículo ${event.name} el ${formattedTime}`,
          image: "key.png",
        };
        break;
      case "ignitionOff":
        parseEvent = {
          ...parseEvent,
          title: "Apagado de motor",
          description: `Se apagó el vehículo ${event.name} el ${formattedTime}`,
          image: "key.png",
        };
        break;
      case "geofenceEnter":
        parseEvent = {
          ...parseEvent,
          title: "Entrada a geocerca",
          description: `El vehículo ${event.name} ha entrado a la geocerca ${event.geofenceName} el ${formattedTime}`,
          image: "geo-fencing.png",
        };
        break;
      case "geofenceExit":
        parseEvent = {
          ...parseEvent,
          title: "Salida de geocerca",
          description: `El vehículo ${event.name} ha salido de la geocerca ${event.geofenceName} el ${formattedTime}`,
          image: "geo-fencing.png",
        };
        break;
      case "deviceOverspeed":
        parseEvent = {
          ...parseEvent,
          title: "Exceso de velocidad",
          description: `El vehículo ${event.name} ha superado el límite de velocidad permitido el ${formattedTime}`,
          image: "speedcar.png",
        };
        break;
      case "lowBattery":
        parseEvent = {
          ...parseEvent,
          title: "Batería baja",
          description: `El dispositivo del vehículo ${event.name} tiene batería baja el ${formattedTime}`,
        };
        break;
      case "deviceOffline":
        parseEvent = {
          ...parseEvent,
          title: "Fuera de línea",
          description: `El dispositivo del vehículo ${event.name} se ha desconectado el ${formattedTime}`,
        };
        break;
      case "deviceOnline":
        parseEvent = {
          ...parseEvent,
          title: "En línea",
          description: `El dispositivo del vehículo ${event.name} se ha conectado el ${formattedTime}`,
        };
        break;
      case "deviceMoving":
        parseEvent = {
          ...parseEvent,
          title: "Vehículo en movimiento",
          description: `El vehículo ${event.name} ha comenzado a moverse el ${formattedTime}`,
        };
        break;
      case "deviceStopped":
        parseEvent = {
          ...parseEvent,
          title: "Vehículo detenido",
          description: `El vehículo ${event.name} ha detenido su movimiento el ${formattedTime}`,
        };
        break;
      default:
        parseEvent = {
          ...parseEvent,
          title: event.type,
          description: `Tipo de notificación desconocido para el vehículo ${event.name} el ${formattedTime}`,
        };
        break;
    }
    setNotifications((prevNotifications) => [...prevNotifications, parseEvent]);
  }, [event]);

  useEffect(() => {
    switch (value) {
      case "all":
        setFilteredNotifications(notifications.slice().reverse());
        break;
      case "unread":
        setFilteredNotifications(
          notifications
            .filter((notification) => notification.unread)
            .slice()
            .reverse()
        );
        break;
      case "read":
        setFilteredNotifications(
          notifications
            .filter((notification) => !notification.unread)
            .slice()
            .reverse()
        );
        break;
      default:
        setFilteredNotifications(notifications.slice().reverse());
    }
  }, [value, notifications]);

  const handleChange = (event) => {
    if (event?.target.value) setValue(event?.target.value);
  };

  function restarCincoHoras(fechaString) {
    // 1. Creamos un objeto Date a partir del string.
    // Es importante reemplazar el espacio por una 'T' para que sea un formato ISO 8601
    // y evitar problemas de interpretación entre navegadores.
    const fecha = new Date(fechaString.replace(" ", "T"));

    // 2. Le restamos 5 horas a la fecha.
    //fecha.setHours(fecha.getHours() - 5);

    // 3. Extraemos cada parte de la nueva fecha.
    const anio = fecha.getFullYear();
    // getMonth() devuelve 0-11, por eso sumamos 1.
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const horas = String(fecha.getHours()).padStart(2, "0");
    const minutos = String(fecha.getMinutes()).padStart(2, "0");
    const segundos = String(fecha.getSeconds()).padStart(2, "0");

    // 4. Unimos todo en el formato deseado y lo retornamos.
    return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
  }

  const handleEliminarNotificaciones = () => {
    setNotifications([]);
  };

  const readAllNotifications = () => {
    const updatedNotifications = notifications.map((notification) => ({
      ...notification,
      unread: false,
    }));
    setNotifications(updatedNotifications);
  };

  return (
    <>
      <IconButton ref={anchorRef} color="inherit" onClick={handleToggle}>
        <Badge
          badgeContent={
            filteredNotifications.filter(
              (notificacion) => notificacion.unread === true
            ).length
          }
          color="primary"
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          overlap="circular"
        >
          <Notifications />
        </Badge>
      </IconButton>

      <Popper
        placement={matchesXs ? "bottom" : "bottom-end"}
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
        popperOptions={{
          modifiers: [
            {
              name: "offset",
              options: {
                offset: [matchesXs ? 5 : 0, 0],
              },
            },
          ],
        }}
      >
        {({ TransitionProps }) => (
          <Transitions
            position={matchesXs ? "top" : "top-right"}
            in={open}
            {...TransitionProps}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <Card
                  border={false}
                  elevation={16}
                  content={false}
                  boxShadow
                  shadow={theme.shadows[16]}
                >
                  <Grid container direction="column" spacing={2}>
                    <Grid item xs={12}>
                      <Grid
                        container
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{ pt: 2, px: 2 }}
                      >
                        <Grid item>
                          <Stack direction="row" spacing={2}>
                            <Typography variant="subtitle1">
                              Todas las notificaciones
                            </Typography>
                            <Chip
                              size="small"
                              label={notifications.length || 0}
                              sx={{
                                color: theme.palette.background.default,
                                bgcolor: theme.palette.primary.dark,
                              }}
                            />
                          </Stack>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container direction="column" spacing={2}>
                        <Grid item xs={12}>
                          <Box sx={{ px: 2, pt: 0.25 }}>
                            <TextField
                              id="outlined-select-currency-native"
                              select
                              fullWidth
                              value={value}
                              onChange={handleChange}
                              SelectProps={{
                                native: true,
                              }}
                            >
                              {status.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </TextField>
                          </Box>
                        </Grid>
                        <Grid item xs={12} p={0}>
                          <Divider sx={{ my: 0 }} />
                        </Grid>
                      </Grid>
                      <NotificationList notifications={filteredNotifications} />
                    </Grid>
                  </Grid>
                  <Divider />
                  <CardActions sx={{ p: 1.25, justifyContent: "center" }}>
                    <Button
                      size="small"
                      disableElevation
                      onClick={handleEliminarNotificaciones}
                    >
                      Eliminar todas las notificaciones
                    </Button>
                  </CardActions>
                </Card>
              </ClickAwayListener>
            </Paper>
          </Transitions>
        )}
      </Popper>
    </>
  );
};

export default NotificationSection;
