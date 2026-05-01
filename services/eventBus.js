/**
 * In-memory pub/sub para SSE, scoped por organizacionId.
 *
 * Limitación: single-instance. Si el backend escala a múltiples instancias,
 * los eventos solo llegan a clientes conectados a la misma instancia que
 * recibió el ingest. Para multi-instancia, reemplazar por Redis pub/sub.
 */
const subscribers = new Map(); // orgId (string) → Set<callback>

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

function publish(orgId, event) {
  const set = subscribers.get(String(orgId));
  if (!set) return 0;
  let delivered = 0;
  for (const cb of set) {
    try {
      cb(event);
      delivered += 1;
    } catch (err) {
      console.error('eventBus publish error:', err.message);
    }
  }
  return delivered;
}

function stats() {
  let total = 0;
  for (const set of subscribers.values()) total += set.size;
  return { orgs: subscribers.size, totalSubscribers: total };
}

module.exports = { subscribe, publish, stats };
