// TrustBar — animated statistics strip below hero

"use client";
import { useEffect, useRef, useState } from "react";

const STATS = [
  { value: 600_000, suffix: "+", label: "Villages Covered",    icon: "🏡", color: "#A78BFA" },
  { value: 19_000,  suffix: "+", label: "PIN Codes Active",    icon: "📍", color: "#34D399" },
  { value: 12,      suffix: "",  label: "Service Verticals",   icon: "📦", color: "#FCD34D" },
  { value: 28,      suffix: "+", label: "States & UTs",        icon: "🗺️", color: "#F87171" },
  { value: 3,       suffix: "",  label: "AI Agents Running",   icon: "🤖", color: "#60A5FA" },
  { value: 100,     suffix: "%", label: "Made in India",       icon: "🇮🇳", color: "#FB923C" },
];

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<boolean>(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const steps  = 40;
    const step   = target / steps;
    const delay  = duration / steps;
    let current  = 0;
    const timer  = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, delay);
    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
}

function StatItem({ stat }: { stat: typeof STATS[0] }) {
  const count = useCountUp(stat.value);
  const display = count >= 1000
    ? count >= 100_000
      ? `${(count / 100_000).toFixed(1)}L`
      : count >= 1000
      ? `${(count / 1000).toFixed(0)}K`
      : count
    : count;

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-4">
      <span className="text-2xl mb-1">{stat.icon}</span>
      <div className="text-2xl font-black" style={{ color: stat.color }}>
        {display}{stat.suffix}
      </div>
      <div className="text-xs text-purple-300 font-medium text-center">{stat.label}</div>
    </div>
  );
}

export default function TrustBar() {
  return (
    <div style={{
      background: "linear-gradient(90deg, #1E0A3C 0%, #2D1B69 50%, #1E0A3C 100%)",
      borderBottom: "1px solid rgba(167,139,250,0.2)"
    }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-white/10">
          {STATS.map(s => <StatItem key={s.label} stat={s} />)}
        </div>
      </div>
    </div>
  );
}
