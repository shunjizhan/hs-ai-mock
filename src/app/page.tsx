"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Hexagon,
  ArrowUp,
  TrendingUp,
  BarChart3,
  Newspaper,
  Wrench,
  RefreshCw,
} from "lucide-react";

import { mockTraders, type Trader } from "@/data/mock-traders";
import {
  mockTechnicalStrategies,
  type TechnicalStrategy,
} from "@/data/mock-technical-strategies";
import { TraderCard } from "@/components/trader-card";
import { TechnicalCard } from "@/components/technical-card";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ChatOption {
  label: string;
  value: string;
}

interface Message {
  id: string;
  role: "ai" | "user";
  content: string;
  options?: ChatOption[];
  traders?: Trader[];
  techStrategies?: TechnicalStrategy[];
  showShuffle?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SHORTCUTS = [
  {
    id: "copy-trading",
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Copy Trading",
    description: "Mirror top-performing traders automatically",
    color: "text-primary bg-primary/10 group-hover:bg-primary/20",
  },
  {
    id: "technical-trading",
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Technical Trading",
    description: "Indicator-based automated strategies",
    color: "text-accent bg-accent/10 group-hover:bg-accent/20",
  },
  {
    id: "news-trading",
    icon: <Newspaper className="w-5 h-5" />,
    title: "News Trading",
    description: "Event-driven sentiment-based execution",
    color: "text-cyan-400 bg-cyan-400/10 group-hover:bg-cyan-400/20",
  },
  {
    id: "build-own",
    icon: <Wrench className="w-5 h-5" />,
    title: "Build Your Own Strategy",
    description: "Custom rules, notifications, and conditions",
    color: "text-emerald-400 bg-emerald-400/10 group-hover:bg-emerald-400/20",
  },
];

const CRITERIA_OPTIONS: ChatOption[] = [
  { label: "Highest Profit", value: "max-profit" },
  { label: "Lowest Drawdown", value: "lowest-drawdown" },
  { label: "Best HyperScore", value: "max-hyperscore" },
  { label: "Just pick for me", value: "auto-pick" },
  { label: "I\u2019ll select my own", value: "select-own" },
];

const CRITERIA_LABEL: Record<string, string> = {
  "max-profit": "Highest Profit",
  "lowest-drawdown": "Lowest Drawdown",
  "max-hyperscore": "Best HyperScore",
};

const CRITERIA_DESC: Record<string, string> = {
  "max-profit": "cumulative profit",
  "lowest-drawdown": "risk management and drawdown control",
  "max-hyperscore": "overall HyperScore rating",
};

/* ------------------------------------------------------------------ */
/*  Technical trading constants                                        */
/* ------------------------------------------------------------------ */

const TECH_OPTIONS: ChatOption[] = [
  { label: "RSI Strategies", value: "tech-rsi" },
  { label: "MACD Strategies", value: "tech-macd" },
  { label: "Bollinger Band Strategies", value: "tech-bb" },
  { label: "Just pick for me", value: "tech-auto" },
  { label: "I\u2019ll select my own", value: "tech-browse" },
];

const TECH_FILTER: Record<string, string> = {
  "tech-rsi": "RSI",
  "tech-macd": "MACD",
  "tech-bb": "Bollinger Bands",
};

const TECH_LABEL: Record<string, string> = {
  "tech-rsi": "RSI Strategies",
  "tech-macd": "MACD Strategies",
  "tech-bb": "Bollinger Band Strategies",
};

const sortTechStrategies = (indicator: string): TechnicalStrategy[] => {
  const filtered =
    indicator === "all"
      ? mockTechnicalStrategies
      : mockTechnicalStrategies.filter((s) => s.indicator === indicator);
  return [...filtered].sort((a, b) => b.hyperScore - a.hyperScore);
};

const techSet = (indicator: string, page: number) =>
  sortTechStrategies(indicator).slice(page * 3, page * 3 + 3);

const COMING_SOON: Record<string, string> = {
  "news-trading":
    "News trading is on the roadmap. Real-time sentiment analysis and event-driven execution are coming soon.",
  "build-own":
    "The custom strategy builder is under development. You\u2019ll be able to combine signals, set conditions, and backtest \u2014 all from this interface.",
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const sortTraders = (criteria: string): Trader[] => {
  switch (criteria) {
    case "max-profit":
      return [...mockTraders].sort((a, b) => b.profit - a.profit);
    case "lowest-drawdown":
      return [...mockTraders].sort((a, b) => a.drawdown - b.drawdown);
    case "max-hyperscore":
      return [...mockTraders].sort((a, b) => b.hyperScore - a.hyperScore);
    default:
      return mockTraders;
  }
};

const traderSet = (criteria: string, page: number) =>
  sortTraders(criteria).slice(page * 3, page * 3 + 3);

const uid = () => crypto.randomUUID();

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function StrategyBuilder() {
  const router = useRouter();

  const [phase, setPhase] = useState<"welcome" | "chat">("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [criteria, setCriteria] = useState<string | null>(null);
  const [traderPage, setTraderPage] = useState(0);
  const [techIndicator, setTechIndicator] = useState<string | null>(null);
  const [techPage, setTechPage] = useState(0);
  const [activeFlow, setActiveFlow] = useState<"copy" | "technical" | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /* --- message helpers --- */

  const pushUser = (content: string) =>
    setMessages((prev) => [...prev, { id: uid(), role: "user", content }]);

  const pushAi = async (msg: Omit<Message, "id" | "role">) => {
    setIsTyping(true);
    await new Promise((r) => setTimeout(r, 700 + Math.random() * 500));
    setIsTyping(false);
    setMessages((prev) => [...prev, { ...msg, id: uid(), role: "ai" }]);
  };

  /* --- flow helpers --- */

  const startCopyFlow = () =>
    pushAi({
      content:
        "Great choice. Copy trading lets you mirror the positions of proven traders in real time. To find the best match, let\u2019s start with what matters most to you.",
      options: CRITERIA_OPTIONS,
    });

  const showTraders = (c: string, page: number) => {
    const traders = traderSet(c, page);
    const maxPages = Math.ceil(mockTraders.length / 3);
    return pushAi({
      content: `Here are the top traders ranked by ${CRITERIA_DESC[c]}. Select one to proceed, or shuffle to see more options.`,
      traders,
      showShuffle: true,
    });
  };

  const startTechFlow = () =>
    pushAi({
      content:
        "Great choice. Do you want to pick one of our flagship strategies, or explore all of them yourself?",
      options: TECH_OPTIONS,
    });

  const showTechStrategies = (indicator: string, page: number) => {
    const strategies = techSet(indicator, page);
    const label = TECH_FILTER[`tech-${indicator.toLowerCase()}`] ?? indicator;
    return pushAi({
      content: `Here are the top ${label === "all" ? "" : label + " "}strategies by HyperScore. Select one to activate, or shuffle to see more.`,
      techStrategies: strategies,
      showShuffle: true,
    });
  };

  /* --- handlers --- */

  const handleShortcut = async (id: string) => {
    setPhase("chat");

    const labels: Record<string, string> = {
      "copy-trading": "I want to explore copy trading",
      "technical-trading": "I\u2019d like to set up technical trading",
      "news-trading": "I\u2019m interested in news-based trading",
      "build-own": "I want to build my own strategy",
    };
    pushUser(labels[id]);

    if (id === "copy-trading") {
      setActiveFlow("copy");
      await startCopyFlow();
    } else if (id === "technical-trading") {
      setActiveFlow("technical");
      await startTechFlow();
    } else {
      await pushAi({ content: COMING_SOON[id] ?? "This feature is coming soon." });
    }
  };

  const handleOption = async (value: string) => {
    if (isTyping) return;

    if (value === "auto-pick") {
      pushUser("Just pick the best for me");
      setCriteria("max-hyperscore");
      setTraderPage(0);
      await showTraders("max-hyperscore", 0);
      return;
    }

    if (value === "select-own") {
      pushUser("I\u2019ll pick a trader myself");
      router.push("/traders");
      return;
    }

    if (value in CRITERIA_LABEL) {
      pushUser(CRITERIA_LABEL[value]);
      setCriteria(value);
      setTraderPage(0);
      await showTraders(value, 0);
      return;
    }

    if (value === "start-copy" && pendingTrader) {
      pushUser("Start copy trading now");
      await pushAi({
        content: `Done. Copy trading for ${pendingTrader.name} is now active. Redirecting you to the strategy dashboard\u2026`,
      });
      const tid = pendingTrader.id;
      setPendingTrader(null);
      setTimeout(() => router.push(`/strategy?trader=${tid}`), 3000);
      return;
    }

    if (value === "view-details" && pendingTrader) {
      pushUser("Let me see the details first");
      const tid = pendingTrader.id;
      setPendingTrader(null);
      router.push(`/strategy?trader=${tid}`);
      return;
    }

    // Technical trading options
    if (value === "tech-auto") {
      pushUser("Just pick the best for me");
      setTechIndicator("all");
      setTechPage(0);
      await showTechStrategies("all", 0);
      return;
    }

    if (value === "tech-browse") {
      pushUser("I\u2019ll browse them myself");
      router.push("/technical-strategies");
      return;
    }

    if (value in TECH_FILTER) {
      pushUser(TECH_LABEL[value]);
      const indicator = TECH_FILTER[value];
      setTechIndicator(indicator);
      setTechPage(0);
      await showTechStrategies(indicator, 0);
      return;
    }

    if (value === "start-strategy" && pendingTrader) {
      pushUser("Activate it now");
      await pushAi({
        content: `Done. ${pendingTrader.name} is now live. Redirecting you to the strategy dashboard\u2026`,
      });
      const tid = pendingTrader.id;
      setPendingTrader(null);
      setTimeout(() => router.push(`/strategy?trader=${tid}`), 3000);
      return;
    }

    // Redirects from fallback options
    if (value === "copy-trading-redirect") {
      pushUser("Copy trading");
      setActiveFlow("copy");
      await startCopyFlow();
    } else if (value === "technical-redirect") {
      pushUser("Technical trading");
      setActiveFlow("technical");
      await startTechFlow();
    } else if (value === "news-redirect") {
      pushUser("News trading");
      await pushAi({ content: COMING_SOON["news-trading"] });
    }
  };

  const handleShuffle = () => {
    if (isTyping) return;

    if (activeFlow === "technical" && techIndicator) {
      const sorted = sortTechStrategies(techIndicator);
      const maxPages = Math.ceil(sorted.length / 3);
      const next = (techPage + 1) % maxPages;
      setTechPage(next);
      const newStrategies = techSet(techIndicator, next);
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].techStrategies) {
            copy[i] = { ...copy[i], techStrategies: newStrategies };
            break;
          }
        }
        return copy;
      });
      return;
    }

    if (criteria) {
      const maxPages = Math.ceil(mockTraders.length / 3);
      const next = (traderPage + 1) % maxPages;
      setTraderPage(next);
      const newTraders = traderSet(criteria, next);
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i--) {
          if (copy[i].traders) {
            copy[i] = { ...copy[i], traders: newTraders };
            break;
          }
        }
        return copy;
      });
    }
  };

  const [pendingTrader, setPendingTrader] = useState<{ id: string; name: string } | null>(null);

  const handleTraderSelect = async (trader: Trader) => {
    if (isTyping) return;
    setPendingTrader({ id: trader.id, name: trader.name });
    pushUser(`I\u2019ll go with ${trader.name}`);
    await pushAi({
      content: `Excellent choice. ${trader.name} has a solid track record \u2014 ${trader.winRate}% win rate across ${trader.trades.toLocaleString()} trades with a ${(trader.hyperScore / 10).toFixed(1)}/10 HyperScore. Want to start copy trading right now?`,
      options: [
        { label: "Start copy trading now", value: "start-copy" },
        { label: "View details first", value: "view-details" },
      ],
    });
  };

  const handleTechSelect = async (strategy: TechnicalStrategy) => {
    if (isTyping) return;
    setPendingTrader({ id: strategy.id, name: strategy.name });
    pushUser(`I\u2019ll go with ${strategy.name}`);
    await pushAi({
      content: `Great pick. ${strategy.name} uses ${strategy.indicator} signals on ${strategy.timeframe} timeframe with a ${strategy.winRate}% win rate and ${strategy.roi.toFixed(0)}% ROI. Want to activate it now?`,
      options: [
        { label: "Activate it now", value: "start-strategy" },
        { label: "View details first", value: "view-details" },
      ],
    });
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;
    setInputValue("");
    if (phase === "welcome") setPhase("chat");

    const lo = text.toLowerCase();

    if (lo.includes("copy")) {
      pushUser(text);
      await startCopyFlow();
    } else if (lo.includes("technical") || lo.includes("indicator")) {
      pushUser(text);
      await pushAi({ content: COMING_SOON["technical-trading"] });
    } else if (lo.includes("news") || lo.includes("sentiment")) {
      pushUser(text);
      await pushAi({ content: COMING_SOON["news-trading"] });
    } else if (lo.includes("build") || lo.includes("custom") || lo.includes("own")) {
      pushUser(text);
      await pushAi({ content: COMING_SOON["build-own"] });
    } else if (lo.includes("profit")) {
      pushUser(text);
      setCriteria("max-profit");
      setTraderPage(0);
      await showTraders("max-profit", 0);
    } else if (lo.includes("drawdown") || lo.includes("risk") || lo.includes("safe")) {
      pushUser(text);
      setCriteria("lowest-drawdown");
      setTraderPage(0);
      await showTraders("lowest-drawdown", 0);
    } else if (lo.includes("score") || lo.includes("hyper")) {
      pushUser(text);
      setCriteria("max-hyperscore");
      setTraderPage(0);
      await showTraders("max-hyperscore", 0);
    } else {
      pushUser(text);
      await pushAi({
        content:
          "I can help you with copy trading, technical strategies, or news-based trading. Which area interests you?",
        options: [
          { label: "Copy Trading", value: "copy-trading-redirect" },
          { label: "Technical Trading", value: "technical-redirect" },
          { label: "News Trading", value: "news-redirect" },
        ],
      });
    }
  };

  /* --- derived --- */

  const lastUserIdx = messages.findLastIndex((m) => m.role === "user");

  /* --- render --- */

  const renderInput = (className?: string) => (
    <div className={className}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={"Brainstorm a strategy, ask a question, or just explore\u2026"}
          disabled={isTyping}
          className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={isTyping || !inputValue.trim()}
          aria-label="Send message"
          className="absolute right-2 p-2 rounded-lg bg-primary text-slate-900 disabled:opacity-30 disabled:bg-muted/30 hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  if (phase === "welcome") {
    return (
      <div className="flex flex-col h-full bg-background">
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-6">
            <Hexagon className="w-7 h-7 text-primary" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 text-center">
            What&rsquo;s on your mind today?
          </h1>
          <p className="text-muted text-sm mb-8 text-center max-w-md">
            Choose a strategy type to get started, or tell me what you&rsquo;re
            looking for.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg mb-8">
            {SHORTCUTS.map((s) => (
              <button
                key={s.id}
                onClick={() => handleShortcut(s.id)}
                className="group flex items-start gap-3 p-4 bg-surface border border-border rounded-xl text-left transition-all duration-200 hover:border-primary/40 hover:bg-surface-hover cursor-pointer"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${s.color}`}>
                  {s.icon}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-0.5">
                    {s.title}
                  </h3>
                  <p className="text-xs text-muted leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {renderInput("w-full max-w-lg")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {messages.map((msg, idx) => {
            if (msg.role === "user") {
              return (
                <div
                  key={msg.id}
                  className="flex justify-end mb-6 animate-message-in"
                >
                  <div className="max-w-[80%] bg-surface rounded-2xl px-4 py-3">
                    <p className="text-sm text-foreground">{msg.content}</p>
                  </div>
                </div>
              );
            }

            const isStale =
              lastUserIdx > idx &&
              messages
                .slice(idx + 1, lastUserIdx + 1)
                .some((m) => m.role === "user");

            return (
              <div key={msg.id} className="mb-6 animate-message-in">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Hexagon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground/90 leading-relaxed">
                      {msg.content}
                    </p>

                    {msg.options && (
                      <div className="flex flex-col gap-1.5 mt-4 max-w-xs">
                        {msg.options.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => handleOption(opt.value)}
                            disabled={isTyping || isStale}
                            className={`px-4 py-2.5 text-sm text-left border border-border rounded-lg transition-all duration-200 cursor-pointer ${
                              isStale
                                ? "opacity-40 pointer-events-none"
                                : "text-foreground/80 hover:border-primary/60 hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:pointer-events-none"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {msg.traders && (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {msg.traders.map((trader) => (
                            <TraderCard
                              key={trader.id}
                              trader={trader}
                              onSelect={
                                isStale ? undefined : handleTraderSelect
                              }
                            />
                          ))}
                        </div>
                        {msg.showShuffle && !isStale && (
                          <button
                            onClick={handleShuffle}
                            disabled={isTyping}
                            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-primary border border-border rounded-full hover:border-primary/40 transition-all duration-200 disabled:opacity-40 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Shuffle
                          </button>
                        )}
                      </div>
                    )}

                    {msg.techStrategies && (
                      <div className="mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {msg.techStrategies.map((strat) => (
                            <TechnicalCard
                              key={strat.id}
                              strategy={strat}
                              onSelect={
                                isStale ? undefined : handleTechSelect
                              }
                            />
                          ))}
                        </div>
                        {msg.showShuffle && !isStale && (
                          <button
                            onClick={handleShuffle}
                            disabled={isTyping}
                            className="mt-3 flex items-center gap-2 px-4 py-2 text-sm text-muted hover:text-accent border border-border rounded-full hover:border-accent/40 transition-all duration-200 disabled:opacity-40 cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            Shuffle
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-3 mb-6">
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
                <Hexagon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex items-center gap-1.5 py-3">
                <span className="w-2 h-2 bg-muted rounded-full typing-dot" />
                <span className="w-2 h-2 bg-muted rounded-full typing-dot" />
                <span className="w-2 h-2 bg-muted rounded-full typing-dot" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border px-4 py-4">
        {renderInput("max-w-3xl mx-auto")}
      </div>
    </div>
  );
}
