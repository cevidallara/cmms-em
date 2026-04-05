/**
 * Migración a multi-tenant
 *
 * Asigna todos los documentos existentes (sin organizacionId)
 * a una organización por defecto. Ejecutar una sola vez.
 *
 * Uso: node scripts/migrateToMultitenant.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Organizacion = require('../models/Organizacion');
const Asset = require('../models/Asset');
const Repair = require('../models/Repair');
const Reading = require('../models/Reading');

async function migrate() {
  await connectDB();

  // Crear org por defecto si no existe
  let org = await Organizacion.findOne({ nombre: 'Organización Inicial' });
  if (!org) {
    org = await Organizacion.create({
      nombre: 'Organización Inicial',
      tipo: 'empresa',
    });
    console.log(`Organización creada: ${org._id}`);
  } else {
    console.log(`Organización existente: ${org._id}`);
  }

  // Asignar organizacionId a documentos que no lo tienen
  const assetResult = await Asset.updateMany(
    { organizacionId: { $exists: false } },
    { $set: { organizacionId: org._id } }
  );
  console.log(`Assets actualizados: ${assetResult.modifiedCount}`);

  const repairResult = await Repair.updateMany(
    { organizacionId: { $exists: false } },
    { $set: { organizacionId: org._id } }
  );
  console.log(`Repairs actualizados: ${repairResult.modifiedCount}`);

  const readingResult = await Reading.updateMany(
    { organizacionId: { $exists: false } },
    { $set: { organizacionId: org._id } }
  );
  console.log(`Readings actualizados: ${readingResult.modifiedCount}`);

  // También asignar a los que tienen organizacionId: null
  const assetNull = await Asset.updateMany(
    { organizacionId: null },
    { $set: { organizacionId: org._id } }
  );
  const repairNull = await Repair.updateMany(
    { organizacionId: null },
    { $set: { organizacionId: org._id } }
  );
  const readingNull = await Reading.updateMany(
    { organizacionId: null },
    { $set: { organizacionId: org._id } }
  );
  console.log(`Assets (null→org): ${assetNull.modifiedCount}`);
  console.log(`Repairs (null→org): ${repairNull.modifiedCount}`);
  console.log(`Readings (null→org): ${readingNull.modifiedCount}`);

  console.log('\nMigración completada.');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('Error en migración:', err);
  process.exit(1);
});
