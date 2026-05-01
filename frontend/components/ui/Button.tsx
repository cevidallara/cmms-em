import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

const variantStyles: Record<Variant, string> = {
  primary:
    "bg-volt text-bg shadow-[0_10px_30px_-12px_rgba(181,245,0,0.5)] hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0",
  secondary:
    "border border-border-strong bg-elev/60 text-text hover:bg-elev backdrop-blur",
  ghost: "text-text-muted hover:text-text hover:bg-elev/60",
  danger:
    "bg-danger text-white hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0",
};

const sizeStyles: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-md",
  md: "h-10 px-4 text-sm rounded-lg",
  lg: "h-12 px-6 text-[15px] rounded-full",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  {
    variant = "primary",
    size = "md",
    loading,
    disabled,
    iconLeft,
    iconRight,
    fullWidth,
    className = "",
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`group inline-flex items-center justify-center gap-2 font-medium transition-all ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...rest}
    >
      {loading ? (
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        iconLeft
      )}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
});
