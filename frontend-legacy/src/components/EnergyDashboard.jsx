import React, { useState, useEffect } from 'react';
import api from '../api';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { cardSizes, spacing } from '../designTokens';

const COLORS = ['#00d4ff', '#00ff88', '#ff6b35', '#ffcc00', '#ff44cc', '#8866ff'];
const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const tooltipStyle = {
  contentStyle: { backgroundColor: '#1e2139', border: '1px solid rgba(0,212,255,0.2)', borderRadius: 8 },
  labelStyle: { color: '#fff' },
  itemStyle: { color: '#00d4ff' },
};

const chartCardSx = (borderColor) => ({
  height: cardSizes.chart.height,
  display: 'flex',
  flexDirection: 'column',
  border: `1px solid ${borderColor}`,
});

const chartContentSx = {
  flex: 1, display: 'flex', flexDirection: 'column', p: 2, '&:last-child': { pb: 2 },
};

function EnergyDashboard() {
  const [consumoMensual, setConsumoMensual] = useState([]);
  const [potenciaSector, setPotenciaSector] = useState([]);
  const [activosCategoria, setActivosCategoria] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, readingsRes] = await Promise.all([
          api.get('/assets'),
          api.get('/readings'),
        ]);
        const assets = assetsRes.data;
        const readings = readingsRes.data;

        const consumoMap = {};
        readings.forEach(r => {
          if (r.fecha && r.consumoEnergia) {
            const date = new Date(r.fecha);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!consumoMap[key]) consumoMap[key] = { mes: label, sortKey: key, kWh: 0 };
            consumoMap[key].kWh += r.consumoEnergia;
          }
        });
        setConsumoMensual(Object.values(consumoMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey)));

        const sectorMap = {};
        assets.forEach(a => {
          if (a.sector && a.potenciaKW) sectorMap[a.sector] = (sectorMap[a.sector] || 0) + a.potenciaKW;
        });
        setPotenciaSector(Object.entries(sectorMap).map(([sector, kw]) => ({ sector, kw })));

        const catMap = {};
        assets.forEach(a => {
          const cat = a.categoria || 'Sin categoría';
          catMap[cat] = (catMap[cat] || 0) + 1;
        });
        setActivosCategoria(Object.entries(catMap).map(([name, value]) => ({ name, value })));
      } catch (error) {
        console.error('Error al cargar datos de energía:', error);
      }
    };
    fetchData();
  }, []);

  return (
    <div>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Eficiencia Energética</Typography>
      <Grid container spacing={spacing.gridGap}>
        {/* Consumo mensual */}
        <Grid item {...cardSizes.chart.columns}>
          <Card sx={chartCardSx('rgba(0,212,255,0.15)')}>
            <CardContent sx={chartContentSx}>
              <Typography variant="subtitle2" sx={{ color: '#00d4ff', mb: 1.5 }}>
                Consumo Energético Mensual
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={consumoMensual}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="mes" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={60} />
                    <Tooltip {...tooltipStyle} />
                    <Line type="monotone" dataKey="kWh" stroke="#00d4ff" strokeWidth={2.5} dot={{ fill: '#00d4ff', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Potencia por sector */}
        <Grid item {...cardSizes.chart.columns}>
          <Card sx={chartCardSx('rgba(0,255,136,0.15)')}>
            <CardContent sx={chartContentSx}>
              <Typography variant="subtitle2" sx={{ color: '#00ff88', mb: 1.5 }}>
                Potencia Instalada por Sector
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={potenciaSector}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="sector" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} width={40} />
                    <Tooltip {...tooltipStyle} />
                    <Bar dataKey="kw" name="KW" fill="#00ff88" radius={[6, 6, 0, 0]} fillOpacity={0.8} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Activos por categoría — full width para fila par */}
        <Grid item {...cardSizes.chart.columns}>
          <Card sx={chartCardSx('rgba(255,204,0,0.15)')}>
            <CardContent sx={chartContentSx}>
              <Typography variant="subtitle2" sx={{ color: '#ffcc00', mb: 1.5 }}>
                Activos por Categoría
              </Typography>
              <Box sx={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activosCategoria} dataKey="value" nameKey="name" cx="50%" cy="45%"
                      outerRadius="70%" innerRadius="35%" paddingAngle={3}
                    >
                      {activosCategoria.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}

export default EnergyDashboard;
