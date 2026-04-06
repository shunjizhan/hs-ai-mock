"use client";

import type { TechnicalStrategy } from "@/data/mock-technical-strategies";

interface TechnicalCardProps {
  strategy: TechnicalStrategy;
  onSelect?: (strategy: TechnicalStrategy) => void;
}

export const TechnicalCard = ({ strategy, onSelect }: TechnicalCardProps) => {
  const scoreDisplay = (strategy.hyperScore / 10).toFixed(1);
  const scoreColor =
    strategy.hyperScore >= 85
      ? "text-violet-400"
      : strategy.hyperScore >= 70
        ? "text-violet-300"
        : "text-muted";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(strategy)}
      className="group w-full text-left bg-surface border border-border rounded-xl p-4 transition-all duration-200 hover:border-accent/40 hover:bg-surface-hover cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-foreground truncate block">
            {strategy.name}
          </span>
          <span className="text-[10px] text-accent font-medium">
            {strategy.indicator}
          </span>
          <span className="text-[10px] text-muted ml-1.5">
            {strategy.timeframe}
          </span>
        </div>
        <span className={`text-xs font-bold ${scoreColor} shrink-0`}>
          {scoreDisplay}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-[10px] text-muted uppercase tracking-wide mb-0.5">
          ROI
        </p>
        <p className="text-lg font-bold text-success">
          {strategy.roi.toFixed(2)}%
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted mb-0.5">Win Rate</p>
          <p className="text-xs font-semibold text-foreground truncate">
            {strategy.winRate}%
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted mb-0.5">Max DD</p>
          <p className="text-xs font-semibold text-foreground truncate">
            {strategy.drawdown}%
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted mb-0.5">Sharpe</p>
          <p className="text-xs font-semibold text-foreground truncate">
            {strategy.sharpeRatio}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-muted truncate">
          {strategy.pairs.join(", ")}
        </span>
        <span className="text-[11px] font-semibold text-accent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          ACTIVATE &rarr;
        </span>
      </div>
    </button>
  );
};
