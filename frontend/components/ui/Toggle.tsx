"use client";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, label, description, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3 text-left"
    >
      <span
        className={`relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-volt" : "bg-elev-2"
        } ${disabled ? "opacity-50" : ""}`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      {(label || description) && (
        <span className="flex-1">
          {label && <span className="block text-[13px] font-medium text-text">{label}</span>}
          {description && (
            <span className="mt-0.5 block text-[12px] text-text-muted">{description}</span>
          )}
        </span>
      )}
    </button>
  );
}
