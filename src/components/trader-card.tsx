"use client";

import type { Trader } from "@/data/mock-traders";

interface TraderCardProps {
  trader: Trader;
  onSelect?: (trader: Trader) => void;
}

export const TraderCard = ({ trader, onSelect }: TraderCardProps) => {
  const scoreDisplay = (trader.hyperScore / 10).toFixed(1);
  const scoreColor =
    trader.hyperScore >= 85
      ? "text-emerald-400"
      : trader.hyperScore >= 70
        ? "text-amber-400"
        : "text-muted";

  return (
    <button
      type="button"
      onClick={() => onSelect?.(trader)}
      className="group w-full text-left bg-surface border border-border rounded-xl p-4 transition-all duration-200 hover:border-primary/40 hover:bg-surface-hover cursor-pointer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {trader.wallet}
          </span>
          <span className="text-[10px] text-muted px-1.5 py-0.5 bg-surface-hover rounded">
            {trader.traderType}
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
          {trader.profit.toFixed(2)}%
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="min-w-0">
          <p className="text-[10px] text-muted mb-0.5">Profit Factor</p>
          <p className="text-xs font-semibold text-foreground truncate">
            {trader.profitFactor}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted mb-0.5">Max DD</p>
          <p className="text-xs font-semibold text-foreground truncate">
            {trader.drawdown}%
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted mb-0.5">Sharpe</p>
          <p className="text-xs font-semibold text-foreground truncate">
            {trader.sharpeRatio}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between">
        <span className="text-[10px] text-muted">
          Min ${trader.minCapital.toLocaleString()}
        </span>
        <span className="text-[11px] font-semibold text-primary md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200">
          COPY &rarr;
        </span>
      </div>
    </button>
  );
};
