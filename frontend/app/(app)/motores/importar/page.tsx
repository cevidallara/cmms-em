"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, FileSpreadsheet } from "lucide-react";
import { PageContainer } from "@/components/PageContainer";
import { PageHeader } from "@/components/PageHeader";
import { SpreadsheetUploader } from "@/components/onboarding/SpreadsheetUploader";
import { NameplateUploader } from "@/components/onboarding/NameplateUploader";

type Tab = "spreadsheet" | "nameplate";

export default function ImportarMotoresPage() {
  const [tab, setTab] = useState<Tab>("spreadsheet");

  return (
    <PageContainer>
      <Link
        href="/motores"
        className="inline-flex items-center gap-1 text-[12px] text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={12} /> Volver a motores
      </Link>

      <PageHeader
        eyebrow="Onboarding IA"
        title="Importar motores"
        description="Subí tu inventario en planilla o sacale una foto a la placa — el agente extrae y crea los registros."
      />

      <div className="flex gap-1 rounded-lg border border-border bg-bg/40 p-1">
        <TabButton active={tab === "spreadsheet"} onClick={() => setTab("spreadsheet")} icon={<FileSpreadsheet size={14} />}>
          Excel / CSV
        </TabButton>
        <TabButton active={tab === "nameplate"} onClick={() => setTab("nameplate")} icon={<Camera size={14} />}>
          Foto de placa
        </TabButton>
      </div>

      {tab === "spreadsheet" ? <SpreadsheetUploader /> : <NameplateUploader />}
    </PageContainer>
  );
}

function TabButton({
  active, onClick, icon, children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
        active
          ? "bg-volt text-bg shadow-sm"
          : "text-text-muted hover:bg-elev/60 hover:text-text"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
