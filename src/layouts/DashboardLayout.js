import React, { useState, useEffect } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  InputBase,
  Badge,
  Collapse,
  useTheme,
  alpha,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  ExpandLess,
  ExpandMore,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  FullscreenExit,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme as useCustomTheme } from "../contexts/ThemeContext";
import { modulesAPI } from "../utils/api";
import { getIcon } from "../config/moduleConfig";
import { WebSocketProvider } from "../contexts/SocketContext";
import { DynamicRoutes } from "../routes/DynamicRouteGenerator";
import { findFirstValidRoute } from "../utils/navigationUtils";
import Logo from "../components/Logo";
import { confirmSwal } from "../utils/swal-helpers";
import { createSession, getSession } from "../utils/common";
import NotificationSection from "../components/NotificationSection";
import {
  NotificationListener,
} from "../utils/notificationManager";

const drawerWidth = 260;
const collapsedDrawerWidth = 64;

const enterFullscreen = (element = document.documentElement) => {
  if (element.requestFullscreen) element.requestFullscreen();
  else if (element.mozRequestFullScreen) element.mozRequestFullScreen();
  else if (element.webkitRequestFullscreen) element.webkitRequestFullscreen();
  else if (element.msRequestFullscreen) element.msRequestFullscreen();
};

const exitFullscreen = () => {
  if (document.exitFullscreen) document.exitFullscreen();
  else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
  else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  else if (document.msExitFullscreen) document.msExitFullscreen();
};

export const DashboardLayout = () => {
  const theme = useTheme();
  const { isDarkMode, toggleDarkMode } = useCustomTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);
  const [menuModules, setMenuModules] = useState([]);
  const [notificaciones, setNotificaciones] = useState({});
  const [loading, setLoading] = useState(true);

  const currentDrawerWidth = sidebarCollapsed
    ? collapsedDrawerWidth
    : drawerWidth;

  useEffect(() => {
    loadMenuModules();
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    const notificaciones = obtenerNotificacionesActivas().reduce(
      (acc, type) => {
        acc[type] = true;
        return acc;
      },
      {}
    );
    setNotificaciones(notificaciones);
  }, []);

  const obtenerNotificacionesActivas = () => {
    try {
      const data = getSession("NOTIFICACIONES_ACTIVAS");
      // Si getSession devuelve null/undefined o no es un array válido, inicializamos con []
      if (data === null || data === undefined || !Array.isArray(data)) {
        const newNotifications = [
          "alarm",
          "ignitionOn",
          "ignitionOff",
          "deviceOverspeed",
          "geofenceEnter",
          "geofenceExit",
          "deviceOffline",
        ];
        createSession("NOTIFICACIONES_ACTIVAS", newNotifications);
        return newNotifications;
      }
      return data; // Devolvemos el array existente
    } catch (error) {
      console.error(
        `Error al obtener o parsear notificaciones de localStorage:`,
        error
      );
      // En caso de cualquier error, devolvemos un array vacío por seguridad
      return [];
    }
  };

  const desactivarNotificacion = (type) => {
    if (!type || typeof type !== "string") {
      console.warn(
        "Se requiere un tipo de notificación válido (string) para desactivar."
      );
      return false;
    }
    try {
      let notificacionesActivas = obtenerNotificacionesActivas();
      const originalLength = notificacionesActivas.length;

      // Filtramos la lista para quitar el tipo especificado
      notificacionesActivas = notificacionesActivas.filter((t) => t !== type);

      // Si la longitud cambió (es decir, se quitó algo), guardamos la nueva lista
      if (notificacionesActivas.length < originalLength) {
        createSession("NOTIFICACIONES_ACTIVAS", notificacionesActivas);
      }
      // Si no estaba en la lista o se guardó correctamente, la operación es exitosa
      return true;
    } catch (error) {
      console.error(`Error al desactivar notificación "${type}":`, error);
      return false;
    }
  };

  const activarNotificacion = (type) => {
    if (!type || typeof type !== "string") {
      console.warn(
        "Se requiere un tipo de notificación válido (string) para activar."
      );
      return false;
    }
    try {
      const notificacionesActivas = obtenerNotificacionesActivas();

      // Si el tipo no está ya en la lista, lo añadimos
      if (!notificacionesActivas.includes(type)) {
        notificacionesActivas.push(type);
        createSession("NOTIFICACIONES_ACTIVAS", notificacionesActivas);
      }
      // Si ya estaba activa o se guardó correctamente, la operación es exitosa
      return true;
    } catch (error) {
      console.error(`Error al activar notificación "${type}":`, error);
      return false;
    }
  };

  const handleChangeSwitch = (event) => {
    const { name, checked } = event.target;
    switch (name) {
      case "ignition":
        updateNotificationSettings(checked, "ignitionOn");
        updateNotificationSettings(checked, "ignitionOff");
        setNotificaciones({
          ...notificaciones,
          ignitionOn: checked,
          ignitionOff: checked,
        });
        break;
      case "geofence":
        updateNotificationSettings(checked, "geofenceEnter");
        updateNotificationSettings(checked, "geofenceExit");
        setNotificaciones({
          ...notificaciones,
          geofenceEnter: checked,
          geofenceExit: checked,
        });
        break;
      default:
        updateNotificationSettings(checked, name);
        setNotificaciones({ ...notificaciones, [name]: checked });
        break;
    }
  };

  const updateNotificationSettings = (checked, name) => {
    if (checked) {
      activarNotificacion(name);
    } else {
      desactivarNotificacion(name);
    }
  };

  const loadMenuModules = async () => {
    try {
      setLoading(true);
      const response = await modulesAPI.menu();
      const modules = response.data.data || [];
      setMenuModules(modules);
      const firstRoute = findFirstValidRoute(modules);
      const isAtDashboardRoot =
        location.pathname === "/dashboard" ||
        location.pathname === "/dashboard/";
      if (isAtDashboardRoot && firstRoute && firstRoute !== "/dashboard") {
        navigate(firstRoute, { replace: true });
      }
    } catch (error) {
      console.error("Error loading menu modules:", error);
      // Fallback a menú estático si falla la API
      setMenuModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFullscreen = () => {
    if (!isFullscreen) {
      enterFullscreen();
    } else {
      exitFullscreen();
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSidebarToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    const userConfirmed = await confirmSwal(
      "¿Estás seguro?",
      "Se cerrará tu sesión actual.",
      {
        // Opciones personalizadas
        confirmButtonText: "Sí, cerrar sesión",
        icon: "warning",
      }
    );

    if (userConfirmed) {
      logout();
    }
  };

  const handleExpandClick = (text) => {
    if (sidebarCollapsed) return;
    setExpandedItems((prev) =>
      prev.includes(text)
        ? prev.filter((item) => item !== text)
        : [...prev, text]
    );
  };

  const renderMenuItem = (item, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.name);
    const isActive = item.route && location.pathname === item.route;

    return (
      <React.Fragment key={item.id}>
        <ListItem disablePadding sx={{ display: "block" }}>
          <ListItemButton
            sx={{
              minHeight: 40,
              justifyContent: sidebarCollapsed ? "center" : "initial",
              px: sidebarCollapsed ? 1 : 2,
              py: 0.5,
              pl: sidebarCollapsed ? 1 : depth * 2 + 2,
              backgroundColor: isActive
                ? alpha(theme.palette.primary.main, 0.08)
                : "transparent",
              borderRadius: 1,
              mx: sidebarCollapsed ? 0.5 : 1,
              mb: 0.5,
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.04),
              },
            }}
            onClick={() => {
              if (hasChildren && !sidebarCollapsed) {
                handleExpandClick(item.name);
              } else if (item.route) {
                navigate(item.route);
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: sidebarCollapsed ? 0 : 1.5,
                justifyContent: "center",
                color: isActive
                  ? theme.palette.primary.main
                  : theme.palette.text.secondary,
                fontSize: "1.2rem",
              }}
            >
              {getIcon(item.icon)}
            </ListItemIcon>
            {!sidebarCollapsed && (
              <>
                <ListItemText
                  primary={item.name}
                  sx={{
                    color: isActive
                      ? theme.palette.primary.main
                      : theme.palette.text.primary,
                    "& .MuiListItemText-primary": {
                      fontWeight: isActive ? 600 : 400,
                      fontSize: "0.875rem",
                    },
                  }}
                />
                {hasChildren && (
                  <IconButton
                    size="small"
                    sx={{ color: theme.palette.text.secondary, p: 0 }}
                  >
                    {isExpanded ? (
                      <ExpandLess fontSize="small" />
                    ) : (
                      <ExpandMore fontSize="small" />
                    )}
                  </IconButton>
                )}
              </>
            )}
          </ListItemButton>
        </ListItem>
        {hasChildren && !sidebarCollapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => renderMenuItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const renderModule = (module) => {
    const visibleItems =
      module.children?.filter(
        (item) => item.status === "active" && item.show_in_menu
      ) || [];

    // Si es un módulo sin hijos visibles, no mostrarlo
    if (module.type === "module" && visibleItems.length === 0) return null;

    // Si es una página individual, mostrarla directamente
    if (module.type === "page") {
      return renderMenuItem(module);
    }

    return (
      <Box key={module.id} sx={{ mb: 2 }}>
        {!sidebarCollapsed && (
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              display: "block",
              color: theme.palette.text.secondary,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontSize: "0.75rem",
            }}
          >
            {module.name}
          </Typography>
        )}
        <List dense>{visibleItems.map((item) => renderMenuItem(item))}</List>
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: sidebarCollapsed ? 1 : 2,
          py: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          justifyContent: sidebarCollapsed ? "center" : "flex-start",
        }}
      >
        <Box
          sx={{
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mr: 1,
          }}
        >
          <Logo height={32} />
        </Box>
        {!sidebarCollapsed && (
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: theme.palette.primary.main }}
          >
            OASIS TRACKING
          </Typography>
        )}
      </Box>

      {/* Menu Items */}
      <Box sx={{ flex: 1, overflow: "auto", py: 1 }}>
        {loading ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Cargando menú...
            </Typography>
          </Box>
        ) : (
          menuModules.map((module) => renderModule(module))
        )}
      </Box>

      {/* Collapse Button */}
      <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}` }}>
        <IconButton
          onClick={handleSidebarToggle}
          sx={{
            width: "100%",
            justifyContent: "center",
            color: theme.palette.text.secondary,
          }}
        >
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <WebSocketProvider>
      <NotificationListener />
      <Box sx={{ display: "flex" }}>
        {/* Header */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
            ml: { sm: `${currentDrawerWidth}px` },
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
            boxShadow: "none",
            borderBottom: `1px solid ${theme.palette.divider}`,
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Toolbar sx={{ minHeight: "64px !important" }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Search */}
            <Box
              sx={{
                position: "relative",
                borderRadius: 1,
                backgroundColor: alpha(theme.palette.common.black, 0.04),
                "&:hover": {
                  backgroundColor: alpha(theme.palette.common.black, 0.06),
                },
                marginLeft: 0,
                width: "100%",
                maxWidth: 300,
              }}
            >
              <Box
                sx={{
                  padding: theme.spacing(0, 2),
                  height: "100%",
                  position: "absolute",
                  pointerEvents: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SearchIcon fontSize="small" />
              </Box>
              <InputBase
                placeholder="Search"
                sx={{
                  color: "inherit",
                  width: "100%",
                  "& .MuiInputBase-input": {
                    padding: theme.spacing(1, 1, 1, 0),
                    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                    fontSize: "0.875rem",
                  },
                }}
              />
            </Box>

            <Box sx={{ flexGrow: 1 }} />

            {/* Header Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Tooltip title="Toggle Dark Mode">
                <IconButton color="inherit" onClick={toggleDarkMode}>
                  {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Fullscreen">
                <IconButton color="inherit" onClick={handleToggleFullscreen}>
                  {isFullscreen ? <FullscreenExit /> : <FullscreenIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Notifications" sx={{ position: "relative" }}>
                <NotificationSection />
              </Tooltip>

              <Tooltip title="Profile">
                <IconButton
                  size="large"
                  aria-label="account of current user"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleMenu}
                  color="inherit"
                  sx={{ ml: 1 }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: theme.palette.primary.main,
                      fontSize: "0.875rem",
                    }}
                  >
                    {user?.first_name?.charAt(0)}
                    {user?.last_name?.charAt(0)}
                  </Avatar>
                </IconButton>
              </Tooltip>

              {/* User Menu */}
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    width: 320,
                    mt: 1,
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Hola, {user?.first_name} {user?.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user?.roles?.[0]?.name || "User"}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ p: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isDarkMode}
                        onChange={toggleDarkMode}
                        color="primary"
                      />
                    }
                    label="Modo Oscuro"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificaciones?.alarm || false}
                        onChange={handleChangeSwitch}
                        name="alarm"
                      />
                    }
                    label="Notificación de Alarma"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          (notificaciones?.ignitionOn &&
                            notificaciones?.ignitionOff) ||
                          false
                        }
                        onChange={handleChangeSwitch}
                        name="ignition"
                      />
                    }
                    label="Notif. de Encendido/Apagado"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificaciones?.deviceOverspeed || false}
                        onChange={handleChangeSwitch}
                        name="deviceOverspeed"
                      />
                    }
                    label="Notif. de Exceso de Velocidad"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={
                          (notificaciones?.geofenceEnter &&
                            notificaciones?.geofenceExit) ||
                          false
                        }
                        onChange={handleChangeSwitch}
                        name="geofence"
                      />
                    }
                    label="Notificación de Geo Cercas"
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificaciones?.deviceOffline || false}
                        onChange={handleChangeSwitch}
                        name="deviceOffline"
                      />
                    }
                    label="Notif. de Fuera de línea"
                  />
                </Box>

                <Divider />
                <MenuItem onClick={() => navigate("/dashboard/settings")}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  Configuración de Cuenta
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Cerrar Sesión
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Sidebar */}
        <Box
          component="nav"
          sx={{
            width: { sm: currentDrawerWidth },
            flexShrink: { sm: 0 },
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
                borderRight: `1px solid ${theme.palette.divider}`,
              },
            }}
          >
            {drawer}
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: currentDrawerWidth,
                borderRight: `1px solid ${theme.palette.divider}`,
                transition: theme.transitions.create("width", {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.leavingScreen,
                }),
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 1, sm: 3 },
            width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
            mt: "64px",
            backgroundColor: theme.palette.background.default,
            minHeight: "calc(100vh - 64px)",
            transition: theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.leavingScreen,
            }),
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "calc(100vh - 64px)",
              }}
            >
              <CircularProgress />
            </Box>
          ) : // Si menuModules está vacío después de cargar, significa que el usuario no tiene acceso a NADA.
          menuModules.length > 0 ? (
            <DynamicRoutes navConfig={menuModules} />
          ) : (
            <Navigate to="/unauthorized" replace />
          )}
        </Box>
      </Box>
    </WebSocketProvider>
  );
};
