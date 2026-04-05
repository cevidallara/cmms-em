import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Link, MenuItem, Grid,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useAuth } from '../context/AuthContext';

function RegistroPage() {
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', password: '', confirmPassword: '',
    orgNombre: '', orgTipo: 'empresa',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registro } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      return setError('Las contraseñas no coinciden');
    }
    if (form.password.length < 8) {
      return setError('La contraseña debe tener al menos 8 caracteres');
    }

    setLoading(true);
    try {
      await registro({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        password: form.password,
        organizacion: { nombre: form.orgNombre, tipo: form.orgTipo },
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0d1128',
      p: 2,
    }}>
      <Card sx={{ maxWidth: 500, width: '100%', border: '1px solid rgba(0,212,255,0.15)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <BoltIcon sx={{ fontSize: 48, color: '#00d4ff', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#00d4ff' }}>
              Crear Cuenta
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
              Registra tu organización en CMMS-EM
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', mb: 1 }}>
              Datos personales
            </Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Apellido" name="apellido" value={form.apellido} onChange={handleChange} fullWidth />
              </Grid>
            </Grid>

            <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth sx={{ mb: 2 }} />

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField label="Contraseña" name="password" type="password" value={form.password} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Confirmar" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required fullWidth />
              </Grid>
            </Grid>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, display: 'block', mb: 1 }}>
              Organización
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={7}>
                <TextField label="Nombre de organización" name="orgNombre" value={form.orgNombre} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={5}>
                <TextField select label="Tipo" name="orgTipo" value={form.orgTipo} onChange={handleChange} fullWidth>
                  <MenuItem value="empresa">Empresa</MenuItem>
                  <MenuItem value="centro">Centro de Servicio</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ py: 1.2, fontWeight: 700 }}>
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'rgba(255,255,255,0.5)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link component={RouterLink} to="/login" sx={{ color: '#00d4ff' }}>
              Inicia sesión
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default RegistroPage;
