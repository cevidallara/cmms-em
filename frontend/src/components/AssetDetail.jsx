import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import {
  Box, Grid, Paper, Typography, Button, Card, CardContent, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';

const estadoBackupColor = {
  'Disponible': 'success',
  'Reservado': 'warning',
  'En Uso': 'info',
};

const initialBackup = {
  tipo: '',
  nombre: '',
  marca: '',
  modelo: '',
  potenciaKW: '',
  numeroSerie: '',
  ubicacion: '',
  estado: 'Disponible',
  proveedor: '',
  fechaAdquisicion: '',
  costo: '',
  notas: ''
};

function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [backups, setBackups] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialBackup);
  const [unlinking, setUnlinking] = useState(null);

  const fetchAsset = () => {
    api.get(`/assets/${id}`)
      .then(res => setAsset(res.data))
      .catch(err => console.error('Error al cargar activo:', err));
  };

  const fetchBackups = async () => {
    try {
      const res = await api.get(`/assets?esBackup=true&activoRelacionado=${id}`);
      setBackups(res.data.filter(b => b._id !== id));
    } catch (err) {
      console.error('Error al cargar backups:', err);
    }
  };

  useEffect(() => {
    fetchAsset();
    fetchBackups();
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...form, esBackup: true, activoRelacionado: id };
      console.log('POST /api/assets payload:', payload);
      await api.post('/assets', payload);
      setForm(initialBackup);
      setModalOpen(false);
      fetchBackups();
    } catch (error) {
      console.error('Error al crear backup:', error);
    }
  };

  if (!asset) return <Typography>Cargando...</Typography>;

  const infoFields = [
    { label: 'Cliente', value: asset.cliente },
    { label: 'Tipo', value: asset.tipo },
    { label: 'Categoría', value: asset.categoria },
    { label: 'Subcategoría', value: asset.subcategoria },
    { label: 'Marca', value: asset.marca },
    { label: 'Modelo', value: asset.modelo },
    { label: 'N° Serie', value: asset.numeroSerie },
    { label: 'Potencia (KW)', value: asset.potenciaKW },
    { label: 'Sector', value: asset.sector },
    { label: 'Ubicación', value: asset.ubicacion },
    { label: 'Estado', value: asset.estadoActual || asset.estado },
  ];

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/activos')} sx={{ mb: 2, color: '#00d4ff' }}>
        Volver a Activos
      </Button>

      {/* Info del activo */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: '#00d4ff' }}>
          {asset.nombre}
        </Typography>
        <Grid container spacing={2}>
          {infoFields.map(field => (
            field.value && (
              <Grid item xs={12} sm={6} md={4} key={field.label}>
                <Card sx={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {field.label}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {field.value}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )
          ))}
        </Grid>
      </Paper>

      {/* Backups */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Backups Disponibles
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalOpen(true)}>
            Agregar Backup
          </Button>
        </Box>

        {backups.length === 0 ? (
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', py: 2, textAlign: 'center' }}>
            No hay backups registrados para este activo.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#1a1f3a' }}>
                  <TableCell><strong>Nombre</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Marca</strong></TableCell>
                  <TableCell><strong>Potencia KW</strong></TableCell>
                  <TableCell><strong>Ubicación</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Proveedor</strong></TableCell>
                  <TableCell><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.map(b => (
                  <TableRow key={b._id} hover>
                    <TableCell>{b.nombre}</TableCell>
                    <TableCell>{b.tipo}</TableCell>
                    <TableCell>{b.marca}</TableCell>
                    <TableCell>{b.potenciaKW}</TableCell>
                    <TableCell>{b.ubicacion}</TableCell>
                    <TableCell>
                      <Chip label={b.estado} color={estadoBackupColor[b.estado] || 'default'} size="small" />
                    </TableCell>
                    <TableCell>{b.proveedor}</TableCell>
                    <TableCell>
                      <Button size="small" color="warning" disabled={unlinking === b._id} onClick={async (e) => {
                        e.stopPropagation();
                        setUnlinking(b._id);
                        try {
                          console.log('Desvinculando backup ID:', b._id);
                          console.log('Payload:', { activoRelacionado: null });
                          await api.put(`/assets/${b._id}`, { activoRelacionado: null });
                          await new Promise(resolve => setTimeout(resolve, 500));
                          await fetchBackups();
                        } finally {
                          setUnlinking(null);
                        }
                      }}>
                        {unlinking === b._id ? 'Desvinculando...' : 'Desvincular'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Modal agregar backup */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#00d4ff' }}>Nuevo Backup</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Tipo" name="tipo" value={form.tipo} onChange={handleChange} required fullWidth>
                <MenuItem value="Nuevo">Nuevo</MenuItem>
                <MenuItem value="Reacondicionado">Reacondicionado</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Marca" name="marca" value={form.marca} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Modelo" name="modelo" value={form.modelo} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Potencia KW" name="potenciaKW" type="number" value={form.potenciaKW} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="N° Serie" name="numeroSerie" value={form.numeroSerie} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Ubicación" name="ubicacion" value={form.ubicacion} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Estado" name="estado" value={form.estado} onChange={handleChange} fullWidth>
                <MenuItem value="Disponible">Disponible</MenuItem>
                <MenuItem value="Reservado">Reservado</MenuItem>
                <MenuItem value="En Uso">En Uso</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Proveedor" name="proveedor" value={form.proveedor} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Fecha Adquisición" name="fechaAdquisicion" type="date" value={form.fechaAdquisicion} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Costo" name="costo" type="number" value={form.costo} onChange={handleChange} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Notas" name="notas" value={form.notas} onChange={handleChange} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AssetDetail;
