import React, { useState, useEffect } from 'react';
import api from '../api';
import {
  TextField, Button, Box, Paper, Typography, MenuItem, Grid, Tooltip,
  Accordion, AccordionSummary, AccordionDetails, Card, CardContent
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BoltIcon from '@mui/icons-material/Bolt';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import SaveIcon from '@mui/icons-material/Save';
import {
  calculateEfficiency,
  calculateAnnualConsumption,
  calculateAnnualCost
} from '../utils/efficiencyCalculations';

const initialForm = {
  voltaje: '',
  corriente: '',
  factorPotencia: '0.85',
  factorCarga: '75',
  horasOperacion: '',
  costoEnergia: '',
  moneda: 'CLP',
  claseIEActual: '',
  odometro: '',
  observaciones: '',
  fecha: ''
};

const accordionSx = (color) => ({
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  '&:before': { display: 'none' },
  border: `1px solid ${color}25`,
  mb: 1
});

function EfficiencyCalculator({ assetId, onSave }) {
  const [asset, setAsset] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [results, setResults] = useState({
    eficienciaEstimada: null,
    consumoAnualKWh: null,
    costoAnual: null
  });
  const [saving, setSaving] = useState(false);

  // Cargar datos del activo si viene assetId
  useEffect(() => {
    if (assetId) {
      setAsset(null);
      console.log('[EffCalc] Cargando activo:', assetId);
      api.get(`/assets/${assetId}`)
        .then(res => {
          console.log('[EffCalc] Activo cargado:', res.data.nombre, 'potenciaKW:', res.data.potenciaKW);
          setAsset(res.data);
        })
        .catch(err => console.error('[EffCalc] Error al cargar activo:', err));
    } else {
      setAsset(null);
    }
  }, [assetId]);

  // Calcular resultados en tiempo real
  useEffect(() => {
    const potencia = asset?.potenciaKW ?? null;
    const v = parseFloat(form.voltaje) || 0;
    const i = parseFloat(form.corriente) || 0;
    const fp = parseFloat(form.factorPotencia) || 0.85;
    const fc = parseFloat(form.factorCarga) || 75;
    const horas = parseFloat(form.horasOperacion) || 0;
    const costo = parseFloat(form.costoEnergia) || 0;

    console.log('[EffCalc] Calculando con:', { potencia, v, i, fp, fc, horas, costo });

    const eficiencia = calculateEfficiency(v, i, potencia, fp, fc);
    const consumo = calculateAnnualConsumption(potencia, horas, fc, eficiencia);
    const costoAnual = calculateAnnualCost(consumo, costo);

    console.log('[EffCalc] Resultados:', { eficiencia, consumo, costoAnual });

    setResults({ eficienciaEstimada: eficiencia, consumoAnualKWh: consumo, costoAnual });
  }, [form.voltaje, form.corriente, form.factorPotencia, form.factorCarga, form.horasOperacion, form.costoEnergia, asset]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!assetId) return;
    setSaving(true);
    try {
      const payload = {
        assetId,
        ...form,
        eficienciaEstimada: results.eficienciaEstimada,
        consumoAnualKWh: results.consumoAnualKWh,
        consumoEnergia: results.consumoAnualKWh,
        costoAnual: results.costoAnual
      };
      console.log('Guardando lectura:', payload);
      await api.post('/readings', payload);
      setForm(initialForm);
      setResults({ eficienciaEstimada: null, consumoAnualKWh: null, costoAnual: null });
      if (onSave) onSave(payload);
    } catch (error) {
      console.error('Error al guardar lectura:', error);
    } finally {
      setSaving(false);
    }
  };

  const resultCards = [
    {
      label: 'Eficiencia Estimada',
      value: results.eficienciaEstimada,
      unit: '%',
      color: '#00d4ff',
      gradient: 'linear-gradient(135deg, #00d4ff15, #00d4ff05)',
      icon: <BoltIcon sx={{ fontSize: 28 }} />
    },
    {
      label: 'Consumo Anual',
      value: results.consumoAnualKWh,
      unit: 'kWh',
      color: '#00ff88',
      gradient: 'linear-gradient(135deg, #00ff8815, #00ff8805)',
      icon: <SettingsIcon sx={{ fontSize: 28 }} />
    },
    {
      label: 'Costo Anual',
      value: results.costoAnual,
      unit: form.moneda,
      color: '#ffcc00',
      gradient: 'linear-gradient(135deg, #ffcc0015, #ffcc0005)',
      icon: <BarChartIcon sx={{ fontSize: 28 }} />
    },
  ];

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Calculadora de Eficiencia
        </Typography>
        {asset && (
          <Typography variant="body2" sx={{ color: '#00d4ff' }}>
            {asset.nombre} — {asset.potenciaKW} KW
          </Typography>
        )}
      </Box>

      {/* Datos del Motor */}
      <Accordion defaultExpanded sx={accordionSx('#00d4ff')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00d4ff' }} />}>
          <BoltIcon sx={{ color: '#00d4ff', mr: 1 }} />
          <Typography sx={{ fontWeight: 600 }}>Datos del Motor</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Potencia nominal del motor en kilowatts" arrow>
                <TextField label="Potencia (KW)" value={asset?.potenciaKW || 'Sin activo'} fullWidth disabled
                  helperText={asset ? 'Desde ficha del activo' : 'Seleccione un activo'} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Voltaje medido en bornes del motor (V)" arrow>
                <TextField label="Voltaje (V)" name="voltaje" type="number" value={form.voltaje} onChange={handleChange} fullWidth />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Corriente medida con pinza amperimétrica (A)" arrow>
                <TextField label="Corriente (A)" name="corriente" type="number" value={form.corriente} onChange={handleChange} fullWidth />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Factor de potencia (típico 0.80 - 0.90)" arrow>
                <TextField label="Factor de Potencia" name="factorPotencia" type="number" value={form.factorPotencia} onChange={handleChange} fullWidth
                  inputProps={{ step: 0.01, min: 0, max: 1 }} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Porcentaje de carga respecto a potencia nominal" arrow>
                <TextField label="Factor de Carga (%)" name="factorCarga" type="number" value={form.factorCarga} onChange={handleChange} fullWidth
                  inputProps={{ min: 0, max: 100 }} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Clasificación de eficiencia según IEC 60034-30" arrow>
                <TextField select label="Clase IE" name="claseIEActual" value={form.claseIEActual} onChange={handleChange} fullWidth>
                  <MenuItem value="IE1">IE1 - Estándar</MenuItem>
                  <MenuItem value="IE2">IE2 - Alta</MenuItem>
                  <MenuItem value="IE3">IE3 - Premium</MenuItem>
                  <MenuItem value="IE4">IE4 - Super Premium</MenuItem>
                </TextField>
              </Tooltip>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Datos Operacionales */}
      <Accordion defaultExpanded sx={accordionSx('#00ff88')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#00ff88' }} />}>
          <SettingsIcon sx={{ color: '#00ff88', mr: 1 }} />
          <Typography sx={{ fontWeight: 600 }}>Datos Operacionales</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Horas anuales de operación (8760 = 24/7)" arrow>
                <TextField label="Horas Operación / Año" name="horasOperacion" type="number" value={form.horasOperacion} onChange={handleChange} fullWidth />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Costo por kWh según tarifa eléctrica" arrow>
                <TextField label="Costo Energía (por kWh)" name="costoEnergia" type="number" value={form.costoEnergia} onChange={handleChange} fullWidth
                  inputProps={{ step: 0.01 }} />
              </Tooltip>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Moneda" name="moneda" value={form.moneda} onChange={handleChange} fullWidth>
                <MenuItem value="CLP">CLP</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Fecha Medición" name="fecha" type="date" value={form.fecha} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Tooltip title="Lectura del contador de horas o km" arrow>
                <TextField label="Odómetro" name="odometro" type="number" value={form.odometro} onChange={handleChange} fullWidth />
              </Tooltip>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Observaciones" name="observaciones" value={form.observaciones} onChange={handleChange} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Resultados */}
      <Accordion defaultExpanded sx={accordionSx('#ffcc00')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#ffcc00' }} />}>
          <BarChartIcon sx={{ color: '#ffcc00', mr: 1 }} />
          <Typography sx={{ fontWeight: 600 }}>Resultados</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {resultCards.map(card => (
              <Grid item xs={12} sm={4} key={card.label}>
                <Card sx={{
                  background: card.gradient,
                  border: `1px solid ${card.color}33`,
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: `0 4px 20px ${card.color}20` }
                }}>
                  <CardContent sx={{ textAlign: 'center', py: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {card.label}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: card.color, my: 0.5 }}>
                      {card.value !== null ? card.value.toLocaleString() : '—'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      {card.unit}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {assetId && (
        <Button
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          startIcon={<SaveIcon />}
          disabled={saving || !results.eficienciaEstimada}
          onClick={handleSave}
          sx={{ mt: 1 }}
        >
          {saving ? 'Guardando...' : 'Guardar Lectura'}
        </Button>
      )}
    </Paper>
  );
}

export default EfficiencyCalculator;
