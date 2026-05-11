/**
 * In-memory pub/sub para SSE, scoped por organizacionId.
 *
 * Limitación: single-instance. Si el backend escala a múltiples instancias,
 * los eventos solo llegan a clientes conectados a la misma instancia que
 * recibió el ingest. Para multi-instancia, reemplazar por Redis pub/sub.
 */
const subscribers = new Map(); // orgId (string) → Set<callback>
const allSubscribers = new Set(); // wildcard listeners (superadmin, dashboards)

function subscribe(orgId, callback) {
  const key = String(orgId);
  if (!subscribers.has(key)) subscribers.set(key, new Set());
  subscribers.get(key).add(callback);

  return function unsubscribe() {
    const set = subscribers.get(key);
    if (set) {
      set.delete(callback);
      if (set.size === 0) subscribers.delete(key);
    }
  };
}

/**
 * Suscribe a TODOS los eventos de TODAS las orgs.
 * Usado por superadmin / dashboards globales. En producción, considerar
 * permission gating si hay muchas orgs (volumen alto).
 */
function subscribeAll(callback) {
  allSubscribers.add(callback);
  return function unsubscribe() {
    allSubscribers.delete(callback);
  };
}

function publish(orgId, event) {
  let delivered = 0;
  const set = subscribers.get(String(orgId));
  if (set) {
    for (const cb of set) {
      try {
        cb(event);
        delivered += 1;
      } catch (err) {
        console.error('eventBus publish error:', err.message);
      }
    }
  }
  for (const cb of allSubscribers) {
    try {
      cb({ ...event, _orgId: String(orgId) });
      delivered += 1;
    } catch (err) {
      console.error('eventBus publish (all) error:', err.message);
    }
  }
  return delivered;
}

function stats() {
  let total = 0;
  for (const set of subscribers.values()) total += set.size;
  return { orgs: subscribers.size, totalSubscribers: total, wildcardSubscribers: allSubscribers.size };
}

module.exports = { subscribe, subscribeAll, publish, stats };
