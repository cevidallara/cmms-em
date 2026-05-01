type Props = {
  nombre: string;
  size?: number;
  className?: string;
};

const palettes = [
  { from: "#7C3AED", to: "#00E5FF" },
  { from: "#00E5FF", to: "#B5F500" },
  { from: "#B5F500", to: "#7C3AED" },
  { from: "#FF9F1C", to: "#FF4D6D" },
  { from: "#10D27D", to: "#00E5FF" },
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function initials(nombre: string) {
  const parts = nombre.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function CentroAvatar({ nombre, size = 36, className = "" }: Props) {
  const palette = palettes[hash(nombre) % palettes.length];
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-xl font-mono font-medium text-bg ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        fontSize: size * 0.36,
      }}
    >
      {initials(nombre)}
    </div>
  );
}
