export function AuthBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-32 -left-40 h-[680px] w-[680px] rounded-full opacity-50 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 30% 30%, rgba(124,58,237,0.55), transparent 60%)",
          animation: "slow-drift 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-10 right-[-160px] h-[620px] w-[620px] rounded-full opacity-50 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(0,229,255,0.45), transparent 60%)",
          animation: "slow-drift 26s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute bottom-[-220px] left-1/3 h-[560px] w-[560px] rounded-full opacity-40 blur-[120px]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(181,245,0,0.3), transparent 60%)",
          animation: "slow-drift 30s ease-in-out infinite",
        }}
      />
      <div className="scanline-grid absolute inset-0 opacity-[0.3]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg" />
    </div>
  );
}
