import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
};

export const Field = forwardRef<HTMLInputElement, Props>(function Field(
  { label, hint, error, containerClassName = "", className = "", id, ...rest },
  ref
) {
  const fid = id || `field-${rest.name || label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <label
        htmlFor={fid}
        className="block text-[12px] font-medium text-text-muted"
      >
        {label}
      </label>
      <input
        ref={ref}
        id={fid}
        className={`block w-full rounded-lg border border-border bg-elev/60 px-3 py-2.5 text-[14px] text-text placeholder:text-text-dim outline-none transition-colors focus:border-volt/50 focus:ring-2 focus:ring-volt/15 ${error ? "border-danger/50 focus:border-danger focus:ring-danger/20" : ""} ${className}`}
        {...rest}
      />
      {error ? (
        <p className="text-[12px] text-danger">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-text-dim">{hint}</p>
      ) : null}
    </div>
  );
});

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  options: { value: string; label: string }[];
  error?: string;
  containerClassName?: string;
};

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
  function SelectField(
    { label, options, error, containerClassName = "", className = "", id, ...rest },
    ref
  ) {
    const fid = id || `select-${rest.name || label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        <label htmlFor={fid} className="block text-[12px] font-medium text-text-muted">
          {label}
        </label>
        <select
          ref={ref}
          id={fid}
          className={`block w-full appearance-none rounded-lg border border-border bg-elev/60 px-3 py-2.5 pr-9 text-[14px] text-text outline-none transition-colors focus:border-volt/50 focus:ring-2 focus:ring-volt/15 ${error ? "border-danger/50" : ""} ${className}`}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none'><path d='M3 5l3 3 3-3' stroke='%23ECEFF7' stroke-opacity='0.5' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>\")",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 0.65rem center",
            backgroundSize: "12px 12px",
          }}
          {...rest}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-elev text-text">
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[12px] text-danger">{error}</p>}
      </div>
    );
  }
);
