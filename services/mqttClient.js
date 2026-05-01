const mqtt = require('mqtt');
const { ingestOne } = require('./ingestService');

let client = null;

/**
 * Topic pattern: nikolator/<orgId>/<externalId>/reading
 *
 * Provider asumido: 'mqtt-generic'. Para que el ingest funcione, debe existir
 * un Sensor con provider='mqtt-generic' y matching externalId en esa org.
 */
function parseTopic(topic) {
  const parts = topic.split('/');
  if (parts.length !== 4) return null;
  if (parts[0] !== 'nikolator' || parts[3] !== 'reading') return null;
  return { orgId: parts[1], externalId: parts[2] };
}

async function handleMessage(topic, message) {
  const parsed = parseTopic(topic);
  if (!parsed) {
    return; // topic ignorado silenciosamente
  }

  let payload;
  try {
    payload = JSON.parse(message.toString());
  } catch (err) {
    console.error(`MQTT: payload inválido en ${topic}:`, err.message);
    return;
  }

  try {
    const result = await ingestOne(
      { externalId: parsed.externalId, provider: 'mqtt-generic', ...payload },
      parsed.orgId,
      'mqtt'
    );
    if (!result.ok) {
      console.warn(`MQTT ingest rechazado para ${topic}: ${result.error}`);
    }
  } catch (err) {
    console.error(`MQTT ingest error en ${topic}:`, err.message);
  }
}

function start() {
  const url = process.env.MQTT_BROKER_URL;
  if (!url) {
    console.log('🛰  MQTT desactivado (MQTT_BROKER_URL no configurada)');
    return null;
  }

  const options = {
    username: process.env.MQTT_USERNAME || undefined,
    password: process.env.MQTT_PASSWORD || undefined,
    reconnectPeriod: 5000,
    connectTimeout: 30 * 1000,
    clientId: `nikolator-backend-${process.pid}-${Date.now().toString(36)}`,
  };

  client = mqtt.connect(url, options);

  client.on('connect', () => {
    console.log(`🛰  MQTT conectado a ${url}`);
    client.subscribe('nikolator/+/+/reading', { qos: 1 }, (err) => {
      if (err) console.error('MQTT subscribe error:', err.message);
      else console.log('🛰  MQTT suscrito a nikolator/+/+/reading');
    });
  });

  client.on('message', handleMessage);
  client.on('error', (err) => console.error('MQTT error:', err.message));
  client.on('reconnect', () => console.log('🛰  MQTT reconectando…'));
  client.on('close', () => console.log('🛰  MQTT desconectado'));

  return client;
}

function stop() {
  if (client) {
    client.end();
    client = null;
  }
}

function status() {
  if (!client) return { connected: false, configured: !!process.env.MQTT_BROKER_URL };
  return { connected: client.connected, configured: true };
}

module.exports = { start, stop, status };
