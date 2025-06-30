import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { Unauthorized } from './pages/Unauthorized';
import { Dashboard } from './pages/Dashboard';
import { Analytics } from './pages/Analytics';
import { Users } from './pages/Users';
import { UserRoles } from './pages/UserRoles';
import { UserPermissions } from './pages/UserPermissions';
import { Modules } from './pages/Modules';
import { Settings } from './pages/Settings';
import { Statistics } from './pages/Statistics';
import { DataPage } from './pages/DataPage';
import { ChartPage } from './pages/ChartPage';
import { Customers } from './pages/Customers';
import { Chat } from './pages/Chat';
import { Kanban } from './pages/Kanban';
import { Mail } from './pages/Mail';
import { Calendar } from './pages/Calendar';

// Componente para manejar rutas públicas (redirigir si ya está logueado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, isInitialized } = useAuth();

  if (!isInitialized || loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <CustomThemeProvider>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Rutas Públicas */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              } 
            />
            <Route 
              path="/forgot-password" 
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              } 
            />
            
            {/* Página de acceso denegado */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Rutas Protegidas del Dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute permission="dashboard.view">
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              
              {/* Analytics Routes */}
              <Route
                path="analytics-dashboard"
                element={
                  <ProtectedRoute permission="dashboard.analytics">
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              
              {/* Widget Routes */}
              <Route
                path="statistics"
                element={
                  <ProtectedRoute permission="widget.statistics">
                    <Statistics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="data"
                element={
                  <ProtectedRoute permission="widget.data">
                    <DataPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="chart"
                element={
                  <ProtectedRoute permission="widget.chart">
                    <ChartPage />
                  </ProtectedRoute>
                }
              />
              
              {/* User Management Routes */}
              <Route
                path="users"
                element={
                  <ProtectedRoute permission="users.view">
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users/roles"
                element={
                  <ProtectedRoute permission="users.roles">
                    <UserRoles />
                  </ProtectedRoute>
                }
              />
              <Route
                path="users/permissions"
                element={
                  <ProtectedRoute permission="users.permissions">
                    <UserPermissions />
                  </ProtectedRoute>
                }
              />
              
              {/* System Routes */}
              <Route
                path="modules"
                element={
                  <ProtectedRoute permission="system.settings">
                    <Modules />
                  </ProtectedRoute>
                }
              />
              <Route
                path="settings"
                element={
                  <ProtectedRoute permission="system.settings">
                    <Settings />
                  </ProtectedRoute>
                }
              />
              
              {/* Application Routes */}
              <Route
                path="customers"
                element={
                  <ProtectedRoute permission="customers.view">
                    <Customers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="customers/details"
                element={
                  <ProtectedRoute permission="customers.details">
                    <div>Customer Details Page</div>
                  </ProtectedRoute>
                }
              />
              <Route
                path="chat"
                element={
                  <ProtectedRoute permission="chat.view">
                    <Chat />
                  </ProtectedRoute>
                }
              />
              <Route
                path="kanban"
                element={
                  <ProtectedRoute permission="kanban.view">
                    <Kanban />
                  </ProtectedRoute>
                }
              />
              <Route
                path="mail"
                element={
                  <ProtectedRoute permission="mail.view">
                    <Mail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="calendar"
                element={
                  <ProtectedRoute permission="calendar.view">
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              
              {/* Profile Route - Accesible para todos los usuarios autenticados */}
              <Route path="profile" element={<div>Profile Page</div>} />
              }
            </Route>
            
            {/* Fallback - Redirigir a landing si no está autenticado, o dashboard si lo está */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </CustomThemeProvider>
  );
}

export default App;