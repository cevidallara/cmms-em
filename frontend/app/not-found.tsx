import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { AuthBackground } from "@/components/AuthBackground";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-12">
      <AuthBackground />

      <div className="relative w-full max-w-[420px] text-center">
        <div className="mb-6">
          <Logo size={28} className="justify-center text-lg" />
        </div>

        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
          <span className="mr-2 inline-block h-1 w-1 rounded-full bg-volt align-middle" />
          Error 404
        </div>
        <h1 className="mt-3 text-[44px] font-semibold leading-[1.05] tracking-[-0.03em] text-text">
          Página no{" "}
          <span className="bg-gradient-to-r from-volt via-spark to-arc bg-clip-text text-transparent">
            encontrada
          </span>
          .
        </h1>
        <p className="mt-4 text-[14px] text-text-muted">
          El recurso que buscas no existe o fue movido. Volvé al dashboard
          para seguir trabajando con tu flota.
        </p>

        <div className="mt-8 flex justify-center">
          <Link href="/">
            <Button size="lg">Ir al dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
