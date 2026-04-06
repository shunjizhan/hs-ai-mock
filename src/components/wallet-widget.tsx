"use client";

import { useState, useRef, useEffect } from "react";
import { Wallet, ChevronDown, TrendingUp, BarChart3, Newspaper, Wrench, X } from "lucide-react";

const MOCK_PORTFOLIO = {
  totalUsd: 284_920.45,
  available: 42_310.12,
  deployed: 242_610.33,
  strategies: [
    { name: "AlphaVault", type: "Copy Trading", icon: TrendingUp, color: "text-primary", allocated: 85_400.0, pnl: 12_840.5 },
    { name: "DeepSignal", type: "Copy Trading", icon: TrendingUp, color: "text-primary", allocated: 62_200.0, pnl: 8_720.3 },
    { name: "RSI Breakout", type: "Technical", icon: BarChart3, color: "text-accent", allocated: 45_000.0, pnl: 6_210.0 },
    { name: "Fed Watch", type: "News", icon: Newspaper, color: "text-cyan-400", allocated: 35_010.33, pnl: -1_420.8 },
    { name: "BTC $100K Alert", type: "Custom", icon: Wrench, color: "text-emerald-400", allocated: 15_000.0, pnl: 0 },
  ],
};

export const WalletWidget = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative z-50">
      {/* Trigger */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-colors cursor-pointer"
      >
        <Wallet className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          ${MOCK_PORTFOLIO.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-surface border border-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden animate-message-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Portfolio</h3>
            <button
              onClick={() => setOpen(false)}
              className="p-1 text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Summary */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-[10px] text-muted uppercase tracking-wider mb-1">Total Assets</p>
            <p className="text-2xl font-bold text-foreground">
              ${MOCK_PORTFOLIO.totalUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-muted mb-0.5">Available</p>
                <p className="text-sm font-semibold text-foreground">
                  ${MOCK_PORTFOLIO.available.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted mb-0.5">Deployed</p>
                <p className="text-sm font-semibold text-foreground">
                  ${MOCK_PORTFOLIO.deployed.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-0 border-b border-border">
            <div className="px-4 py-2.5 text-center border-r border-border">
              <p className="text-lg font-bold text-foreground">{MOCK_PORTFOLIO.strategies.length}</p>
              <p className="text-[10px] text-muted">Strategies</p>
            </div>
            <div className="px-4 py-2.5 text-center border-r border-border">
              <p className="text-lg font-bold text-foreground">4</p>
              <p className="text-[10px] text-muted">Active</p>
            </div>
            <div className="px-4 py-2.5 text-center">
              <p className="text-base font-bold text-success">+$26,350</p>
              <p className="text-[10px] text-muted">Total PnL</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="px-4 py-3">
            <p className="text-[10px] text-muted uppercase tracking-wider mb-2">Breakdown</p>

            {/* Column headers */}
            <div className="grid grid-cols-[auto_1fr_5rem_5.5rem] gap-x-2.5 items-center mb-1.5 text-[10px] text-muted">
              <span />
              <span>Strategy</span>
              <span className="text-right">Allocated</span>
              <span className="text-right">PnL</span>
            </div>

            <div className="space-y-1.5">
              {MOCK_PORTFOLIO.strategies.map((s) => (
                <div key={s.name} className="grid grid-cols-[auto_1fr_5rem_5.5rem] gap-x-2.5 items-center">
                  <s.icon className={`w-3.5 h-3.5 shrink-0 ${s.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-[10px] text-muted">{s.type}</p>
                  </div>
                  <span className="text-xs font-medium text-foreground text-right whitespace-nowrap">
                    ${s.allocated.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                  <span className={`text-xs font-medium text-right whitespace-nowrap ${s.pnl >= 0 ? "text-success" : "text-danger"}`}>
                    {s.pnl >= 0 ? "+" : ""}{s.pnl === 0 ? "$0.00" : `$${Math.abs(s.pnl).toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
