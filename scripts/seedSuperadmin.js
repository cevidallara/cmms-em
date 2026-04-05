/**
 * Seed de Superadmin
 *
 * Crea el usuario superadmin inicial si no existe.
 *
 * Uso: node scripts/seedSuperadmin.js
 *
 * Variables de entorno opcionales:
 *   SUPERADMIN_EMAIL    (default: admin@cmms-em.com)
 *   SUPERADMIN_PASSWORD (default: Admin123!)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Usuario = require('../models/Usuario');

async function seed() {
  await connectDB();

  const email = process.env.SUPERADMIN_EMAIL || 'admin@cmms-em.com';
  const password = process.env.SUPERADMIN_PASSWORD || 'Admin123!';

  const existente = await Usuario.findOne({ email });
  if (existente) {
    console.log(`Superadmin ya existe: ${email}`);
    await mongoose.disconnect();
    return;
  }

  const superadmin = await Usuario.create({
    email,
    password,
    nombre: 'Super',
    apellido: 'Admin',
    organizacionId: null,
    rol: 'superadmin',
  });

  console.log(`Superadmin creado:`);
  console.log(`  Email:    ${superadmin.email}`);
  console.log(`  Password: ${password}`);
  console.log(`\n⚠️  Cambie la contraseña después del primer login.`);

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Error en seed:', err);
  process.exit(1);
});
