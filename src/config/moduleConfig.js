// src/config/moduleConfig.js
import React from "react";

// Importar todos los componentes
import { Dashboard as DashboardPage } from "../pages/Dashboard";
import { Analytics as AnalyticsPage } from "../pages/Analytics";
import { Users } from "../pages/Users";
import { UserRoles } from "../pages/UserRoles";
import { UserPermissions } from "../pages/UserPermissions";
import { Customers } from "../pages/Customers";
import { Statistics } from "../pages/Statistics";
import { DataPage } from "../pages/DataPage";
import { ChartPage } from "../pages/ChartPage";
import { Chat as ChatPage } from "../pages/Chat";
import { Kanban } from "../pages/Kanban";
import { Mail as MailPage } from "../pages/Mail";
import { Calendar } from "../pages/Calendar";
import { Modules } from "../pages/Modules";
import { Settings as SettingsPage } from "../pages/Settings";

// Importar nuevos componentes
import { MapaPage } from "../pages/MapaPage";
import { DispositivosGeozonaPage } from "../pages/DispositivosGeozonaPage";

// Importar iconos de Material-UI
import {
  Dashboard,
  People,
  ShoppingCart,
  Settings,
  Notifications,
  Search,
  Favorite,
  Home,
  Mail,
  Menu,
  Article,
  Map,
  DirectionsBus,
  Place,
  TrendingUp,
} from "@mui/icons-material";
import { GeozonasPage } from "../pages/GeozonasPage";
import { HistorialDeRecorridoPage } from "../pages/HistorialRecorridoPage";
import EventosPage from "../pages/reportes/EventosPage";
import ViajesPage from "../pages/reportes/ViajesPage";
import CombinadoPage from "../pages/reportes/CombinadoPage";
import ParadasPage from "../pages/reportes/ParadasPage";
import ResumenPage from "../pages/reportes/ResumenPage";
import RutaPage from "../pages/reportes/RutaPage";
import ConductoresPage from "../pages/ConductoresPage";
import { DispositivoDetailPage } from "../pages/DispositivoDetailPage";

// Mapeo de componentes - AQUÍ AGREGAS NUEVOS COMPONENTES
export const componentMap = {
  // Componentes existentes
  DashboardPage,
  AnalyticsPage,
  Users,
  UserRoles,
  UserPermissions,
  Customers,
  Statistics,
  DataPage,
  ChartPage,
  ChatPage,
  Kanban,
  MailPage,
  Calendar,
  Modules,
  SettingsPage,
  // Nuevos componentes
  MapaPage,
  GeozonasPage,
  DispositivosGeozonaPage,
  CombinadoPage,
  EventosPage,
  ParadasPage,
  ResumenPage,
  RutaPage,
  ViajesPage,
  HistorialDeRecorridoPage,
  ConductoresPage,
  DispositivoDetailPage,
};

// Mapeo de iconos - AQUÍ TIENES TODOS LOS ICONOS DISPONIBLES
export const iconMap = {
  Dashboard: <Dashboard />,
  People: <People />,
  ShoppingCart: <ShoppingCart />,
  Settings: <Settings />,
  Notifications: <Notifications />,
  Search: <Search />,
  Favorite: <Favorite />,
  Home: <Home />,
  Mail: <Mail />,
  Menu: <Menu />,
  Map: <Map />,
  Article: <Article />,
  Bus: <DirectionsBus />,
  Place: <Place />,
  TrendingUp: <TrendingUp />,
};

// Función para obtener icono por nombre
export const getIcon = (iconName) => {
  return iconMap[iconName] || <Article />;
};

// Función para obtener componente por nombre
export const getComponent = (componentName) => {
  return componentMap[componentName];
};

// Lista de iconos disponibles para el selector (solo los más comunes)
export const availableIcons = Object.keys(iconMap).map((icon) => ({
  label: icon,
  value: icon.replace("Icon", ""),
  icon: iconMap[icon],
}));

export default {
  componentMap,
  iconMap,
  getIcon,
  getComponent,
  availableIcons,
};
