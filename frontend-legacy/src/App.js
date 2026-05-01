import './App.css';
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress, Box } from '@mui/material';
import theme from './theme';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/AppLayout';
import Dashboard from './components/Dashboard';
import AssetList from './components/AssetList';
import RepairKanban from './components/RepairKanban';
import ReadingList from './components/ReadingList';
import AssetDetail from './components/AssetDetail';
import LoginPage from './components/LoginPage';
import RegistroPage from './components/RegistroPage';

function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  return usuario ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress sx={{ color: '#00d4ff' }} />
      </Box>
    );
  }

  return usuario ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  const [refreshAssets, setRefreshAssets] = useState(0);
  const [refreshRepairs, setRefreshRepairs] = useState(0);
  const [refreshReadings, setRefreshReadings] = useState(0);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/registro" element={<PublicRoute><RegistroPage /></PublicRoute>} />

      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/activos" element={
        <ProtectedRoute>
          <AppLayout>
            <AssetList
              refresh={refreshAssets}
              onAssetCreated={() => setRefreshAssets(prev => prev + 1)}
            />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/activos/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <AssetDetail />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/reparaciones" element={
        <ProtectedRoute>
          <AppLayout>
            <RepairKanban
              refresh={refreshRepairs}
              onRepairCreated={() => setRefreshRepairs(prev => prev + 1)}
            />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/lecturas" element={
        <ProtectedRoute>
          <AppLayout>
            <ReadingList
              refresh={refreshReadings}
              onReadingCreated={() => setRefreshReadings(prev => prev + 1)}
            />
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/configuracion" element={
        <ProtectedRoute>
          <AppLayout>
            <Box sx={{ p: 3 }}>
              <h2>Configuración</h2>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Próximamente...</p>
            </Box>
          </AppLayout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
