import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { TableCell, TextField, MenuItem, Grid } from '@mui/material';
import DataList from './DataList';
import FormModal from './FormModal';

const sectores = ['Digestor', 'Cerdos', 'Aves', 'Mantenimiento', 'Planta Graneros', 'Ingeniería'];

const categorias = [
  'Motores Eléctricos',
  'Bombas y Motobombas',
  'Ventilación y Movimiento de Aire',
  'Reductores y Motoreductores'
];

const subcategoriasPorCategoria = {
  'Motores Eléctricos': ['Motor Trifásico', 'Motor Monofásico', 'Motor DC', 'Servomotor'],
  'Bombas y Motobombas': ['Electrobomba', 'Bomba Centrífuga', 'Bomba Sumergible', 'Motobomba'],
  'Ventilación y Movimiento de Aire': ['Ventilador Axial', 'Ventilador Centrífugo', 'Extractor', 'Soplador'],
  'Reductores y Motoreductores': ['Reductor de Velocidad', 'Motoreductor', 'Variador Mecánico']
};

const initialForm = {
  nombre: '', tipo: '', modelo: '', ubicacion: '', estado: '',
  cliente: '', sector: '', categoria: '', subcategoria: '',
  potenciaKW: '', marca: '', numeroSerie: ''
};

const columns = [
  { key: 'cliente', label: 'Cliente' },
  { key: 'nombre', label: 'Nombre' },
  { key: 'tipo', label: 'Tipo / Subcategoría' },
  { key: 'potenciaKW', label: 'Potencia KW' },
  { key: 'sector', label: 'Sector' },
  { key: 'estado', label: 'Estado' },
  { key: 'ubicacion', label: 'Ubicación' },
];

function AssetList({ refresh, onAssetCreated }) {
  const [assets, setAssets] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const fetchAssets = () => {
    api.get('/assets?esBackup=false')
      .then(res => setAssets(res.data))
      .catch(err => console.error('Error al cargar activos:', err));
  };

  useEffect(() => { fetchAssets(); }, [refresh]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'categoria') {
      setForm({ ...form, categoria: value, subcategoria: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async () => {
    try {
      const res = await api.post('/assets', form);
      setForm(initialForm);
      setCreateOpen(false);
      fetchAssets();
      if (onAssetCreated) onAssetCreated(res.data);
    } catch (error) {
      console.error('Error al crear activo:', error);
    }
  };

  const renderRow = (asset) => (
    <>
      <TableCell>{asset.cliente}</TableCell>
      <TableCell>
        <Link to={`/activos/${asset._id}`} style={{ color: '#00d4ff', textDecoration: 'none' }}
          onMouseEnter={e => e.target.style.textDecoration = 'underline'}
          onMouseLeave={e => e.target.style.textDecoration = 'none'}>
          {asset.nombre}
        </Link>
      </TableCell>
      <TableCell>{asset.tipo}{asset.subcategoria ? ` / ${asset.subcategoria}` : ''}</TableCell>
      <TableCell>{asset.potenciaKW}</TableCell>
      <TableCell>{asset.sector}</TableCell>
      <TableCell>{asset.estadoActual || asset.estado}</TableCell>
      <TableCell>{asset.ubicacion}</TableCell>
    </>
  );

  return (
    <>
      <DataList
        title="Activos"
        columns={columns}
        data={assets}
        onAdd={() => { setForm(initialForm); setCreateOpen(true); }}
        addLabel="Nuevo Activo"
        renderRow={renderRow}
      />

      <FormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Nuevo Activo"
        onSubmit={handleSubmit}
        submitLabel="Crear Activo"
      >
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField label="Nombre" name="nombre" value={form.nombre} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Cliente" name="cliente" value={form.cliente} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Sector" name="sector" value={form.sector} onChange={handleChange} fullWidth>
              {sectores.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Categoría" name="categoria" value={form.categoria} onChange={handleChange} fullWidth>
              {categorias.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Subcategoría" name="subcategoria" value={form.subcategoria} onChange={handleChange} fullWidth disabled={!form.categoria}>
              {(subcategoriasPorCategoria[form.categoria] || []).map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Tipo" name="tipo" value={form.tipo} onChange={handleChange} required fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Modelo" name="modelo" value={form.modelo} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Marca" name="marca" value={form.marca} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="N° Serie" name="numeroSerie" value={form.numeroSerie} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Potencia (KW)" name="potenciaKW" type="number" value={form.potenciaKW} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Ubicación" name="ubicacion" value={form.ubicacion} onChange={handleChange} fullWidth />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Estado" name="estado" value={form.estado} onChange={handleChange} fullWidth />
          </Grid>
        </Grid>
      </FormModal>
    </>
  );
}

export default AssetList;
