import React from 'react';
import {
  Paper, Box, Typography, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

function DataList({ title, columns, data, onAdd, addLabel = '+ Crear', renderRow, onRowClick }) {
  return (
    <Paper elevation={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
        {onAdd && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </Box>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#1a1f3a' }}>
              {columns.map(col => (
                <TableCell key={col.key || col.label}>
                  <strong>{col.label}</strong>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((item, index) => (
              <TableRow
                key={item._id || index}
                hover
                sx={onRowClick ? { cursor: 'pointer' } : undefined}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {renderRow(item)}
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ textAlign: 'center', py: 4, color: 'rgba(255,255,255,0.4)' }}>
                  No hay registros.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default DataList;
