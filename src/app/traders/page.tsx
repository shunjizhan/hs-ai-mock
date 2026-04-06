"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  Heart,
  ChevronDown,
  SlidersHorizontal,
  BarChart3,
  Filter,
} from "lucide-react";

import { mockTraders, type Trader } from "@/data/mock-traders";

/* ------------------------------------------------------------------ */
/*  Filter chips                                                       */
/* ------------------------------------------------------------------ */

const FILTER_CHIPS = [
  "Daily Picks",
  "Delta Neutral",
  "High Volume Pros",
  "High Composite Leverage",
  "HIP3 Wallets",
  "High Sharpe",
  "High Profit Factor",
] as const;

/* ------------------------------------------------------------------ */
/*  Sparkline SVG                                                      */
/* ------------------------------------------------------------------ */

const Sparkline = ({
  data,
  color = "#22C55E",
}: {
  data: number[];
  color?: string;
}) => {
  const w = 130;
  const h = 45;
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

  // gradient fill under the line
  const fillPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill={`url(#sg-${color})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
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
      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
      : score >= 70
        ? "text-amber-400 bg-amber-400/10 border-amber-400/20"
        : "text-muted bg-muted/10 border-muted/20";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border ${color}`}
    >
      <svg viewBox="0 0 12 12" className="w-3 h-3 fill-current">
        <path d="M6 0l1.76 3.57L12 4.14 8.88 7.02l.74 4.31L6 9.27 2.38 11.33l.74-4.31L0 4.14l4.24-.57z" />
      </svg>
      Score {display}
      <span className="text-muted/60 font-normal">/10</span>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/*  Full trader card (matching reference)                              */
/* ------------------------------------------------------------------ */

const TraderCardFull = ({
  trader,
  onCopy,
}: {
  trader: Trader;
  onCopy: (t: Trader) => void;
}) => {
  const roiColor = trader.profit >= 0 ? "text-success" : "text-danger";

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {trader.wallet}
            </span>
            <button
              aria-label="Copy address"
              className="text-muted/40 hover:text-muted transition-colors cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              aria-label="Favorite"
              className="text-muted/40 hover:text-danger transition-colors cursor-pointer"
            >
              <Heart className="w-3.5 h-3.5" />
            </button>
          </div>
          <ScoreBadge score={trader.hyperScore} />
        </div>
        <span className="text-xs text-muted">{trader.traderType}</span>
      </div>

      {/* ROI + Sparkline */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] text-muted uppercase tracking-wider mb-1">
              ROI
            </p>
            <p className={`text-2xl font-bold ${roiColor}`}>
              {trader.profit.toFixed(2)}%
            </p>
            <p className="text-xs text-muted mt-0.5">
              PnL ${trader.pnl.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="w-32 h-12 shrink-0">
            <Sparkline
              data={trader.sparkline}
              color={trader.profit >= 0 ? "#22C55E" : "#EF4444"}
            />
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-4 py-3 border-t border-border mt-2">
        <div>
          <p className="text-[10px] text-muted mb-0.5">Profit Factor</p>
          <p className="text-sm font-semibold text-foreground">
            {trader.profitFactor}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted mb-0.5">Max DD</p>
          <p className="text-sm font-semibold text-foreground">
            {trader.drawdown}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted mb-0.5">Sharpe Ratio</p>
          <p className="text-sm font-semibold text-foreground">
            {trader.sharpeRatio}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-3">
        <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
          <BarChart3 className="w-3.5 h-3.5" />
          Backtest
        </button>
        <button
          onClick={() => onCopy(trader)}
          className="flex-1 py-2 text-sm font-semibold text-white bg-primary rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
        >
          COPY TRADE
        </button>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0D0F16] border-t border-border">
        <span className="text-[11px] text-muted">Min Advised Capital</span>
        <span className="text-[11px] font-semibold text-foreground">
          ${trader.minCapital.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function TradersPage() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState("Daily Picks");

  const handleCopy = (trader: Trader) =>
    router.push(`/strategy?trader=${trader.id}`);

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
          <h1 className="font-semibold text-foreground">Copy Trade</h1>
        </div>

        {/* Controls bar */}
        <div className="px-6 pb-3 flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            uPnL %
            <ChevronDown className="w-3 h-3 text-muted" />
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer">
            90d
            <ChevronDown className="w-3 h-3 text-muted" />
          </button>
          <div className="flex-1" />
          <span className="text-[11px] text-muted hidden lg:inline">
            Updated every 8hs
          </span>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer">
            <Filter className="w-3.5 h-3.5" />
            Smart Filter
          </button>
        </div>

        {/* Filter chips */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip}
              onClick={() => setActiveChip(chip)}
              className={`px-4 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-all duration-150 cursor-pointer ${
                activeChip === chip
                  ? "bg-surface border-foreground/20 text-foreground"
                  : "border-border text-muted hover:text-foreground hover:border-border"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
      </header>

      {/* Card grid */}
      <main className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {mockTraders.map((trader) => (
            <TraderCardFull
              key={trader.id}
              trader={trader}
              onCopy={handleCopy}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
