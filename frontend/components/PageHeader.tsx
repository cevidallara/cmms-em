import type { ReactNode } from "react";

type Props = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, actions }: Props) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-border">
      <div>
        {eyebrow && (
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-text-muted">
            <span className="mr-2 inline-block h-1 w-1 rounded-full bg-volt align-middle" />
            {eyebrow}
          </div>
        )}
        <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.02em] text-text">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-[14px] text-text-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
