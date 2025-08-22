import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Switch,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Chip,
  Tab,
  Tabs,
} from "@mui/material";
import {
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  NotificationsActive,
  NotificationsOff,
} from "@mui/icons-material";
import {
  API_URL_TRACCAR,
  decodeBase64,
  getSession,
  updateTraccar,
} from "../utils/common";
import { UAParser } from "ua-parser-js";
import { useTheme as useCustomTheme } from "../contexts/ThemeContext";
import { requestAndLogToken } from "../utils/notificationManager";
import { notificationSwal } from "../utils/swal-helpers";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profileData, setProfileData] = useState({});
  const [lastSession, setLastSession] = useState({});
  const [userTraccar, setUserTraccar] = useState({});

  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const { isDarkMode, toggleDarkMode } = useCustomTheme();

  const [notifications, setNotifications] = useState({
    emailNotifications: false,
    pushNotifications: false,
    smsNotifications: false,
    marketingEmails: false,
  });

  const [preferences, setPreferences] = useState({
    darkMode: isDarkMode,
    language: "es",
    timezone: "UTC-5",
    dateFormat: "MM/DD/YYYY",
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field, value) => {
    setNotifications((prev) => ({ ...prev, [field]: value }));
  };

  const tabs = [
    { label: "Perfil", icon: <PersonIcon /> },
    { label: "Seguridad", icon: <SecurityIcon /> },
    { label: "Notificaciones", icon: <NotificationsIcon /> },
    { label: "Preferencias", icon: <PaletteIcon /> },
  ];

  useEffect(() => {
    setProfileData(getSession("user"));
    const fetchUserTraccar = async () => {
      const { username, password } = decodeBase64(getSession("SESSION_TOKEN"));
      if (!username || !password) {
        console.error("No se encontraron las credenciales de WebSocket");
        return;
      }
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

      const urlencoded = new URLSearchParams();
      urlencoded.append("email", username);
      urlencoded.append("password", password);

      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: urlencoded,
        redirect: "follow",
      };

      fetch(API_URL_TRACCAR + "session", requestOptions)
        .then((response) => response.json())
        .then((result) => {
          setUserTraccar(result);
        })
        .catch((error) => console.error(error));
    };
    fetchUserTraccar();
  }, []);

  useEffect(() => {
    if (!profileData?.last_login_at && !profileData?.last_login_ip) {
      return;
    }
    // Parsear User-Agent
    const parser = new UAParser();
    const result = parser.getResult();
    let infoSession = {
      browser: result.browser.name || "Unknown Browser",
      os: result.os.name || "Unknown OS",
      location: "Unknown Location",
      datetime: new Date(profileData.last_login_at).toLocaleString(),
    };

    // Obtener ubicación a partir de IP
    async function fetchLocation() {
      try {
        const res = await fetch(
          `https://ipapi.co/${profileData.last_login_ip}/json/`
        );
        if (!res.ok) throw new Error("Failed to fetch location");
        const data = await res.json();
        infoSession.location = `${data.city}, ${
          data.region_code || data.region
        }`;
      } catch (error) {
        infoSession.location = "Unknown Location";
      } finally {
        setLastSession(infoSession);
      }
    }

    fetchLocation();
  }, [profileData]);

  useEffect(() => {
    if (!userTraccar?.attributes?.notificationTokens) return;
    setIsPushEnabled(true);
  }, [userTraccar]);

  const savePushToken = async (isEnabled) => {
    if (!userTraccar?.id) {
      console.error("No se encontró el ID de usuario de Traccar");
      return;
    }
    const token = await requestAndLogToken();
    if (!token) return;
    try {
      const notificationTokensString =
        userTraccar.attributes?.notificationTokens || "";
      let notificationTokens = notificationTokensString.split(",");
      if (isEnabled) {
        notificationTokens.push(token);
      } else {
        notificationTokens = notificationTokens.filter((t) => t !== token);
      }
      const newUser = {
        ...userTraccar,

        attributes: {
          ...userTraccar.attributes,
          notificationTokens: notificationTokens.join(","),
        },
      };
      await updateTraccar("users/" + userTraccar.id, newUser);
      setIsPushEnabled(isEnabled);
      notificationSwal("Éxito", isEnabled ? "Token de notificación guardado" : "Token de notificación eliminado", "success");
    } catch (error) {
      console.error("Error saving push token:", error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Configuración
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Tabs
                orientation="vertical"
                variant="scrollable"
                value={tabValue}
                onChange={handleTabChange}
                sx={{ borderRight: 1, borderColor: "divider" }}
              >
                {tabs.map((tab, index) => (
                  <Tab
                    key={index}
                    label={tab.label}
                    icon={tab.icon}
                    iconPosition="start"
                    sx={{
                      justifyContent: "flex-start",
                      textAlign: "left",
                      minHeight: 48,
                    }}
                  />
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Card>
            <CardContent>
              {/* Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Información del Perfil
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mr: 3,
                      bgcolor: "primary.main",
                      fontSize: "2rem",
                    }}
                  >
                    {profileData.initials || ""}
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {profileData.full_name || ""}
                    </Typography>
                    {profileData.roles?.map((role, index) => (
                      <Chip
                        key={index}
                        label={role.name}
                        color="primary"
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    ))}
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Nombres"
                      type="text"
                      value={profileData.first_name}
                      onChange={(e) =>
                        handleProfileChange("first_name", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Apellidos"
                      type="text"
                      value={profileData.last_name}
                      onChange={(e) =>
                        handleProfileChange("last_name", e.target.value)
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) =>
                        handleProfileChange("email", e.target.value)
                      }
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button variant="contained">Guardar Cambios</Button>
                  <Button variant="outlined" sx={{ ml: 2 }}>
                    Cancelar
                  </Button>
                </Box>
              </TabPanel>

              {/* Security Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Configuración de Seguridad
                </Typography>

                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mb: 2, fontWeight: 600 }}
                  >
                    Cambiar Contraseña
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Contraseña Actual"
                        type="password"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nueva Contraseña"
                        type="password"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Confirmar Nueva Contraseña"
                        type="password"
                      />
                    </Grid>
                  </Grid>
                  <Button variant="contained" sx={{ mt: 2 }}>
                    Actualizar Contraseña
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Autenticación de Dos Factores
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Switch />
                  <Typography sx={{ ml: 2 }}>
                    Habilitar la autenticación de dos factores para una mayor
                    seguridad
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  Sesiones Activas
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary={lastSession.datetime || "Desconocido"}
                      secondary={`${lastSession.browser || "Desconocido"} en ${
                        lastSession.os || "Desconocido"
                      } • ${lastSession.location || "Desconocido"}`}
                    />
                    <ListItemSecondaryAction>
                      <Chip label="Activo" color="success" size="small" />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </TabPanel>

              {/* Notifications Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Configuración de Notificaciones
                </Typography>

                <List>
                  <ListItem>
                    <ListItemText
                      primary="Notificaciones Push"
                      secondary="Recibir notificaciones push en tu navegador"
                    />
                  </ListItem>
                </List>

                <Card
                  sx={{
                    maxWidth: 400,
                    margin: "auto",
                    boxShadow: 3,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <CardContent sx={{ textAlign: "center", p: 3 }}>
                    <Box sx={{ mb: 2 }}>
                      {isPushEnabled ? (
                        <NotificationsActive
                          color="success"
                          sx={{ fontSize: 60 }}
                        />
                      ) : (
                        <NotificationsOff
                          color="disabled"
                          sx={{ fontSize: 60 }}
                        />
                      )}
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                      {isPushEnabled
                        ? "¡Las notificaciones están activadas! Recibirás alertas importantes."
                        : "Activa las notificaciones para no perderte alertas importantes"}
                    </Typography>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => savePushToken(!isPushEnabled)}
                      startIcon={
                        isPushEnabled ? (
                          <NotificationsOff />
                        ) : (
                          <NotificationsActive />
                        )
                      }
                      sx={{
                        backgroundColor: isPushEnabled
                          ? "error.main"
                          : "primary.main",
                        "&:hover": {
                          backgroundColor: isPushEnabled
                            ? "error.dark"
                            : "primary.dark",
                        },
                      }}
                    >
                      {isPushEnabled
                        ? "DESACTIVAR NOTIFICACIONES"
                        : "ACTIVAR NOTIFICACIONES"}
                    </Button>

                    <Typography variant="caption" color="text.secondary">
                      {isPushEnabled
                        ? "Puedes desactivarlas en cualquier momento"
                        : "Necesitamos tu permiso para enviar notificaciones"}
                    </Typography>
                  </CardContent>
                </Card>

                <List>
                  <ListItem>
                    <ListItemText
                      primary="Notificaciones por Email"
                      secondary="Recibir notificaciones por email"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notifications.emailNotifications}
                        onChange={(e) =>
                          handleNotificationChange(
                            "emailNotifications",
                            e.target.checked
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemText
                      primary="Notificaciones por SMS"
                      secondary="Recibir actualizaciones importantes por SMS"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notifications.smsNotifications}
                        onChange={(e) =>
                          handleNotificationChange(
                            "smsNotifications",
                            e.target.checked
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemText
                      primary="Notificaciones de Marketing"
                      secondary="Recibir correos electrónicos de marketing y promociones"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={notifications.marketingEmails}
                        onChange={(e) =>
                          handleNotificationChange(
                            "marketingEmails",
                            e.target.checked
                          )
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </TabPanel>

              {/* Preferences Tab */}
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Configuración de la Aplicación
                </Typography>

                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600 }}
                        >
                          Modo Oscuro
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Cambiar entre temas claros y oscuros
                        </Typography>
                      </Box>
                      <Switch
                        checked={isDarkMode}
                        onChange={toggleDarkMode}
                        color="primary"
                      />
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Idioma"
                      value={preferences.language}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          language: e.target.value,
                        }))
                      }
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="en">Inglés</option>
                      <option value="es">Español</option>
                      <option value="fr">Francés</option>
                      <option value="de">Alemán</option>
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Zona Horaria"
                      value={preferences.timezone}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Formato de Fecha"
                      value={preferences.dateFormat}
                      onChange={(e) =>
                        setPreferences((prev) => ({
                          ...prev,
                          dateFormat: e.target.value,
                        }))
                      }
                      select
                      SelectProps={{ native: true }}
                    >
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </TextField>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Button variant="contained">Guardar Preferencias</Button>
                  <Button variant="outlined" sx={{ ml: 2 }}>
                    Restablecer a Predeterminado
                  </Button>
                </Box>
              </TabPanel>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
