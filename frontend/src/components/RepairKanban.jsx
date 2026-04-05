import React, { useState, useEffect } from 'react';
import api from '../api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Box, Paper, Typography, Card, CardContent, Chip, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  TextField, MenuItem, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import FormModal from './FormModal';

const kanbanColumns = [
  { key: 'Ingresado', label: 'Ingresado', color: '#00d4ff' },
  { key: 'En Taller', label: 'En Taller', color: '#ffcc00' },
  { key: 'Para despachar', label: 'Para Despachar', color: '#ff9900' },
  { key: 'Despachado', label: 'Despachado', color: '#00ff88' },
];

const prioridades = ['Baja', 'Mediana', 'Alta', 'Emergencia'];

const prioridadColor = {
  'Emergencia': 'error',
  'Alta': 'warning',
  'Mediana': 'info',
  'Baja': 'default'
};

const backdropSx = {
  backdropFilter: 'blur(6px)',
  backgroundColor: 'rgba(0,0,0,0.6)',
};

const initialForm = {
  assetId: '', tecnico: '', estado: '', descripcion: '', fechaInicio: '',
  otCliente: '', nrcv: '', prioridad: 'Mediana', responsable: '',
  mandante: '', sector: '', guiaCliente: '', progreso: 'Ingresado', fechaDespacho: ''
};

function RepairKanban({ refresh, onRepairCreated }) {
  const [repairs, setRepairs] = useState([]);
  const [assets, setAssets] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchRepairs = () => {
    api.get('/repairs')
      .then(res => setRepairs(res.data))
      .catch(err => console.error('Error al cargar reparaciones:', err));
  };

  useEffect(() => { fetchRepairs(); }, [refresh]);

  const openCreate = () => {
    api.get('/assets?esBackup=false')
      .then(res => setAssets(res.data));
    setForm(initialForm);
    setCreateOpen(true);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async () => {
    try {
      await api.post('/repairs', form);
      setCreateOpen(false);
      setForm(initialForm);
      fetchRepairs();
      if (onRepairCreated) onRepairCreated();
    } catch (error) {
      console.error('Error al crear reparación:', error);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const newProgreso = destination.droppableId;
    const repair = repairs.find(r => r._id === draggableId);
    if (!repair || repair.progreso === newProgreso) return;

    setRepairs(prev => prev.map(r => r._id === draggableId ? { ...r, progreso: newProgreso } : r));

    const update = { progreso: newProgreso };
    if (newProgreso === 'Despachado') update.fechaDespacho = new Date().toISOString();

    try {
      await api.put(`/repairs/${draggableId}`, update);
      fetchRepairs();
    } catch (error) {
      console.error('Error al mover reparación:', error);
      fetchRepairs();
    }
  };

  const getColumnRepairs = (key) => repairs.filter(r => r.progreso === key);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>Reparaciones</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
          Nueva Reparación
        </Button>
      </Box>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: '70vh' }}>
          {kanbanColumns.map(col => (
            <Droppable droppableId={col.key} key={col.key}>
              {(provided, snapshot) => (
                <Paper
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  elevation={0}
                  sx={{
                    flex: '1 1 0',
                    minWidth: 280,
                    backgroundColor: snapshot.isDraggingOver ? `${col.color}08` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${snapshot.isDraggingOver ? col.color + '50' : col.color + '20'}`,
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'background-color 0.2s, border-color 0.2s',
                  }}
                >
                  <Box sx={{
                    p: 2,
                    borderBottom: `2px solid ${col.color}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <Typography sx={{ fontWeight: 700, color: col.color }}>{col.label}</Typography>
                    <Chip label={getColumnRepairs(col.key).length} size="small"
                      sx={{ backgroundColor: `${col.color}20`, color: col.color, fontWeight: 700 }} />
                  </Box>

                  <Box sx={{ p: 1.5, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {getColumnRepairs(col.key).map((repair, index) => (
                      <Draggable key={repair._id} draggableId={repair._id} index={index}>
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              backgroundColor: snapshot.isDragging ? '#262a4a' : '#1e2139',
                              border: `1px solid ${snapshot.isDragging ? col.color + '60' : 'rgba(255,255,255,0.06)'}`,
                              cursor: 'grab',
                              transition: snapshot.isDragging ? 'none' : 'box-shadow 0.15s, border-color 0.15s',
                              boxShadow: snapshot.isDragging ? `0 8px 24px ${col.color}30` : 'none',
                              '&:hover': { borderColor: `${col.color}40` }
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Box {...provided.dragHandleProps} sx={{ display: 'flex', color: 'rgba(255,255,255,0.2)' }}>
                                    <DragIndicatorIcon sx={{ fontSize: 16 }} />
                                  </Box>
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                    {repair.nrcv || repair.otCliente || '—'}
                                  </Typography>
                                </Box>
                                {repair.prioridad && (
                                  <Chip label={repair.prioridad} color={prioridadColor[repair.prioridad] || 'default'} size="small" />
                                )}
                              </Box>

                              <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, cursor: 'pointer' }}
                                onClick={() => setDetailOpen(repair)}>
                                {repair.assetId?.nombre || 'Sin activo'}
                              </Typography>

                              {repair.descripcion && (
                                <Typography variant="caption" sx={{
                                  color: 'rgba(255,255,255,0.5)',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 1
                                }}>
                                  {repair.descripcion}
                                </Typography>
                              )}

                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <PersonIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{repair.tecnico}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <CalendarTodayIcon sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {repair.fechaInicio ? new Date(repair.fechaInicio).toLocaleDateString() : ''}
                                  </Typography>
                                </Box>
                              </Box>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Box>
                </Paper>
              )}
            </Droppable>
          ))}
        </Box>
      </DragDropContext>

      {/* Modal detalle */}
      <Dialog
        open={!!detailOpen}
        onClose={() => setDetailOpen(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ backdrop: { sx: backdropSx } }}
      >
        {detailOpen && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                  {detailOpen.nrcv || detailOpen.otCliente || 'Reparación'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                  {detailOpen.assetId?.nombre}
                </Typography>
              </Box>
              <IconButton onClick={() => setDetailOpen(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={1.5}>
                {[
                  { label: 'OT Cliente', value: detailOpen.otCliente },
                  { label: 'NRCV', value: detailOpen.nrcv },
                  { label: 'Técnico', value: detailOpen.tecnico },
                  { label: 'Responsable', value: detailOpen.responsable },
                  { label: 'Mandante', value: detailOpen.mandante },
                  { label: 'Sector', value: detailOpen.sector },
                  { label: 'Guía Cliente', value: detailOpen.guiaCliente },
                  { label: 'Fecha Inicio', value: detailOpen.fechaInicio ? new Date(detailOpen.fechaInicio).toLocaleDateString() : null },
                  { label: 'Fecha Despacho', value: detailOpen.fechaDespacho ? new Date(detailOpen.fechaDespacho).toLocaleDateString() : null },
                ].filter(f => f.value).map(field => (
                  <Grid item xs={12} sm={6} key={field.label}>
                    <Card sx={{ background: 'rgba(0,212,255,0.04)', border: '1px solid rgba(0,212,255,0.1)' }}>
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{field.label}</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{field.value}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label={detailOpen.prioridad} color={prioridadColor[detailOpen.prioridad] || 'default'} />
                    <Chip label={detailOpen.progreso} variant="outlined" />
                  </Box>
                </Grid>
              </Grid>
              {detailOpen.descripcion && (
                <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Descripción</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>{detailOpen.descripcion}</Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setDetailOpen(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal crear reparación */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva Reparación"
        onSubmit={handleCreate}
        submitLabel="Crear"
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField select label="Activo" name="assetId" value={form.assetId} onChange={handleChange} required fullWidth>
              {assets.map(a => <MenuItem key={a._id} value={a._id}>{a.nombre}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="OT Cliente" name="otCliente" value={form.otCliente} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="NRCV" name="nrcv" value={form.nrcv} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Prioridad" name="prioridad" value={form.prioridad} onChange={handleChange} fullWidth>
              {prioridades.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Técnico" name="tecnico" value={form.tecnico} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Responsable (email)" name="responsable" type="email" value={form.responsable} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Mandante" name="mandante" value={form.mandante} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Sector" name="sector" value={form.sector} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Fecha Inicio" name="fechaInicio" type="date" value={form.fechaInicio} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Guía Cliente" name="guiaCliente" value={form.guiaCliente} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <TextField label="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} fullWidth multiline rows={3} />
          </Grid>
        </Grid>
      </FormModal>
    </Box>
  );
}

export default RepairKanban;
