"use client";

import { useState, type FormEvent } from "react";
import { Plug, Plus, Key, Copy, Check, Trash2, Webhook, Cable } from "lucide-react";
import { useApiKeys, useCreateApiKey, useDeleteApiKey } from "@/lib/queries/apikeys";
import { PageHeader } from "@/components/PageHeader";
import { PageContainer } from "@/components/PageContainer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ErrorState";
import { Modal } from "@/components/Modal";
import { SENSOR_PROVIDERS, type ApiKeyCreated } from "@/lib/types";

const apiBase =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:3000/api";

const providerStatusStyle = {
  active: { label: "Activo", className: "border-success/30 bg-success/10 text-success" },
  beta: { label: "Beta", className: "border-warning/30 bg-warning/10 text-warning" },
  soon: { label: "Próximamente", className: "border-border bg-bg/40 text-text-dim" },
} as const;

function CodeBlock({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="relative">
      <pre className="overflow-x-auto rounded-lg border border-border bg-bg/60 p-4 font-mono text-[11px] leading-relaxed text-text-muted">
        {children}
      </pre>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-border bg-elev/80 px-2 py-1 font-mono text-[10px] text-text-muted backdrop-blur transition-colors hover:bg-elev hover:text-text"
      >
        {copied ? <Check size={11} /> : <Copy size={11} />}
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}

export default function IntegracionesPage() {
  const apiKeysQuery = useApiKeys();
  const createKey = useCreateApiKey();
  const deleteKey = useDeleteApiKey();

  const [openCreate, setOpenCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<ApiKeyCreated | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const created = await createKey.mutateAsync({ nombre: newKeyName.trim() });
    setCreatedKey(created);
    setNewKeyName("");
    setOpenCreate(false);
  };

  const handleDelete = (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar la API key "${nombre}"? Las integraciones que la usen dejarán de funcionar.`)) return;
    deleteKey.mutate(id);
  };

  const copyCreatedKey = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.key);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  const exampleKey = "nik_live_TU_API_KEY_ACA";
  const ingestUrl = `${apiBase}/ingest`;

  const curlExample = `curl -X POST ${ingestUrl} \\
  -H "Authorization: Bearer ${exampleKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "externalId": "DYN-1234",
    "provider": "webhook",
    "fecha": "${new Date().toISOString()}",
    "consumoEnergia": 124.8,
    "voltaje": 380,
    "corriente": 18.4,
    "horasOperacion": 4321,
    "eficienciaEstimada": 87.2
  }'`;

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Integraciones"
        title="Sensores y conectores"
        description="Conecta cualquier sensor — Dynamox, Tractian, WEG, MQTT, genéricos. Una sola vista para toda tu flota."
        actions={
          <Button iconLeft={<Plus size={14} />} onClick={() => setOpenCreate(true)}>
            Nueva API key
          </Button>
        }
      />

      {/* API keys */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Key size={14} className="text-volt" />
          <div className="text-[13px] font-medium text-text">API keys</div>
        </div>

        {apiKeysQuery.isLoading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : apiKeysQuery.isError ? (
          <ErrorState
            title="No pudimos cargar las API keys"
            message={(apiKeysQuery.error as Error).message}
            onRetry={() => apiKeysQuery.refetch()}
          />
        ) : (apiKeysQuery.data?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-bg/30 px-4 py-8 text-center">
            <Key size={20} className="mx-auto mb-3 text-text-dim" />
            <div className="text-[13px] text-text">Sin API keys creadas</div>
            <div className="mt-1 text-[11px] text-text-muted">
              Crea una para empezar a recibir datos de tus sensores.
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-border bg-bg/40">
                <tr className="font-mono text-[10px] uppercase tracking-wider text-text-dim">
                  <th className="px-3 py-2 font-normal">Nombre</th>
                  <th className="px-3 py-2 font-normal">Prefix</th>
                  <th className="px-3 py-2 font-normal">Scopes</th>
                  <th className="px-3 py-2 font-normal">Último uso</th>
                  <th className="px-3 py-2 font-normal">Estado</th>
                  <th className="px-3 py-2 text-right font-normal" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apiKeysQuery.data!.map((k) => {
                  const isRevoked = !!k.revokedAt;
                  return (
                    <tr key={k._id} className={`hover:bg-elev/40 transition-colors ${isRevoked ? "opacity-50" : ""}`}>
                      <td className="px-3 py-2.5 text-text">{k.nombre}</td>
                      <td className="px-3 py-2.5 font-mono text-text-muted">{k.prefix}…</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {k.scopes.map((s) => (
                            <span
                              key={s}
                              className="rounded-md border border-border bg-bg/40 px-1.5 py-0.5 font-mono text-[10px] text-text-muted"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-text-muted">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("es-CL") : "nunca"}
                      </td>
                      <td className="px-3 py-2.5">
                        {isRevoked ? (
                          <span className="font-mono text-[10px] uppercase tracking-wider text-danger">revocada</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-success">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            activa
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          onClick={() => handleDelete(k._id, k.nombre)}
                          className="grid h-7 w-7 place-items-center rounded-md text-text-dim transition-colors hover:bg-elev hover:text-danger"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Webhook docs */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Webhook size={14} className="text-volt" />
          <div className="text-[13px] font-medium text-text">Webhook genérico</div>
          <span className="rounded-md border border-success/30 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
            activo
          </span>
        </div>

        <div className="space-y-4">
          <div className="text-[13px] text-text-muted">
            Cualquier sistema que pueda hacer un POST HTTP puede enviar lecturas a Nikolator.
            Es la forma más simple de integrar — funciona con un curl, un script en Python,
            un webhook nativo de Dynamox o Tractian, o cualquier IoT gateway.
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Endpoint
            </div>
            <div className="rounded-lg border border-border bg-bg/60 px-3 py-2 font-mono text-[12px] text-text">
              POST {ingestUrl}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Headers
            </div>
            <div className="rounded-lg border border-border bg-bg/60 px-3 py-2 font-mono text-[12px] text-text-muted">
              Authorization: Bearer <span className="text-spark">nik_live_…</span>
              <br />
              Content-Type: application/json
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-text-dim">
              Ejemplo
            </div>
            <CodeBlock>{curlExample}</CodeBlock>
          </div>

          <div className="text-[12px] text-text-muted">
            <strong className="text-text">Importante:</strong> el sensor con el{" "}
            <span className="font-mono text-spark">externalId</span> debe estar previamente
            registrado en el motor — andá al detalle del motor → "Sensores conectados" → "Conectar sensor".
          </div>
        </div>
      </Card>

      {/* Conectores */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Cable size={14} className="text-volt" />
          <div className="text-[13px] font-medium text-text">Conectores soportados</div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SENSOR_PROVIDERS.filter((p) => p.value !== "manual").map((p) => {
            const style = providerStatusStyle[p.status];
            return (
              <div
                key={p.value}
                className="flex items-start justify-between rounded-xl border border-border bg-bg/40 p-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Plug size={14} className="text-text-dim" />
                    <div className="text-[13px] font-medium text-text">{p.label}</div>
                  </div>
                  <div className="mt-1 font-mono text-[10px] text-text-dim">{p.value}</div>
                </div>
                <span className={`rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style.className}`}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 text-[12px] text-text-dim">
          Los conectores marcados "próximamente" usan internamente el mismo endpoint canónico.
          Cuando estén disponibles serán adaptadores first-party que automatizan el setup.
        </div>
      </Card>

      {/* Modal: crear API key */}
      <Modal
        open={openCreate}
        onClose={() => {
          setOpenCreate(false);
          setNewKeyName("");
        }}
        title="Nueva API key"
        description="Las API keys autentican las llamadas al endpoint de ingesta."
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Field
            label="Nombre"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
            autoFocus
            placeholder="ej. Dynamox producción, Gateway IoT planta sur"
            hint="Solo para identificar esta key en la lista. No se muestra al cliente."
          />
          <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5 text-[12px] text-text-muted">
            La key se mostrará <strong className="text-warning">una sola vez</strong> al crearla.
            Guárdala en un manager de secretos antes de cerrar el diálogo.
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setOpenCreate(false);
                setNewKeyName("");
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={createKey.isPending} disabled={!newKeyName.trim()}>
              Crear key
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: mostrar plaintext de la key recién creada */}
      <Modal
        open={!!createdKey}
        onClose={() => setCreatedKey(null)}
        title="API key creada"
        description={`Nombre: ${createdKey?.nombre ?? ""}`}
        size="lg"
      >
        {createdKey && (
          <div className="space-y-4">
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 text-[12px] text-warning">
              ⚠ Esta es la única vez que verás la key completa. Copiala ahora.
            </div>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg border border-volt/30 bg-bg/80 p-4 font-mono text-[12px] text-volt break-all">
                {createdKey.key}
              </pre>
              <button
                type="button"
                onClick={copyCreatedKey}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border border-volt/30 bg-elev/80 px-2 py-1 font-mono text-[10px] text-volt backdrop-blur transition-colors hover:bg-volt hover:text-bg"
              >
                {keyCopied ? <Check size={11} /> : <Copy size={11} />}
                {keyCopied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <div className="text-[12px] text-text-muted">
              Usá esta key en el header <span className="font-mono text-spark">Authorization: Bearer …</span>{" "}
              de tus llamadas al endpoint de ingesta.
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={() => setCreatedKey(null)}>Listo, la copié</Button>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
