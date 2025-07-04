// src/routes/DynamicRouteGenerator.js (¡Lo necesitamos!)
import React from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { getComponent } from "../config/moduleConfig";
import { ProtectedRoute } from "./ProtectedRoute"; // Tu ProtectedRoute original

/**
 * Función recursiva para aplanar la estructura de navegación y extraer las rutas.
 * @param {Array} items - Array de módulos/grupos/páginas del backend.
 * @returns {Array} - Un array plano de objetos de ruta.
 */
const flattenRoutes = (items) => {
  let routes = [];
  for (const item of items) {
    if (item.type === "page" && item.route && item.component) {
      // Limpiamos el path para que sea relativo al padre ('/dashboard')
      // Original: "/dashboard/users/roles" -> Queremos: "users/roles"
      const path = item.route.startsWith("/dashboard")
        ? item.route.substring("/dashboard".length + 1) // +1 para quitar el slash
        : item.route;

      routes.push({
        key: item.slug,
        path: path === "/dashboard" ? "" : path, // La ruta raíz del dashboard es index
        index: path === "/dashboard",
        componentName: item.component,
        permission: item.permission,
      });
    }
    if (item.children && item.children.length > 0) {
      routes = [...routes, ...flattenRoutes(item.children)];
    }
  }
  return routes;
};

/**
 * Componente que genera un conjunto de <Routes> a partir de la configuración.
 * @param {Array} navConfig - La configuración de navegación (tus menuModules).
 */
export const DynamicRoutes = ({ navConfig }) => {
  const generatedRoutes = React.useMemo(
    () => flattenRoutes(navConfig),
    [navConfig]
  );

  return (
    <Routes>
      {generatedRoutes.map(
        ({ key, path, index, componentName, permission }) => {
          const PageComponent = getComponent(componentName);

          if (!PageComponent) {
            console.error(
              `Componente "${componentName}" para la ruta "${path}" no encontrado en moduleConfig.js.`
            );
            return null;
          }

          // Ya que estamos dentro del DashboardLayout, que ya está protegido,
          // el ProtectedRoute aquí es una segunda capa de seguridad opcional pero recomendada.
          const routeElement = (
            <ProtectedRoute permission={permission}>
              <PageComponent />
            </ProtectedRoute>
          );

          // Si es la ruta index (ej. "/dashboard" se convierte en path='')
          if (index) {
            return <Route key={key} index element={routeElement} />;
          }

          return <Route key={key} path={path} element={routeElement} />;
        }
      )}

      {/* Rutas estáticas que quieras añadir dentro del dashboard */}
      <Route path="profile" element={<div>Profile Page</div>} />

      {/* Un fallback para cualquier ruta no encontrada DENTRO de /dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};
