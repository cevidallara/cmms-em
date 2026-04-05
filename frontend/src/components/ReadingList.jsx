import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Grid, Card, CardContent, Box, Chip, IconButton, TableCell, TextField, MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import BoltIcon from '@mui/icons-material/Bolt';
import SpeedIcon from '@mui/icons-material/Speed';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DataList from './DataList';
import FormModal from './FormModal';
import EfficiencyCalculator from './EfficiencyCalculator';

const backdropSx = {
  backdropFilter: 'blur(6px)',
  backgroundColor: 'rgba(0,0,0,0.6)',
};

const listColumns = [
  { key: 'activo', label: 'Activo' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'eficiencia', label: 'Eficiencia (%)' },
  { key: 'consumo', label: 'Consumo Anual (kWh)' },
  { key: 'costo', label: 'Costo Anual' },
];

function ReadingList({ refresh, onReadingCreated }) {
  const [readings, setReadings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [assetId, setAssetId] = useState('');

  const fetchReadings = () => {
    api.get('/readings')
      .then(res => setReadings(res.data))
      .catch(err => console.error('Error al cargar lecturas:', err));
  };

  useEffect(() => { fetchReadings(); }, [refresh]);

  const openCreate = () => {
    api.get('/assets?esBackup=false')
      .then(res => setAssets(res.data))
      .catch(err => console.error('Error al cargar activos:', err));
    setAssetId('');
    setCreateOpen(true);
  };

  const handleSaved = () => {
    setCreateOpen(false);
    setAssetId('');
    fetchReadings();
    if (onReadingCreated) onReadingCreated();
  };

  const resultCards = selected ? [
    { label: 'Eficiencia Estimada', value: selected.eficienciaEstimada, unit: '%', color: '#00d4ff', icon: <BoltIcon sx={{ fontSize: 32 }} /> },
    { label: 'Consumo Anual', value: selected.consumoAnualKWh, unit: 'kWh', color: '#00ff88', icon: <SpeedIcon sx={{ fontSize: 32 }} /> },
    { label: 'Costo Anual', value: selected.costoAnual, unit: selected.moneda || 'CLP', color: '#ffcc00', icon: <AttachMoneyIcon sx={{ fontSize: 32 }} /> },
  ] : [];

  const detailFields = selected ? [
    { label: 'Activo', value: selected.assetId?.nombre },
    { label: 'Fecha', value: selected.fecha ? new Date(selected.fecha).toLocaleDateString() : null },
    { label: 'Voltaje', value: selected.voltaje ? `${selected.voltaje} V` : null },
    { label: 'Corriente', value: selected.corriente ? `${selected.corriente} A` : null },
    { label: 'Factor de Potencia', value: selected.factorPotencia },
    { label: 'Factor de Carga', value: selected.factorCarga ? `${selected.factorCarga}%` : null },
    { label: 'Horas Operación / Año', value: selected.horasOperacion?.toLocaleString() },
    { label: 'Costo Energía (kWh)', value: selected.costoEnergia ? `$${selected.costoEnergia}` : null },
    { label: 'Moneda', value: selected.moneda },
    { label: 'Clase IE', value: selected.claseIEActual },
    { label: 'Odómetro', value: selected.odometro },
    { label: 'Observaciones', value: selected.observaciones },
  ].filter(f => f.value != null && f.value !== '') : [];

  const renderRow = (reading) => (
    <>
      <TableCell>{reading.assetId?.nombre || ''}</TableCell>
      <TableCell>{reading.fecha ? new Date(reading.fecha).toLocaleDateString() : ''}</TableCell>
      <TableCell>{reading.eficienciaEstimada != null ? `${reading.eficienciaEstimada}%` : '—'}</TableCell>
      <TableCell>{reading.consumoAnualKWh != null ? reading.consumoAnualKWh.toLocaleString() : '—'}</TableCell>
      <TableCell>{reading.costoAnual != null ? `$${reading.costoAnual.toLocaleString()} ${reading.moneda || ''}` : '—'}</TableCell>
    </>
  );

  return (
    <>
      <DataList
        title="Lecturas"
        columns={listColumns}
        data={readings}
        onAdd={openCreate}
        addLabel="Nueva Lectura"
        renderRow={renderRow}
        onRowClick={setSelected}
      />

      {/* Modal detalle de lectura */}
      <Dialog
        open={!!selected}
        onClose={() => setSelected(null)}
        maxWidth="md"
        fullWidth
        slotProps={{ backdrop: { sx: backdropSx } }}
      >
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 700 }}>
                {selected.assetId?.nombre || 'Lectura'}
              </Typography>
              <IconButton onClick={() => setSelected(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {resultCards.map(card => (
                  <Grid item xs={12} sm={4} key={card.label}>
                    <Card sx={{
                      background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`,
                      border: `1px solid ${card.color}33`,
                    }}>
                      <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                          {card.label}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: card.color, my: 0.5 }}>
                          {card.value != null ? card.value.toLocaleString() : '—'}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                          {card.unit}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
                Datos de la Medición
              </Typography>
              <Grid container spacing={1.5}>
                {detailFields.map(field => (
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
                ))}
              </Grid>

              {selected.claseIEActual && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>Clasificación:</Typography>
                  <Chip label={selected.claseIEActual} color={
                    selected.claseIEActual === 'IE4' ? 'success' :
                    selected.claseIEActual === 'IE3' ? 'info' :
                    selected.claseIEActual === 'IE2' ? 'warning' : 'default'
                  } />
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelected(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cerrar</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Modal crear lectura */}
      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nueva Lectura"
        maxWidth="md"
        hideActions
      >
        <TextField select label="Seleccionar Activo" value={assetId} onChange={(e) => setAssetId(e.target.value)} required fullWidth sx={{ mt: 1, mb: 2 }}>
          {assets.map(asset => (
            <MenuItem key={asset._id} value={asset._id}>
              {asset.nombre} {asset.potenciaKW ? `(${asset.potenciaKW} KW)` : ''}
            </MenuItem>
          ))}
        </TextField>

        {assetId && (
          <EfficiencyCalculator
            key={assetId}
            assetId={assetId}
            onSave={handleSaved}
          />
        )}
      </FormModal>
    </>
  );
}

export default ReadingList;
