"use client";

import { useRouter } from "next/navigation";
import { Hexagon, Zap, TrendingUp, Pause, ArrowRight } from "lucide-react";

const MOCK_STRATEGIES = [
  {
    id: "1",
    name: "Copy: NeuralFlow",
    status: "active" as const,
    profit: 12.4,
    duration: "3d 14h",
    trades: 18,
    color: "#8B5CF6",
  },
  {
    id: "2",
    name: "Copy: AlphaVault",
    status: "active" as const,
    profit: 8.7,
    duration: "1d 6h",
    trades: 7,
    color: "#F59E0B",
  },
  {
    id: "3",
    name: "Copy: SteadyHand",
    status: "paused" as const,
    profit: -2.1,
    duration: "5d 2h",
    trades: 32,
    color: "#06B6D4",
  },
];

export default function StrategiesPage() {
  const router = useRouter();

  return (
    <div className="min-h-full bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Zap className="w-5 h-5 text-primary" />
          <div>
            <h1 className="font-semibold text-foreground">
              Strategies in Action
            </h1>
            <p className="text-xs text-muted">
              Monitor your active and paused strategies
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Active", value: "2", color: "text-emerald-400" },
            { label: "Paused", value: "1", color: "text-amber-400" },
            { label: "Total P&L", value: "+19.0%", color: "text-emerald-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-surface border border-border rounded-xl p-4 text-center"
            >
              <p className="text-xs text-muted mb-1">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Strategy list */}
        <div className="space-y-3">
          {MOCK_STRATEGIES.map((strat) => (
            <button
              key={strat.id}
              onClick={() => router.push("/strategy")}
              className="w-full flex items-center gap-4 bg-surface border border-border rounded-xl p-4 text-left hover:border-primary/40 hover:bg-surface-hover transition-all duration-200 cursor-pointer group"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: strat.color + "20" }}
              >
                {strat.status === "active" ? (
                  <TrendingUp
                    className="w-5 h-5"
                    style={{ color: strat.color }}
                  />
                ) : (
                  <Pause
                    className="w-5 h-5"
                    style={{ color: strat.color }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-medium text-foreground truncate">
                    {strat.name}
                  </h3>
                  <span
                    className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                      strat.status === "active"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-amber-400/10 text-amber-400"
                    }`}
                  >
                    {strat.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>Running {strat.duration}</span>
                  <span className="text-border">&middot;</span>
                  <span>{strat.trades} trades</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p
                  className={`text-sm font-bold ${strat.profit >= 0 ? "text-emerald-400" : "text-danger"}`}
                >
                  {strat.profit >= 0 ? "+" : ""}
                  {strat.profit}%
                </p>
              </div>

              <ArrowRight className="w-4 h-4 text-muted/30 group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>

        {/* Empty state hint */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
          >
            <Hexagon className="w-4 h-4" />
            Create New Strategy
          </button>
        </div>
      </main>
    </div>
  );
}
