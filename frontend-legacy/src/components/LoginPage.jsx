import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, Link,
} from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useAuth } from '../context/AuthContext';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
      <Card sx={{ maxWidth: 420, width: '100%', border: '1px solid rgba(0,212,255,0.15)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <BoltIcon sx={{ fontSize: 48, color: '#00d4ff', mb: 1 }} />
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#00d4ff' }}>
              CMMS-EM
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
              Gestión de Mantenimiento Industrial
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ py: 1.2, fontWeight: 700 }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </Button>
          </form>

          <Typography variant="body2" sx={{ textAlign: 'center', mt: 3, color: 'rgba(255,255,255,0.5)' }}>
            ¿No tienes cuenta?{' '}
            <Link component={RouterLink} to="/registro" sx={{ color: '#00d4ff' }}>
              Registra tu organización
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}

export default LoginPage;
