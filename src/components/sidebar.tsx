"use client";

import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Zap,
  Hexagon,
  Plus,
  TrendingUp,
  BarChart3,
  Newspaper,
  Wrench,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Mock strategies listed in sidebar                                  */
/* ------------------------------------------------------------------ */

const MOCK_STRATEGIES = [
  {
    id: "alpha-vault",
    name: "AlphaVault",
    icon: TrendingUp,
    tooltip: "Copy Trading",
    color: "text-primary",
  },
  {
    id: "deep-signal",
    name: "DeepSignal",
    icon: TrendingUp,
    tooltip: "Copy Trading",
    color: "text-primary",
  },
  {
    id: "rsi-breakout",
    name: "RSI Breakout",
    icon: BarChart3,
    tooltip: "Technical Trading",
    color: "text-accent",
  },
  {
    id: "fed-watch",
    name: "Fed Watch",
    icon: Newspaper,
    tooltip: "News Trading",
    color: "text-cyan-400",
  },
  {
    id: "custom-1",
    name: "BTC $100K Alert",
    icon: Wrench,
    tooltip: "Custom",
    color: "text-emerald-400",
  },
];

/* ------------------------------------------------------------------ */
/*  Inner sidebar (needs useSearchParams → requires Suspense)          */
/* ------------------------------------------------------------------ */

const SidebarInner = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTrader = searchParams.get("trader");

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#090B11] border-r border-border h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
          <Hexagon className="w-5 h-5 text-primary" />
        </div>
        <span className="font-semibold text-foreground text-sm">
          HyperSignals
        </span>
      </div>

      {/* New Strategy */}
      <div className="px-3 pb-3">
        <button
          onClick={() => (window.location.href = "/")}
          className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-foreground bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 text-primary" />
          New Strategy
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 overflow-y-auto">
        {/* Section label — not clickable */}
        <div className="flex items-center gap-2 px-3 py-2 mb-1">
          <Zap className="w-3.5 h-3.5 text-muted/50" />
          <span className="text-[11px] font-semibold text-muted/50 uppercase tracking-wider">
            Strategies in Action
          </span>
        </div>

        {/* Strategy items — main level */}
        <div className="space-y-0.5">
          {MOCK_STRATEGIES.map((strat) => {
            const isActive =
              pathname === "/strategy" && activeTrader === strat.id;

            return (
              <Link
                key={strat.id}
                href={`/strategy?trader=${strat.id}`}
                title={strat.tooltip}
                className={`group flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive
                    ? "bg-surface text-foreground font-medium"
                    : "text-muted hover:bg-surface/60 hover:text-foreground"
                }`}
              >
                <strat.icon
                  className={`w-4 h-4 shrink-0 ${strat.color}`}
                />
                <span className="truncate">{strat.name}</span>
                <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted whitespace-nowrap">
                  {strat.tooltip}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-border">
        <p className="text-[11px] text-muted/50">v0.1.0 &mdash; Mock</p>
      </div>
    </aside>
  );
};

/* ------------------------------------------------------------------ */
/*  Export with Suspense boundary                                      */
/* ------------------------------------------------------------------ */

export const Sidebar = () => (
  <Suspense
    fallback={
      <aside className="hidden md:flex flex-col w-60 shrink-0 bg-[#090B11] border-r border-border h-full" />
    }
  >
    <SidebarInner />
  </Suspense>
);
