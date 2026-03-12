import { useState } from "react";

interface PineconeTrackerProps {
  streak: number;
  onPineconeDrop?: () => void;
}

const PineconeTracker = ({ streak, onPineconeDrop }: PineconeTrackerProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine stage
  const isInactive = streak === 0;
  const stage = isInactive ? 0 : streak >= 7 ? 3 : streak >= 3 ? 2 : 1;

  const daysToReward = Math.max(0, 7 - streak);
  const weekDots = Array.from({ length: 7 }, (_, i) => i < streak);

  const stageText = [
    "松树想你了…",
    "松果正在入梦",
    "松树正在听你的心事",
    "松果丰收啦！",
  ];

  return (
    <div className="relative px-4 mb-3">
      <div
        onClick={() => setShowTooltip(!showTooltip)}
        className="relative flex items-center gap-4 px-4 py-3 rounded-2xl border border-border/50 cursor-pointer transition-colors hover:bg-secondary/30"
        style={{
          background: "linear-gradient(135deg, hsl(var(--pine-bg) / 0.6), hsl(var(--surface-warm) / 0.8))",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* SVG Stage Icon */}
        <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
          {stage === 0 && <InactivePinecone />}
          {stage === 1 && <SeedPinecone />}
          {stage === 2 && <SproutTree />}
          {stage === 3 && <FullTree />}

          {/* +5 pinecone reward float */}
          {stage === 3 && (
            <span className="absolute -top-3 -right-1 text-[10px] font-black text-[hsl(var(--pine-gold))] animate-bounce pinecone-sparkle">
              +5 🌰
            </span>
          )}
        </div>

        {/* Right side: text + dots */}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-bold mb-1.5 ${isInactive ? "text-muted-foreground" : "text-foreground"}`}>
            {stageText[stage]}
          </p>
          <div className="flex items-center gap-1.5">
            {weekDots.map((filled, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  filled
                    ? "bg-[hsl(var(--pine-green))] scale-110"
                    : "bg-border"
                }`}
              />
            ))}
            <span className="text-[9px] text-muted-foreground ml-1.5 font-medium">
              {streak}/7
            </span>
          </div>
        </div>

        {/* Streak badge */}
        {streak > 0 && (
          <div className="flex-shrink-0 text-center">
            <div className="text-lg font-black text-[hsl(var(--pine-brown))]">{streak}</div>
            <div className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">天</div>
          </div>
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 bg-foreground text-primary-foreground text-[11px] px-3 py-2 rounded-xl shadow-lg animate-in fade-in scale-in duration-200 whitespace-nowrap">
          {streak === 0
            ? "今天写一篇日记，松果就会苏醒哦~"
            : streak >= 7
            ? `已连续灌溉 ${streak} 天！松果大丰收 🎉`
            : `已连续灌溉 ${streak} 天，再坚持 ${daysToReward} 天即可收获松果`}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-foreground rotate-45 rounded-sm" />
        </div>
      )}
    </div>
  );
};

/* ---------- SVG Components ---------- */

const InactivePinecone = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10 opacity-40" style={{ transform: "rotate(12deg)" }}>
    {/* Ground */}
    <ellipse cx="24" cy="42" rx="16" ry="3" fill="hsl(var(--border))" />
    {/* Pinecone body */}
    <ellipse cx="24" cy="30" rx="8" ry="11" fill="hsl(var(--muted-foreground) / 0.3)" />
    {/* Scales */}
    <path d="M20 25 Q24 22 28 25" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth="1.5" fill="none" />
    <path d="M19 30 Q24 27 29 30" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth="1.5" fill="none" />
    <path d="M20 35 Q24 32 28 35" stroke="hsl(var(--muted-foreground) / 0.2)" strokeWidth="1.5" fill="none" />
  </svg>
);

const SeedPinecone = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10">
    {/* Ground */}
    <ellipse cx="24" cy="42" rx="14" ry="3" fill="hsl(var(--pine-brown) / 0.2)" />
    {/* Buried pinecone */}
    <ellipse cx="24" cy="34" rx="7" ry="9" fill="hsl(var(--pine-brown) / 0.7)" />
    {/* Scales pattern */}
    <path d="M20 29 Q24 26 28 29" stroke="hsl(var(--pine-brown) / 0.4)" strokeWidth="1.5" fill="none" />
    <path d="M19 33 Q24 30 29 33" stroke="hsl(var(--pine-brown) / 0.4)" strokeWidth="1.5" fill="none" />
    <path d="M20 37 Q24 34 28 37" stroke="hsl(var(--pine-brown) / 0.4)" strokeWidth="1.5" fill="none" />
    {/* Tiny sprout */}
    <path d="M24 25 Q22 20 24 17 Q26 20 24 25" fill="hsl(var(--pine-green) / 0.6)" />
    {/* Ground cover */}
    <ellipse cx="24" cy="40" rx="12" ry="2.5" fill="hsl(var(--pine-brown) / 0.15)" />
  </svg>
);

const SproutTree = () => (
  <svg viewBox="0 0 48 48" className="w-10 h-10">
    {/* Ground */}
    <ellipse cx="24" cy="44" rx="14" ry="2.5" fill="hsl(var(--pine-brown) / 0.15)" />
    {/* Trunk */}
    <rect x="22" y="30" width="4" height="14" rx="2" fill="hsl(var(--pine-brown) / 0.6)" />
    {/* Foliage layers */}
    <path d="M24 8 L14 28 L34 28 Z" fill="hsl(var(--pine-green) / 0.7)" />
    <path d="M24 14 L16 30 L32 30 Z" fill="hsl(var(--pine-green) / 0.85)" />
    {/* Tiny highlights */}
    <circle cx="20" cy="22" r="1" fill="hsl(var(--pine-green) / 0.4)" />
    <circle cx="28" cy="24" r="0.8" fill="hsl(var(--pine-green) / 0.4)" />
  </svg>
);

const FullTree = () => (
  <svg viewBox="0 0 48 48" className="w-11 h-11">
    {/* Ground */}
    <ellipse cx="24" cy="45" rx="16" ry="2.5" fill="hsl(var(--pine-brown) / 0.15)" />
    {/* Trunk */}
    <rect x="21" y="32" width="6" height="13" rx="3" fill="hsl(var(--pine-brown) / 0.7)" />
    {/* Foliage tiers */}
    <path d="M24 4 L12 22 L36 22 Z" fill="hsl(var(--pine-green) / 0.65)" />
    <path d="M24 10 L13 26 L35 26 Z" fill="hsl(var(--pine-green) / 0.8)" />
    <path d="M24 16 L14 32 L34 32 Z" fill="hsl(var(--pine-green) / 0.95)" />
    {/* Gold pinecones */}
    <circle cx="18" cy="24" r="2.5" fill="hsl(var(--pine-gold))" />
    <circle cx="30" cy="22" r="2.5" fill="hsl(var(--pine-gold))" />
    <circle cx="24" cy="28" r="2.5" fill="hsl(var(--pine-gold))" />
    {/* Pinecone shine */}
    <circle cx="17.5" cy="23.2" r="0.8" fill="hsl(var(--pine-gold) / 0.4)" />
    <circle cx="29.5" cy="21.2" r="0.8" fill="hsl(var(--pine-gold) / 0.4)" />
    <circle cx="23.5" cy="27.2" r="0.8" fill="hsl(var(--pine-gold) / 0.4)" />
  </svg>
);

export default PineconeTracker;
