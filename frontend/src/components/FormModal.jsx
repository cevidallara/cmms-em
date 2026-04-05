import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, IconButton, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const backdropSx = {
  backdropFilter: 'blur(6px)',
  backgroundColor: 'rgba(0,0,0,0.6)',
};

function FormModal({ open, onClose, title, children, onSubmit, submitLabel = 'Guardar', maxWidth = 'sm', hideActions }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      slotProps={{ backdrop: { sx: backdropSx } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
      {!hideActions && (
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={onClose} sx={{ color: 'rgba(255,255,255,0.5)' }}>Cancelar</Button>
          <Button variant="contained" onClick={onSubmit}>{submitLabel}</Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default FormModal;
