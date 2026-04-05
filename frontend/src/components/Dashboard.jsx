import React, { useState, useEffect } from 'react';
import api from '../api';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import BuildIcon from '@mui/icons-material/Build';
import SpeedIcon from '@mui/icons-material/Speed';
import BoltIcon from '@mui/icons-material/Bolt';
import EnergyDashboard from './EnergyDashboard';
import { cardSizes, spacing } from '../designTokens';

const cards = [
  { key: 'assets', label: 'Total Activos', icon: <FactoryIcon sx={{ fontSize: 32 }} />, color: '#00d4ff' },
  { key: 'repairs', label: 'Reparaciones Activas', icon: <BuildIcon sx={{ fontSize: 32 }} />, color: '#ff9900' },
  { key: 'readings', label: 'Lecturas Este Mes', icon: <SpeedIcon sx={{ fontSize: 32 }} />, color: '#00ff88' },
  { key: 'power', label: 'Potencia Instalada (KW)', icon: <BoltIcon sx={{ fontSize: 32 }} />, color: '#ffcc00' },
];

function Dashboard() {
  const [stats, setStats] = useState({ assets: 0, repairs: 0, readings: 0, power: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [assetsRes, repairsRes, readingsRes] = await Promise.all([
          api.get('/assets'),
          api.get('/repairs'),
          api.get('/readings'),
        ]);

        const assets = assetsRes.data;
        const repairs = repairsRes.data;
        const readings = readingsRes.data;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        setStats({
          assets: assets.length,
          repairs: repairs.filter(r => r.progreso !== 'Despachado').length,
          readings: readings.filter(r => new Date(r.fecha) >= startOfMonth).length,
          power: assets.reduce((sum, a) => sum + (a.potenciaKW || 0), 0),
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>Dashboard</Typography>

      <Grid container spacing={spacing.gridGap} sx={{ mb: spacing.sectionGap }}>
        {cards.map(card => (
          <Grid item {...cardSizes.stat.columns} key={card.key}>
            <Card sx={{
              height: cardSizes.stat.height,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${card.color}10, ${card.color}05)`,
              border: `1px solid ${card.color}20`,
              transition: 'transform 0.15s',
              '&:hover': { transform: 'translateY(-4px)' },
              cursor: 'default',
            }}>
              <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: card.color, lineHeight: 1.2 }}>
                  {stats[card.key]}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', mt: 0.5 }}>
                  {card.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <EnergyDashboard />
    </Box>
  );
}

export default Dashboard;
