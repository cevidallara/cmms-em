const RelacionOrganizaciones = require('../models/RelacionOrganizaciones');

const tenantScope = async (req, res, next) => {
  try {
    const { rol, organizacionId } = req.usuario;

    // Superadmin ve todo
    if (rol === 'superadmin') {
      req.tenantFilter = {};
      return next();
    }

    // Empresa users — filtran por su organización
    if (rol === 'empresa_admin' || rol === 'empresa_tecnico') {
      req.tenantFilter = { organizacionId };
      return next();
    }

    // Centro users — depende del recurso
    if (rol === 'centro_admin' || rol === 'centro_tecnico') {
      // Buscar empresas vinculadas a este centro
      const relaciones = await RelacionOrganizaciones.find({
        centroId: organizacionId,
        estado: 'activa',
      });
      const empresaIds = relaciones.map(r => r.empresaId);

      // Para repairs: filtrar por centroServicioId (OTs asignadas a este centro)
      req.tenantFilterRepairs = { centroServicioId: organizacionId };

      // Para assets/readings: read-only de empresas vinculadas
      req.tenantFilter = { organizacionId: { $in: empresaIds } };

      req.empresasVinculadas = empresaIds;
      return next();
    }

    return res.status(403).json({ error: 'Rol no reconocido' });
  } catch (error) {
    console.error('Error en tenantScope:', error);
    res.status(500).json({ error: 'Error al determinar alcance de tenant' });
  }
};

module.exports = { tenantScope };
