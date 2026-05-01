"use client";

import { use } from "react";
import { useMotor, useUpdateMotor } from "@/lib/queries/motors";
import { MotorForm } from "@/components/motor/MotorForm";
import { PageHeader } from "@/components/PageHeader";
import { Spinner } from "@/components/ui/Spinner";

export default function EditarMotorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const motorQuery = useMotor(id);
  const updateMotor = useUpdateMotor(id);

  if (motorQuery.isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={24} className="text-volt" />
      </div>
    );
  }
  if (!motorQuery.data) {
    return (
      <div className="text-[13px] text-danger">
        Motor no encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flota"
        title={`Editar · ${motorQuery.data.nombre}`}
        description="Modifica especificaciones, ubicación o estado."
      />
      <MotorForm
        initial={motorQuery.data}
        onSubmit={(input) => updateMotor.mutateAsync(input)}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
