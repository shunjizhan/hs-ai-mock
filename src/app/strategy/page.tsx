"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Hexagon,
  Copy,
  ExternalLink,
  TrendingUp,
  BarChart3,
  Newspaper,
  Shuffle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
} from "lucide-react";

import { mockTraders, type Trader } from "@/data/mock-traders";
import { mockTechnicalStrategies } from "@/data/mock-technical-strategies";

/* ------------------------------------------------------------------ */
/*  Strategy type labels                                               */
/* ------------------------------------------------------------------ */

const STRATEGY_LABELS = [
  {
    key: "copy",
    label: "Copy Trading",
    icon: TrendingUp,
    color: "text-primary bg-primary/10 border-primary/20",
  },
  {
    key: "technical",
    label: "Technical Trading",
    icon: BarChart3,
    color: "text-accent bg-accent/10 border-accent/20",
  },
  {
    key: "news",
    label: "News Trading",
    icon: Newspaper,
    color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  },
  {
    key: "hybrid",
    label: "Hybrid",
    icon: Shuffle,
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Mock trade history                                                 */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Mock current positions                                             */
/* ------------------------------------------------------------------ */

const MOCK_POSITIONS = [
  { id: 1, pair: "SOL-PERP", side: "Long" as const, size: 12.5, entry: 178.45, mark: 180.64, liqPrice: 142.10, margin: 445.0, leverage: 5, unrealizedPnl: 27.38, pnlPct: 1.23, openedAt: "12m ago" },
  { id: 2, pair: "ETH-PERP", side: "Long" as const, size: 0.85, entry: 3842.5, mark: 3891.2, liqPrice: 3074.0, margin: 654.0, leverage: 5, unrealizedPnl: 41.4, pnlPct: 1.27, openedAt: "48m ago" },
  { id: 3, pair: "BTC-PERP", side: "Short" as const, size: 0.02, entry: 97350.0, mark: 97180.0, liqPrice: 121687.5, margin: 389.4, leverage: 5, unrealizedPnl: 3.4, pnlPct: 0.17, openedAt: "2h ago" },
  { id: 4, pair: "WIF-PERP", side: "Long" as const, size: 850, entry: 1.042, mark: 1.038, liqPrice: 0.834, margin: 177.1, leverage: 5, unrealizedPnl: -3.4, pnlPct: -0.38, openedAt: "25m ago" },
];

/* ------------------------------------------------------------------ */
/*  Mock trade history                                                 */
/* ------------------------------------------------------------------ */

const MOCK_TRADES = [
  { id: 1, pair: "ETH-PERP", side: "Long", entry: 3842.5, exit: 3961.2, pnl: 287.4, pnlPct: 3.09, time: "2h ago" },
  { id: 2, pair: "BTC-PERP", side: "Short", entry: 97120.0, exit: 96450.0, pnl: 134.0, pnlPct: 0.69, time: "5h ago" },
  { id: 3, pair: "ARB-PERP", side: "Long", entry: 1.124, exit: 1.089, pnl: -70.0, pnlPct: -3.11, time: "8h ago" },
  { id: 4, pair: "ETH-PERP", side: "Long", entry: 3780.0, exit: 3842.5, pnl: 156.25, pnlPct: 1.65, time: "1d ago" },
  { id: 5, pair: "DOGE-PERP", side: "Short", entry: 0.1845, exit: 0.1792, pnl: 106.0, pnlPct: 2.87, time: "1d ago" },
  { id: 6, pair: "BTC-PERP", side: "Long", entry: 96800.0, exit: 97120.0, pnl: 64.0, pnlPct: 0.33, time: "2d ago" },
  { id: 7, pair: "AVAX-PERP", side: "Short", entry: 38.92, exit: 39.45, pnl: -53.0, pnlPct: -1.36, time: "2d ago" },
  { id: 8, pair: "SOL-PERP", side: "Long", entry: 165.20, exit: 172.85, pnl: 191.25, pnlPct: 4.63, time: "3d ago" },
  { id: 9, pair: "LINK-PERP", side: "Short", entry: 18.42, exit: 17.95, pnl: 47.0, pnlPct: 2.55, time: "3d ago" },
  { id: 10, pair: "BTC-PERP", side: "Long", entry: 95400.0, exit: 96800.0, pnl: 280.0, pnlPct: 1.47, time: "4d ago" },
];

/* ------------------------------------------------------------------ */
/*  Mock notification history                                          */
/* ------------------------------------------------------------------ */

const MOCK_NOTIFICATIONS = [
  { id: 1, channel: "Email" as const, status: "delivered" as const, price: 99842.5, message: "BTC approaching $100K \u2014 currently at $99,842.50", time: "Apr 5, 2026 14:32 UTC" },
  { id: 2, channel: "Telegram" as const, status: "delivered" as const, price: 99842.5, message: "BTC approaching $100K \u2014 currently at $99,842.50", time: "Apr 5, 2026 14:32 UTC" },
  { id: 3, channel: "Email" as const, status: "delivered" as const, price: 99210.0, message: "BTC within 1% of $100K \u2014 currently at $99,210.00", time: "Apr 4, 2026 09:15 UTC" },
  { id: 4, channel: "Telegram" as const, status: "delivered" as const, price: 99210.0, message: "BTC within 1% of $100K \u2014 currently at $99,210.00", time: "Apr 4, 2026 09:15 UTC" },
  { id: 5, channel: "Email" as const, status: "delivered" as const, price: 97500.0, message: "BTC within 2.5% of $100K \u2014 currently at $97,500.00", time: "Apr 2, 2026 18:47 UTC" },
  { id: 6, channel: "Telegram" as const, status: "failed" as const, price: 97500.0, message: "BTC within 2.5% of $100K \u2014 currently at $97,500.00", time: "Apr 2, 2026 18:47 UTC" },
  { id: 7, channel: "Email" as const, status: "delivered" as const, price: 95012.3, message: "BTC within 5% of $100K \u2014 currently at $95,012.30", time: "Mar 28, 2026 11:03 UTC" },
  { id: 8, channel: "Telegram" as const, status: "delivered" as const, price: 95012.3, message: "BTC within 5% of $100K \u2014 currently at $95,012.30", time: "Mar 28, 2026 11:03 UTC" },
];

/* ------------------------------------------------------------------ */
/*  Equity curve (mock SVG)                                            */
/* ------------------------------------------------------------------ */

const EquityCurve = ({ data }: { data: number[] }) => {
  const w = 600;
  const h = 160;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ");

  const fillPoints = `0,${h} ${points} ${w},${h}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPoints} fill="url(#eq-fill)" />
      <polyline
        points={points}
        fill="none"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};

/* ------------------------------------------------------------------ */
/*  Positions & Trade History tabbed section                           */
/* ------------------------------------------------------------------ */

const TABS = ["Current Positions", "Trade History"] as const;

const PositionsAndHistory = () => {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Current Positions");

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      {/* Tab header */}
      <div className="flex items-center gap-0 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3.5 text-sm font-medium transition-colors cursor-pointer relative ${
              tab === t
                ? "text-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t}
            {t === "Current Positions" && (
              <span className="ml-1.5 text-[10px] font-semibold text-primary">
                {MOCK_POSITIONS.length}
              </span>
            )}
            {tab === t && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {tab === "Current Positions" ? (
        <>
          {/* Positions header */}
          <div className="grid grid-cols-[1.2fr_0.6fr_0.7fr_0.8fr_0.8fr_0.6fr_0.7fr_0.8fr_0.5fr] gap-2 px-5 py-2.5 text-[10px] text-muted uppercase tracking-wider border-b border-border">
            <span>Pair</span>
            <span>Side</span>
            <span>Size</span>
            <span>Entry</span>
            <span>Mark</span>
            <span>Lev.</span>
            <span>uPnL</span>
            <span>Return</span>
            <span className="text-right">Opened</span>
          </div>

          {/* Position rows */}
          {MOCK_POSITIONS.map((pos) => (
            <div
              key={pos.id}
              className="grid grid-cols-[1.2fr_0.6fr_0.7fr_0.8fr_0.8fr_0.6fr_0.7fr_0.8fr_0.5fr] gap-2 px-5 py-3 text-sm border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{pos.pair}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              </div>
              <span className={pos.side === "Long" ? "text-success" : "text-danger"}>
                {pos.side}
              </span>
              <span className="text-foreground font-mono text-xs">
                {pos.size}
              </span>
              <span className="text-foreground font-mono text-xs">
                ${pos.entry.toLocaleString()}
              </span>
              <span className="text-foreground font-mono text-xs">
                ${pos.mark.toLocaleString()}
              </span>
              <span className="text-foreground text-xs">
                {pos.leverage}x
              </span>
              <span className={`font-medium ${pos.unrealizedPnl >= 0 ? "text-success" : "text-danger"}`}>
                <span className="inline-flex items-center gap-0.5">
                  {pos.unrealizedPnl >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  ${Math.abs(pos.unrealizedPnl).toFixed(2)}
                </span>
              </span>
              <span className={`font-medium ${pos.pnlPct >= 0 ? "text-success" : "text-danger"}`}>
                {pos.pnlPct >= 0 ? "+" : ""}{pos.pnlPct.toFixed(2)}%
              </span>
              <span className="text-muted text-xs text-right flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {pos.openedAt}
              </span>
            </div>
          ))}
        </>
      ) : (
        <>
          {/* History header */}
          <div className="grid grid-cols-[1fr_0.6fr_0.8fr_0.8fr_0.8fr_0.6fr_0.5fr] gap-2 px-5 py-2.5 text-[10px] text-muted uppercase tracking-wider border-b border-border">
            <span>Pair</span>
            <span>Side</span>
            <span>Entry</span>
            <span>Exit</span>
            <span>PnL</span>
            <span>Return</span>
            <span className="text-right">Time</span>
          </div>

          {/* History rows */}
          {MOCK_TRADES.map((trade) => (
            <div
              key={trade.id}
              className="grid grid-cols-[1fr_0.6fr_0.8fr_0.8fr_0.8fr_0.6fr_0.5fr] gap-2 px-5 py-3 text-sm border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
            >
              <span className="font-medium text-foreground">{trade.pair}</span>
              <span className={trade.side === "Long" ? "text-success" : "text-danger"}>
                {trade.side}
              </span>
              <span className="text-foreground font-mono text-xs">
                ${trade.entry.toLocaleString()}
              </span>
              <span className="text-foreground font-mono text-xs">
                ${trade.exit.toLocaleString()}
              </span>
              <span className={`font-medium ${trade.pnl >= 0 ? "text-success" : "text-danger"}`}>
                <span className="inline-flex items-center gap-0.5">
                  {trade.pnl >= 0 ? (
                    <ArrowUpRight className="w-3 h-3" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3" />
                  )}
                  ${Math.abs(trade.pnl).toFixed(2)}
                </span>
              </span>
              <span className={`font-medium ${trade.pnlPct >= 0 ? "text-success" : "text-danger"}`}>
                {trade.pnlPct >= 0 ? "+" : ""}{trade.pnlPct.toFixed(2)}%
              </span>
              <span className="text-muted text-xs text-right flex items-center justify-end gap-1">
                <Clock className="w-3 h-3" />
                {trade.time}
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Notification History                                               */
/* ------------------------------------------------------------------ */

const NotificationHistory = () => (
  <div className="bg-surface border border-border rounded-xl overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground">
        Notification History
      </h3>
      <span className="text-[11px] text-muted">
        {MOCK_NOTIFICATIONS.length} notifications
      </span>
    </div>

    {/* Table header */}
    <div className="grid grid-cols-[0.5fr_0.5fr_2fr_1fr] gap-3 px-5 py-2.5 text-[10px] text-muted uppercase tracking-wider border-b border-border">
      <span>Channel</span>
      <span>Status</span>
      <span>Message</span>
      <span className="text-right">Sent</span>
    </div>

    {/* Rows */}
    {MOCK_NOTIFICATIONS.map((n) => (
      <div
        key={n.id}
        className="grid grid-cols-[0.5fr_0.5fr_2fr_1fr] gap-3 px-5 py-3 text-sm border-b border-border last:border-0 hover:bg-surface-hover transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {n.channel === "Email" ? (
            <Mail className="w-3.5 h-3.5 text-primary" />
          ) : (
            <Send className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="text-xs text-foreground">{n.channel}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {n.status === "delivered" ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-danger" />
          )}
          <span
            className={`text-xs capitalize ${n.status === "delivered" ? "text-success" : "text-danger"}`}
          >
            {n.status}
          </span>
        </div>
        <span className="text-xs text-muted truncate">{n.message}</span>
        <span className="text-xs text-muted text-right flex items-center justify-end gap-1">
          <Clock className="w-3 h-3" />
          {n.time}
        </span>
      </div>
    ))}
  </div>
);

// Extend sparkline with deterministic points
/* ------------------------------------------------------------------ */
/*  Stats per strategy type                                            */
/* ------------------------------------------------------------------ */

const MOCK_TECHNICAL_STATS = [
  { label: "ROI", value: "148.32%", color: "text-success" },
  { label: "PnL", value: "$37,080", color: "text-success" },
  { label: "Max DD", value: "14.6%", color: "text-danger" },
  { label: "Win Rate", value: "64%", color: "text-foreground" },
  { label: "Profit Factor", value: "3.21", color: "text-foreground" },
  { label: "Sharpe Ratio", value: "4.85", color: "text-foreground" },
];

const MOCK_NEWS_STATS = [
  { label: "ROI", value: "89.14%", color: "text-success" },
  { label: "PnL", value: "$22,285", color: "text-success" },
  { label: "Max DD", value: "18.3%", color: "text-danger" },
  { label: "Win Rate", value: "71%", color: "text-foreground" },
  { label: "Profit Factor", value: "5.67", color: "text-foreground" },
  { label: "Sharpe Ratio", value: "3.42", color: "text-foreground" },
];

const getStatsForType = (
  type: string | null,
  trader: Trader | undefined,
) => {
  if (type === "technical") return MOCK_TECHNICAL_STATS;
  if (type === "news") return MOCK_NEWS_STATS;
  if (trader) {
    return [
      { label: "ROI", value: `${trader.profit.toFixed(2)}%`, color: "text-success" },
      { label: "PnL", value: `$${trader.pnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "text-success" },
      { label: "Max DD", value: `${trader.drawdown}%`, color: "text-danger" },
      { label: "Win Rate", value: `${trader.winRate}%`, color: "text-foreground" },
      { label: "Profit Factor", value: `${trader.profitFactor}`, color: "text-foreground" },
      { label: "Sharpe Ratio", value: `${trader.sharpeRatio}`, color: "text-foreground" },
    ];
  }
  return [
    { label: "ROI", value: "--", color: "text-success" },
    { label: "PnL", value: "--", color: "text-success" },
    { label: "Max DD", value: "--", color: "text-danger" },
    { label: "Win Rate", value: "--", color: "text-foreground" },
    { label: "Profit Factor", value: "--", color: "text-foreground" },
    { label: "Sharpe Ratio", value: "--", color: "text-foreground" },
  ];
};

const extendEquity = (spark: number[]): number[] => {
  const out: number[] = [...spark];
  let v = out[out.length - 1];
  for (let i = 0; i < 36; i++) {
    const r = Math.sin((i + 1) * 2.3 + v * 0.1) * 0.5 + 0.5;
    v = Math.max(40, v + (r - 0.35) * 3);
    out.push(Math.round(v * 10) / 10);
  }
  return out;
};

/* ------------------------------------------------------------------ */
/*  Strategy content                                                   */
/* ------------------------------------------------------------------ */

const StrategyContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const traderId = searchParams.get("trader");
  const trader = mockTraders.find((t) => t.id === traderId);

  // Map trader ID → strategy type, name, and description
  const STRATEGY_META: Record<string, { type: string; name: string; desc: string }> = {
    "alpha-vault": { type: "copy", name: "AlphaVault", desc: "" },
    "deep-signal": { type: "copy", name: "DeepSignal", desc: "" },
    "rsi-breakout": { type: "technical", name: "RSI Breakout", desc: "Enters long when RSI crosses above 30 from oversold territory with 10/50 MA golden cross confirmation. Shorts on RSI > 70 with death cross. Positions auto-close at opposite signal or trailing stop." },
    "fed-watch": { type: "news", name: "Fed Watch", desc: "" },
    "custom-1": { type: "hybrid", name: "BTC $100K Alert", desc: "" },
    // Auto-add all technical strategies from mock data
    ...Object.fromEntries(
      mockTechnicalStrategies.map((s) => [s.id, { type: "technical", name: s.name, desc: s.description }])
    ),
  };
  const meta = traderId ? STRATEGY_META[traderId] : null;
  // Default to "copy" for any trader coming from the copy-trade page
  const activeLabel = traderId ? (meta?.type ?? "copy") : null;
  const strategyName = trader?.name ?? meta?.name ?? traderId;
  const strategyDesc = meta?.desc || null;
  const equityData = trader ? extendEquity(trader.sparkline) : extendEquity([100, 104, 102, 108, 112, 110, 118, 122, 120, 128, 135, 132, 140]);

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/90 backdrop-blur-xl border-b border-border px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            aria-label="Back to home"
            className="p-1.5 hover:bg-surface rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-muted" />
          </button>
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm text-foreground">
              Strategy Overview
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* Strategy type labels */}
        <div className="flex flex-wrap gap-2">
          {STRATEGY_LABELS.map((s) => (
            <span
              key={s.key}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border ${
                activeLabel === s.key || !activeLabel
                  ? s.color
                  : "text-muted/40 bg-surface border-border opacity-40"
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </span>
          ))}
        </div>

        {/* Description + trader info */}
        <div className="bg-surface border border-border rounded-xl p-5">
          {traderId ? (
            <>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground mb-1">
                    {strategyName}
                  </h2>
                  <p className="text-sm text-muted leading-relaxed">
                    {activeLabel === "copy" &&
                      `Automatically mirrors all positions opened by ${strategyName} on Hyperliquid. Trades are executed in real time with proportional position sizing relative to your configured allocation. Stop-loss and max drawdown limits are enforced locally.`}
                    {activeLabel === "technical" && (strategyDesc ||
                      "Automated technical strategy executing trades based on indicator signals with configurable risk parameters.")}
                    {activeLabel === "news" &&
                      "Monitors CPI, FOMC, and NFP releases via real-time news feeds. Opens long positions on dovish surprises and shorts on hawkish outcomes. Sentiment scoring from aggregated crypto Twitter and on-chain whale activity is used as a secondary filter before execution."}
                    {activeLabel === "hybrid" &&
                      "Custom notification rule: notify me by Email and Telegram when the Bitcoin price hits $100,000. Monitors BTC-USD spot price across Binance, Coinbase, and Hyperliquid. Alerts are sent within 30 seconds of the trigger condition being met."}
                  </p>
                </div>
                <span
                  className="shrink-0 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md bg-success/10 text-success border border-success/20"
                >
                  Active
                </span>
              </div>

              {activeLabel === "copy" && trader && (
                <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-muted">Address</span>
                    <code className="text-xs font-mono text-foreground">
                      {trader.wallet}
                    </code>
                    <button aria-label="Copy address" className="text-muted/40 hover:text-muted transition-colors cursor-pointer">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <a
                    href="#"
                    className="flex items-center gap-1 text-xs text-primary hover:underline ml-auto shrink-0"
                  >
                    View on Hyperliquid
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-foreground mb-1">
                New Strategy
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                No trader selected. This strategy is unconfigured. Go back and select a trader, or build a custom strategy.
              </p>
            </>
          )}
        </div>

        {/* Stats row — hidden for alert/hybrid strategies */}
        {activeLabel !== "hybrid" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
            {getStatsForType(activeLabel, trader).map((s) => (
              <div key={s.label} className="bg-surface border border-border rounded-xl p-3">
                <p className="text-[10px] text-muted uppercase tracking-wider mb-1">
                  {s.label}
                </p>
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Equity curve (not shown for notification/hybrid strategies) */}
        {activeLabel !== "hybrid" && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Equity Curve
              </h3>
              <div className="flex gap-1.5">
                {["7d", "30d", "90d", "All"].map((p) => (
                  <button
                    key={p}
                    className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                      p === "90d"
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <EquityCurve data={equityData} />
          </div>
        )}

        {/* Notification config card for hybrid */}
        {activeLabel === "hybrid" && (
          <div className="bg-surface border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Alert Configuration
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Email</p>
                  <p className="text-[11px] text-muted">user@example.com</p>
                </div>
                <span className="ml-auto text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                <Send className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">Telegram</p>
                  <p className="text-[11px] text-muted">@hypersignals_bot</p>
                </div>
                <span className="ml-auto text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              </div>
            </div>
            <div className="mt-3 p-3 bg-background rounded-lg border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-foreground">Trigger Condition</p>
                  <p className="text-[11px] text-muted">BTC-USD spot price &ge; $100,000.00</p>
                </div>
                <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  Watching
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom section: positions/trades or notification history */}
        {activeLabel === "hybrid" ? (
          <NotificationHistory />
        ) : (
          <PositionsAndHistory />
        )}
      </main>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Page wrapper (Suspense for useSearchParams)                        */
/* ------------------------------------------------------------------ */

export default function StrategyPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full bg-background flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted">
            <Hexagon className="w-5 h-5 text-primary animate-pulse" />
            <span className="text-sm">Loading strategy&hellip;</span>
          </div>
        </div>
      }
    >
      <StrategyContent />
    </Suspense>
  );
}
