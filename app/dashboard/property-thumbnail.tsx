const PALETTES = [
  { bg: "#eef4f0", building: "#3f6b52", window: "#c8dccd" },
  { bg: "#fdf1f4", building: "#b0335a", window: "#f4c9d5" },
  { bg: "#f0f2fb", building: "#3d4a8f", window: "#c7cdec" },
  { bg: "#fdf6ec", building: "#946b2d", window: "#f0dcb8" },
];

function paletteFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % PALETTES.length;
  return PALETTES[Math.abs(hash) % PALETTES.length];
}

export default function PropertyThumbnail({
  seed,
  compact = false,
}: {
  seed: string;
  compact?: boolean;
}) {
  const p = paletteFor(seed);
  return (
    <div
      className={`flex items-end justify-center rounded-xl ${compact ? "h-14 w-14 shrink-0 rounded-lg" : "h-28 w-full"}`}
      style={{ backgroundColor: p.bg }}
    >
      <svg viewBox="0 0 120 70" className={compact ? "h-10 w-10" : "h-20 w-28"}>
        <rect x="20" y="20" width="35" height="50" fill={p.building} />
        <rect x="60" y="8" width="40" height="62" fill={p.building} opacity={0.85} />
        {[0, 1, 2].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`a-${row}-${col}`}
              x={26 + col * 12}
              y={28 + row * 13}
              width="6"
              height="7"
              fill={p.window}
            />
          ))
        )}
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2].map((col) => (
            <rect
              key={`b-${row}-${col}`}
              x={65 + col * 11}
              y={14 + row * 13}
              width="6"
              height="7"
              fill={p.window}
            />
          ))
        )}
      </svg>
    </div>
  );
}
