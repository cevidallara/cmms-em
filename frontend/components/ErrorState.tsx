import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Algo salió mal",
  message,
  onRetry,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-danger/20 bg-danger/5 px-6 py-12 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-danger/30 bg-danger/10 text-danger">
        <AlertTriangle size={20} />
      </div>
      <h3 className="mt-4 text-[15px] font-medium text-text">{title}</h3>
      {message && (
        <p className="mt-1.5 max-w-md text-[13px] text-text-muted">{message}</p>
      )}
      {onRetry && (
        <Button
          variant="secondary"
          iconLeft={<RotateCcw size={13} />}
          onClick={onRetry}
          className="mt-5"
        >
          Reintentar
        </Button>
      )}
    </div>
  );
}
