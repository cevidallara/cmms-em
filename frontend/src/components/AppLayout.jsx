import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import BuildIcon from '@mui/icons-material/Build';
import SpeedIcon from '@mui/icons-material/Speed';
import FactoryIcon from '@mui/icons-material/Factory';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 256;

const menuItems = [
  { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'Activos', icon: <FactoryIcon />, path: '/activos' },
  { label: 'Reparaciones', icon: <BuildIcon />, path: '/reparaciones' },
  { label: 'Lecturas', icon: <SpeedIcon />, path: '/lecturas' },
  { label: 'Configuración', icon: <SettingsIcon />, path: '/configuracion' },
];

function AppLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { usuario, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isSelected = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const currentLabel = menuItems.find(i => isSelected(i.path))?.label || 'Dashboard';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#12162e' }}>
      {/* Logo */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#00d4ff', letterSpacing: '-0.5px' }}>
          CMMS-EM
        </Typography>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          Gestión de Mantenimiento
        </Typography>
      </Box>

      {/* User info */}
      {usuario && (
        <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#f0f4ff', fontSize: 13 }}>
            {usuario.nombre}
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
            {usuario.rol?.replace('_', ' ')}
          </Typography>
        </Box>
      )}

      {/* Nav */}
      <List sx={{ flex: 1, p: 1 }}>
        {menuItems.map(item => {
          const active = isSelected(item.path);
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  backgroundColor: active ? 'rgba(0,212,255,0.1)' : 'transparent',
                  '&:hover': {
                    backgroundColor: active ? 'rgba(0,212,255,0.15)' : 'rgba(0,212,255,0.05)',
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: active ? '#00d4ff' : 'rgba(255,255,255,0.4)',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Logout */}
      <Box sx={{ p: 1, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 2, px: 2, py: 1 }}>
          <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.4)' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Cerrar Sesión" primaryTypographyProps={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Desktop: permanent drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              boxSizing: 'border-box',
              borderRight: '1px solid rgba(255,255,255,0.05)',
              backgroundColor: '#12162e',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Mobile: temporary drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: drawerWidth,
              backgroundColor: '#12162e',
            },
          }}
        >
          {drawer}
        </Drawer>
      )}

      {/* Main content area */}
      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        width: { md: `calc(100% - ${drawerWidth}px)` },
      }}>
        {/* Top bar */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            backgroundColor: '#0d1128',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          <Toolbar sx={{ minHeight: 56 }}>
            {isMobile && (
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{ color: 'rgba(255,255,255,0.6)', mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {currentLabel}
            </Typography>
          </Toolbar>
        </AppBar>

        {/* Content */}
        <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default AppLayout;
