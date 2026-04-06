"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  BarChart3,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";

import {
  mockTechnicalStrategies,
  type TechnicalStrategy,
} from "@/data/mock-technical-strategies";

/* ------------------------------------------------------------------ */
/*  Filter chips                                                       */
/* ------------------------------------------------------------------ */

const FILTER_CHIPS = [
  "All",
  "RSI",
  "MACD",
  "Grid",
  "EMA",
  "VWAP",
  "Supertrend",
  "Ichimoku",
] as const;

/* ------------------------------------------------------------------ */
/*  Sparkline SVG                                                      */
/* ------------------------------------------------------------------ */

const Sparkline = ({ data }: { data: number[] }) => {
  const w = 110;
  const h = 40;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const fill = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id="tech-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fill} fill="url(#tech-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#8B5CF6"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Score badge                                                        */
/* ------------------------------------------------------------------ */

const ScoreBadge = ({ score }: { score: number }) => {
  const display = (score / 10).toFixed(1);
  const color =
    score >= 85
      ? "text-violet-400 bg-violet-400/10 border-violet-400/20"
      : score >= 70
        ? "text-violet-300 bg-violet-300/10 border-violet-300/20"
        : "text-muted bg-muted/10 border-muted/20";

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${color}`}>
      <BarChart3 className="w-3 h-3" />
      Score {display}
      <span className="text-muted/60 font-normal">/10</span>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Strategy card                                                      */
/* ------------------------------------------------------------------ */

const StrategyCard = ({
  strategy,
  onSelect,
}: {
  strategy: TechnicalStrategy;
  onSelect: (s: TechnicalStrategy) => void;
}) => (
  <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-accent/30 transition-colors">
    {/* Header */}
    <div className="p-4 pb-0">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{strategy.name}</h3>
          <span className="text-[11px] text-accent font-medium">{strategy.indicator}</span>
          <span className="text-[11px] text-muted ml-2">{strategy.timeframe}</span>
        </div>
        <ScoreBadge score={strategy.hyperScore} />
      </div>
      <p className="text-xs text-muted mt-1 leading-relaxed">{strategy.description}</p>
    </div>

    {/* ROI + Sparkline */}
    <div className="px-4 pt-3 pb-2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] text-muted uppercase tracking-wider mb-1">ROI</p>
          <p className="text-2xl font-bold text-success">{strategy.roi.toFixed(2)}%</p>
          <p className="text-xs text-muted mt-0.5">
            PnL ${strategy.pnl.toLocaleString()}
          </p>
        </div>
        <div className="w-28 h-10 shrink-0">
          <Sparkline data={strategy.sparkline} />
        </div>
      </div>
    </div>

    {/* Stats */}
    <div className="grid grid-cols-3 gap-3 px-4 py-3 border-t border-border mt-2">
      <div>
        <p className="text-[10px] text-muted mb-0.5">Win Rate</p>
        <p className="text-sm font-semibold text-foreground">{strategy.winRate}%</p>
      </div>
      <div>
        <p className="text-[10px] text-muted mb-0.5">Max DD</p>
        <p className="text-sm font-semibold text-foreground">{strategy.drawdown}%</p>
      </div>
      <div>
        <p className="text-[10px] text-muted mb-0.5">Sharpe</p>
        <p className="text-sm font-semibold text-foreground">{strategy.sharpeRatio}</p>
      </div>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2 px-4 py-3">
      <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
        <BarChart3 className="w-3.5 h-3.5" />
        Backtest
      </button>
      <button
        onClick={() => onSelect(strategy)}
        className="flex-1 py-2 text-sm font-semibold text-white bg-accent rounded-lg hover:bg-accent-hover transition-colors cursor-pointer"
      >
        ACTIVATE
      </button>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D0F16] border-t border-border">
      <span className="text-[11px] text-muted">Pairs</span>
      <span className="text-[11px] font-medium text-foreground">
        {strategy.pairs.join(", ")}
      </span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TechnicalStrategiesPage() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = mockTechnicalStrategies.filter((s) => {
    if (search) return s.name.toLowerCase().includes(search.toLowerCase());
    if (activeChip === "All") return true;
    return s.indicator === activeChip;
  });

  const handleSelect = (strategy: TechnicalStrategy) =>
    router.push(`/strategy?trader=${strategy.id}`);

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            aria-label="Go back"
            className="p-1.5 hover:bg-surface rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-muted" />
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-accent" />
            <h1 className="font-semibold text-foreground">Technical Strategies</h1>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 pb-3 flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={"Search strategies\u2026"}
              className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Sort by ROI
            <ChevronDown className="w-3 h-3 text-muted" />
          </button>
        </div>

        {/* Filter chips */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => {
                setActiveChip(chip);
                setSearch("");
              }}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all duration-150 cursor-pointer ${
                activeChip === chip && !search
                  ? "bg-accent/10 border-accent/30 text-accent"
                  : "border-border text-muted hover:text-foreground hover:border-border"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </header>

      {/* Grid */}
      <main className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {filtered.map((s) => (
            <StrategyCard key={s.id} strategy={s} onSelect={handleSelect} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted">No strategies match your search.</p>
            <button
              onClick={() => { setSearch(""); setActiveChip("All"); }}
              className="mt-2 text-sm text-accent hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
