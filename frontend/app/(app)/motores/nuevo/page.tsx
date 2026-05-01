"use client";

import { useCreateMotor } from "@/lib/queries/motors";
import { MotorForm } from "@/components/motor/MotorForm";
import { PageHeader } from "@/components/PageHeader";

export default function NuevoMotorPage() {
  const createMotor = useCreateMotor();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Flota"
        title="Nuevo motor"
        description="Carga las especificaciones y la ubicación del motor."
      />
      <MotorForm
        onSubmit={(input) => createMotor.mutateAsync(input)}
        submitLabel="Crear motor"
      />
    </div>
  );
}
