import type { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-elev/30 px-6 py-16 text-center">
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-elev text-text-muted">
          {icon}
        </div>
      )}
      <h3 className="text-[15px] font-medium text-text">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-[13px] text-text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
