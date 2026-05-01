import type { HTMLAttributes, ReactNode } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  elevated?: boolean;
};

export function Card({ children, elevated, className = "", ...rest }: Props) {
  return (
    <div
      className={`rounded-2xl border border-border bg-elev/60 backdrop-blur-xl ${elevated ? "shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] border-border-strong" : ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 border-b border-border ${className}`}>{children}</div>;
}

export function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
