# Hypersignals AI Design Docs -- AI module


## 1. Overview

This document details the AI conversation subsystem -- the interactive loop where a user describes a trading strategy in natural language, and the AI translates it into an executable strategy (structured DSL or Python code), auto-backtests it, and iterates based on feedback.

**Scope:** User message -> Rust core -> LLM -> strategy generation -> validation -> backtest trigger -> results to user. Backtesting internals are treated as a black box.

**Out of scope:** Python compute internals, data ingestion, exchange execution, billing, marketplace.

### 1.1 Key Design Principles

1. **DSL vs code is invisible to the user.** The AI decides automatically whether to use structured DSL or Python code. Users describe intent; the system figures out the representation. The user never needs to know which mode is being used.
2. **Correctness over convenience.** If a strategy CAN be expressed as DSL, always use DSL. If it CANNOT, never return an approximate DSL -- use Python code instead. No guessing.
3. **Every change is versioned.** Each strategy modification creates a new immutable version. Users can ask the AI to revert to any previous version. History is append-only.
4. **Auto-backtest on every version.** Every new strategy version triggers a backtest automatically. The user always sees how the strategy performs without having to ask.
5. **The AI is educational.** Responses explain the strategy logic, why certain choices were made, and what the indicators mean. This builds user trust and helps them iterate effectively.

## 2. System Prompt Architecture

The system prompt is the most critical piece -- it determines whether the AI makes correct DSL vs code decisions and produces valid output. It has four layers.

### 2.1 Layer 1 -- Role & Behavior Rules (Static)

```
You are a crypto trading strategy builder for Hyperliquid perpetual trading.

BEHAVIOR:
- Always respond with a plain-English explanation of the strategy alongside the strategy definition.
- Explain your choices (why RSI(14), why 1h timeframe, etc.) to help the user understand.
- When creating or modifying a strategy, always output the COMPLETE strategy inside <strategy> tags.
- Never show raw JSON or code to the user in the chat text. Speak in plain English.
- If you cannot understand the user's intent, ask clarifying questions BEFORE generating a strategy.
- On modifications, output the full updated strategy (not a partial patch).

DECISION RULES:
1. Default to structured DSL. Use code mode ONLY when the strategy requires logic the DSL cannot express.
2. Risk rules MUST always be structured JSON -- never put risk logic inside custom_code.
3. Do not approximate. If a request cannot be expressed precisely in DSL, use code mode.
   Do NOT return a DSL that "sort of" captures the intent.
4. When using code mode, still explain the strategy in plain English.
   The user does not need to know it is code.
```

### 2.2 Layer 2 -- DSL & Code Specification (Static)

This is the AI's complete reference manual. It must be exhaustive so the AI can make correct DSL vs code decisions.

#### 2.2.1 DSL Specification

**Full schema reference:**

- `version` (int, required): Schema version, currently `1`
- `name` (string, required): Human-readable strategy name
- `trigger` (object, required): `{ "type": "candle_close", "timeframe": "<1m|5m|15m|1h|4h|1d>" }`
- `assets` (string[], required): List of asset symbols, e.g. `["BTC"]`
- `entry` (object, required in DSL mode):
  - `direction`: `"long"` or `"short"`
  - `conditions`: Array of condition objects (see Condition System below)
  - `logic`: `"AND"` or `"OR"` -- how conditions are combined
- `exit` (object, required in DSL mode):
  - `take_profit`: `{ "type": "percent", "value": <float> }` or `null`
  - `stop_loss`: `{ "type": "percent", "value": <float> }` or `null`
  - `trailing_stop`: `{ "type": "percent", "value": <float> }` or `null`
  - `conditions`: Array of condition objects for signal-based exit
- `position` (object, required in DSL mode):
  - `size`: `{ "type": "percent_of_balance", "value": <float 1-100> }`
  - `leverage`: float (must be <= `risk.max_leverage`)
- `risk` (object, always required -- both DSL and code mode):
  - `max_open_positions`: int >= 1
  - `max_daily_loss_percent`: float > 0
  - `max_leverage`: float > 0
- `on_error`: `"skip_and_notify"` or `"pause_strategy"`
- `custom_code`: `null` for DSL mode, `{ "language": "python", "code": "<string>" }` for code mode

**Condition system:**

Each condition follows the `left [operator] right` pattern:

```json
{
  "left": { "<operand>" },
  "operator": "<comparison>",
  "right": { "<operand>" }
}
```

**Operand types:**

1. **Indicator reference:** `{ "type": "indicator", "indicator": "<name>", "asset": "<symbol>", "timeframe": "<tf>", "params": {...}, "field": "<sub-field or null>" }`
2. **Price reference:** `{ "type": "price", "asset": "<symbol>", "timeframe": "<tf>", "field": "<open|high|low|close|volume>" }`
3. **Lookback function:** `{ "type": "lookback", "function": "<highest|lowest|average|sum>", "source": { <operand> }, "period": <int>, "multiplier": <float, optional> }`
4. **Static value:** `{ "type": "value", "value": <number> }`

**Operators:** `greater_than`, `less_than`, `greater_than_or_equal`, `less_than_or_equal`, `crossed_above`, `crossed_below`

`crossed_above` / `crossed_below` are temporal -- they compare current candle vs previous candle internally. The DSL author does not need to manage offsets.

**Supported indicators:**

| Indicator | Params | Output Fields |
|---|---|---|
| `rsi` | `period` (int, default 14) | single value |
| `ema` | `period` (int) | single value |
| `sma` | `period` (int) | single value |
| `macd` | `fast` (int, 12), `slow` (int, 26), `signal` (int, 9) | `macd`, `signal`, `histogram` |
| `bollinger` | `period` (int, 20), `std` (float, 2.0) | `upper`, `middle`, `lower` |
| `atr` | `period` (int, 14) | single value |
| `vwap` | none | single value |
| `volume` | none | single value |
| `supertrend` | `period` (int, 10), `multiplier` (float, 3.0) | `value`, `direction` |

**DSL expressiveness boundary -- what the DSL CAN express:**

- Single-asset entry/exit conditions with any combination of supported indicators
- Multi-condition logic with AND/OR
- Crossover detection (e.g., MACD line crosses above signal)
- Lookback aggregations with multiplier (e.g., price < 95% of 24-candle high)
- Take profit / stop loss / trailing stop (percent-based)
- Percent-of-balance position sizing with leverage

**What the DSL CANNOT express (use code mode):**

- Cross-asset correlation or comparison (e.g., "buy ETH when BTC RSI diverges from ETH RSI")
- RSI divergence (comparing price highs/lows with indicator highs/lows over dynamic windows)
- Complex candlestick pattern detection (engulfing, doji, hammer)
- Custom position sizing algorithms (Kelly criterion, volatility-scaled)
- Stateful logic across evaluations (pyramiding count, trade counter)
- Multi-asset rotation with scoring/ranking

**Boundary examples (critical for correct AI decisions):**

| User Says | Mode | Why |
|---|---|---|
| "Buy BTC when RSI drops below 30" | DSL | Simple static threshold |
| "Buy when EMA(20) crosses above EMA(50)" | DSL | Crossover -- `crossed_above` operator |
| "Buy the dip -- 5% below 24h high" | DSL | Lookback with multiplier |
| "Buy when RSI is diverging from price" | Code | Requires comparing highs/lows over dynamic windows |
| "Rotate between BTC, ETH, HYPE based on lowest RSI" | Code | Multi-asset scoring/ranking |
| "Buy when I see a hammer candlestick" | Code | Multi-field candle body comparison |
| "Scale into position -- buy 10% more each time it dips" | Code | Stateful logic (pyramiding) |
| "Go long BTC when MACD histogram is positive and RSI < 50" | DSL | Two indicator conditions with AND |

#### 2.2.2 Code Mode Specification

When the DSL cannot express the strategy, the AI generates a Python `evaluate(ctx)` function.

**The evaluate contract:**

```python
def evaluate(ctx) -> list[TradeDecision]:
    """
    Called on every candle close. Must return a list of TradeDecision
    objects (or empty list for no action).
    """
    pass
```

**StrategyContext API (`ctx`):**

```python
ctx.indicators(asset: str, timeframe: str) -> IndicatorAccess
    # Example: ctx.indicators("BTC", "4h").rsi(14) -> float
    # Methods: .rsi(period), .ema(period), .sma(period),
    #          .macd(fast, slow, signal) -> {macd, signal, histogram},
    #          .bollinger(period, std) -> {upper, middle, lower},
    #          .atr(period), .vwap(), .volume(),
    #          .supertrend(period, multiplier) -> {value, direction}

ctx.price(asset: str, timeframe: str) -> PriceAccess
    # Example: ctx.price("BTC", "1h").close -> float
    # Fields: .open, .high, .low, .close, .volume
    # History: .close_series(n) -> list[float] (last n candles)

ctx.portfolio() -> PortfolioAccess
    # .available_balance -> float
    # .positions -> list[Position]  (current open positions)
```

**TradeDecision return type:**

```python
class TradeDecision:
    side: Literal["buy", "sell"]
    asset: str
    size: float               # in USD
    leverage: float = 1.0
    order_type: Literal["market", "limit"] = "market"
    limit_price: float | None = None
    reduce_only: bool = False
    reason: str = ""          # AI should always provide a reason
```

**Sandbox constraints (AI must follow when generating code):**

- No imports (except builtins)
- No file I/O, no network access
- No `exec()`, `eval()`, `__import__()`
- Only `ctx` methods for data access
- CPU time and memory caps enforced by platform

**Code mode example:**

```python
def evaluate(ctx):
    rsi_values = {}
    for asset in ['BTC', 'ETH', 'HYPE']:
        rsi_values[asset] = ctx.indicators(asset, '4h').rsi(14)
    
    lowest = min(rsi_values, key=rsi_values.get)
    if rsi_values[lowest] < 35:
        size = ctx.portfolio().available_balance * 0.10
        return [TradeDecision(
            side='buy',
            asset=lowest,
            size=size,
            leverage=2.0,
            reason=f'{lowest} has lowest RSI at {rsi_values[lowest]:.1f}'
        )]
    return []
```

### 2.3 Layer 3 -- Output Format (Static)

The AI's response always follows this structure:

```
[Plain-English explanation of the strategy, educational, conversational]

<strategy>
[Complete strategy JSON -- either DSL mode or code mode]
</strategy>

[Optional: follow-up suggestion or question, e.g., "Want me to adjust the RSI threshold?"]
```

Rules:
- The `<strategy>` block always contains valid JSON (even in code mode -- the Python code is embedded in the JSON `custom_code` field)
- Only include `<strategy>` when creating or modifying a strategy
- For non-strategy messages (clarification questions, general discussion), omit the block entirely
- Never include multiple `<strategy>` blocks in one response

### 2.4 Layer 4 -- Dynamic Context (Per-Request)

Injected by Rust core on every LLM call:

```
CURRENT STRATEGY (v5):
<the full JSON of the latest strategy version, or "No strategy yet" if in EXPLORING state>

VERSION HISTORY:
v1: "Initial RSI oversold strategy" (DSL)
v2: "Changed RSI threshold from 30 to 25" (DSL)
v3: "Added trailing stop at 2%" (DSL)
v4: "Switched to MACD crossover approach" (DSL)
v5: "Added multi-asset rotation" (code)

AVAILABLE ASSETS: BTC, ETH, HYPE, SOL, ARB, ...
AVAILABLE TIMEFRAMES: 1m, 5m, 15m, 1h, 4h, 1d
```

### 2.5 Prompt Assembly Order

The full prompt sent to the LLM on each request:

```
1. [System] Layer 1: Role & behavior rules
2. [System] Layer 2: DSL & code specification
3. [System] Layer 3: Output format rules
4. [System] Layer 4: Dynamic context (current strategy, versions, assets)
5. [User]   Message 1
6. [Assistant] Response 1
7. [User]   Message 2
8. [Assistant] Response 2
   ... full conversation history ...
N. [User]   Latest message
```

Layers 1-3 are static and eligible for prompt caching (provider-dependent). Layer 4 changes per-request.

**Future optimization (not v1):** When conversation history exceeds a threshold (~40 turns), switch to sliding window + compressed summary approach. Replace items 5-8 with a running summary + last 10 messages.

## 3. Conversation Flow & State Machine

### 3.0 Non-Strategy Messages

Not every user message results in a strategy change. The user might ask:

- "What does RSI mean?"
- "Explain my current strategy to me"
- "What timeframes work best for scalping?"
- "What's the weather?" (off-topic)

In these cases, the AI responds with text only (no `<strategy>` block). The conversation state does **not** change. The message is still saved to history so the LLM retains full context. The system prompt (Layer 1) instructs the AI to stay on-topic for crypto/trading questions and politely redirect off-topic requests.

### 3.1 States

```
EMPTY ──> EXPLORING ──> HAS_STRATEGY ──> ITERATING
                                             |
                                             v  (user deploys)
                                          DEPLOYED (conversation locked)
```

- **EMPTY** -- New conversation, no messages. User lands on chat.
- **EXPLORING** -- User is describing intent. AI asks clarifying questions if needed. No strategy generated yet.
- **HAS_STRATEGY** -- AI generated a first strategy version (v1). Backtest auto-triggered.
- **ITERATING** -- User is refining. Each modification creates a new version. Backtest runs on each. User can request rollback to any version.
- **DEPLOYED** -- User approved a version for live trading. Strategy modification is locked -- the AI will not produce new `<strategy>` blocks. The user can still chat (ask questions about the strategy, indicators, performance, etc.) and the AI responds with text only. To modify the strategy, the user must stop the live strategy first, returning to ITERATING state. (See Open Question in Section 7: post-deploy modification.)

### 3.2 State Transitions

| Transition | Trigger | Rust Core Action |
|---|---|---|
| EMPTY -> EXPLORING | User sends first message | Create conversation record in DB |
| EXPLORING -> HAS_STRATEGY | LLM response contains `<strategy>` block | Validate strategy, save as v1, create strategy record, trigger backtest |
| HAS_STRATEGY -> ITERATING | LLM response contains a new `<strategy>` block | Validate, save as v(N+1), trigger backtest |
| ITERATING -> ITERATING | Modification or rollback | Same as above. Rollback creates a new v(N+1) with old content. |
| ITERATING -> DEPLOYED | User says "deploy" / "go live" | Link current version to execution account, start scheduler, lock conversation |

### 3.3 Version History Model

Every version is a **full snapshot** (not a delta). History is **append-only** -- versions are never mutated or deleted.

The AI generates a one-line `summary` for each version as part of its response. This summary is stored alongside the version and included in Layer 4 of the prompt so the AI can reference history ("In v2 you changed the RSI threshold...").

Rollback is modeled as creating a new version with the content of the target version. The summary records provenance. Example:

```
v1: "Initial RSI strategy"
v2: "Changed threshold to 25"
v3: "Added trailing stop"       <-- user says "go back to v1"
v4: "Reverted to v1"            (content identical to v1)
```

## 4. Request/Response Pipeline

### 4.1 Full Path of a User Message

**Step 1 -- User sends message.** FE sends over WebSocket:

```json
{
  "type": "user_message",
  "conversation_id": "conv_abc",
  "content": "Change the RSI threshold to 25 and add a trailing stop at 2%"
}
```

**Step 2 -- Rust core assembles LLM prompt.** Loads from DB/cache:

- System prompt layers 1-3 (static, cached)
- Layer 4 dynamic context: current strategy, version history, available assets/timeframes
- Full conversation message history
- Appends the new user message

**Step 3 -- Rust core streams LLM response.** Token-by-token from LLM API (SSE):

```
State machine:
  TEXT (default) ─── on token ──> forward to FE as chat_text delta
       |
       on "<strategy>" ──> switch to STRATEGY state, start buffering
       
  STRATEGY ─── on token ──> append to buffer (do NOT forward to FE)
       |
       on "</strategy>" ──> switch to TEXT state, process buffer
       
  TEXT (after strategy) ─── on token ──> forward to FE as chat_text delta
```

**Step 4 -- Strategy block processing.** After `</strategy>` is detected:

```
Parse JSON from buffer
        |
        v
  Has custom_code field?
     |            |
     no           yes
     |            |
     v            v
DSL validation:   Code validation:
 - Schema check    - Risk rules valid JSON
 - Param ranges    - custom_code.language == "python"
 - Indicator        - Basic structural checks
   exists          (full Python validation
 - Required         deferred to backtest)
   fields          
     |            |
     v            v
  Validation passes? ───── no ──> Retry (up to 2x with error context)
     |                                   |
     yes                           still fails after 2 retries
     |                                   |
     v                                   v
  Save as new version             Send clarification message
     |                            to FE via chat_text:
     v                            "I'm having trouble with that.
  Send strategy_update to FE      Could you describe it differently?"
     |
     v
  Trigger backtest (async) ──> Python compute (black box)
     |
     v
  On backtest return:
  Send backtest_result to FE
```

**Retry logic by mode:**

- DSL failure: "The strategy had a validation error: `entry.conditions[0].params.period must be > 0`. Please fix and regenerate the complete strategy."
- Code failure: "The Python code has a structural issue: `missing def evaluate(ctx) function`. Please fix and regenerate the complete strategy."
- Backtest runtime error (async, not retried automatically): FE receives `backtest_result` with error field. User sees "The strategy encountered an error during backtesting" and can ask the AI to fix it in the next turn.

**Step 5 -- FE receives messages on WebSocket:**

| Message Type | When | FE Renders As |
|---|---|---|
| `chat_text` | Real-time as tokens stream | Chat bubble with typing effect |
| `chat_text_done` | After LLM stream ends | Finalize chat bubble, assign message_id |
| `strategy_update` | After strategy validated & saved | Strategy panel update (FE computes diff client-side if needed) |
| `backtest_result` | After backtest completes (async) | Metrics card, equity curve, trade log |
| `error` | On system errors | Error notification |

**Step 6 -- Persist.** Rust saves both the user message and the full AI response to the database. The assistant message's `content_text` stores the **complete raw response** including `<strategy>` tags. This is important because:

- The LLM needs to see its previous strategy outputs in conversation history to maintain context
- It enables debugging and auditing of what the AI actually generated
- The FE only displays the text portions (outside `<strategy>` tags); the raw storage is an implementation detail

### 4.2 Sequence Diagram

```
FE                    Rust Core                 LLM API           Python Compute
 |                        |                        |                    |
 |-- user_message ------->|                        |                    |
 |                        |-- assemble prompt      |                    |
 |                        |-- POST /stream ------->|                    |
 |                        |                        |                    |
 |                        |<-- token: "I've" ------|                    |
 |<-- chat_text "I've" ---|                        |                    |
 |                        |<-- token: "set" -------|                    |
 |<-- chat_text "set" ----|                        |                    |
 |                        |   ...                  |                    |
 |                        |<-- "<strategy>" -------|                    |
 |                        |   (start buffering)    |                    |
 |                        |<-- JSON tokens... -----|                    |
 |   (silence)            |   (buffering)          |                    |
 |                        |<-- "</strategy>" ------|                    |
 |                        |                        |                    |
 |                        |-- validate strategy    |                    |
 |                        |-- save version v(N+1)  |                    |
 |<-- strategy_update ----|                        |                    |
 |                        |                        |                    |
 |                        |<-- token: "Want..." ---|                    |
 |<-- chat_text "Want.."--|                        |                    |
 |                        |<-- [DONE] -------------|                    |
 |<-- chat_text_done -----|                        |                    |
 |                        |                        |                    |
 |                        |-- POST /backtest ------|------------------>|
 |                        |                        |      (computing)  |
 |                        |<-- backtest results ---|-------------------|
 |<-- backtest_result ----|                        |                    |
```

### 4.3 Edge Cases

**Concurrent messages:** If the user sends a new message while the AI is still streaming a response, Rust core **rejects** the message with an error: `{ "type": "error", "code": "generation_in_progress", "message": "Please wait for the current response to finish." }`. The FE should disable the send button while a response is streaming.

**Stop generation:** When the FE sends `{ "type": "stop_generation" }`, Rust core:
1. Closes the LLM stream immediately
2. If in TEXT state: save the partial text as an assistant message, send `chat_text_done`
3. If in STRATEGY state (mid-buffer): discard the incomplete strategy block, save only the text portion, send `chat_text_done`. No `strategy_update` is sent.

**Truncated strategy block:** If the LLM hits max output tokens mid-JSON (the `<strategy>` block never closes), treat as stop generation in STRATEGY state -- discard the incomplete block, save the text, and auto-retry with an additional instruction to be more concise.

**Stream interruption (network/timeout):** If the LLM API connection drops:
1. Save whatever text has been streamed so far as a partial assistant message
2. Send `{ "type": "error", "code": "stream_interrupted" }` to FE
3. Do not auto-retry -- let the user re-send their message

**Rate limiting:** Rust core enforces per-conversation rate limiting to prevent spam and runaway LLM costs.

## 5. LLM Integration

### 5.1 Model Configuration

**V1:** The platform selects the model. Users do not choose. This allows us to optimize model selection and switch providers without user impact.

**Model provider abstraction:** The Rust core abstracts the LLM behind an interface:

```
trait LlmProvider {
    async fn stream_chat(prompt: Vec<Message>) -> Stream<Token>;
}
```

V1 ships with one implementation. The trait ensures adding providers later is a config change, not a rewrite.

**Open question (deferred):** Whether to expose model selection to advanced users, support BYOK (bring your own key), and whether selection is per-account or per-strategy.

### 5.2 Model Parameters

| Parameter | Value | Rationale |
|---|---|---|
| Temperature | 0.2 | Low for deterministic strategy output |
| Max output tokens | 4,096 | Enough for explanation + full strategy JSON |
| Streaming | Enabled | Real-time chat text delivery |

### 5.3 Token Budget (V1, Full History)

| Component | Estimated Tokens |
|---|---|
| System prompt layers 1-3 (static) | ~7,000-10,500 |
| Current strategy JSON | ~500-1,000 |
| Version history metadata | ~200-500 |
| Conversation history -- text portions (20 turns) | ~10,000-20,000 |
| Conversation history -- strategy blocks in assistant messages (~10 versions) | ~5,000-10,000 |
| User's new message | ~50-200 |
| **Total input** | **~23,000-42,000** |
| LLM response (text + strategy) | ~1,000-3,000 |

Note: conversation history includes the full raw assistant responses (text + `<strategy>` blocks). Each strategy block in history adds ~500-1,000 tokens. This is intentional -- the LLM needs to see what it previously generated to maintain consistency.

Fits within 200K context windows. At 50+ turn conversations, consider upgrading to sliding window + summary (see Section 2.5). When summarizing, historical strategy blocks can be omitted since the current strategy + version metadata captures the same information.

## 6. Data Model

### 6.1 Database Tables

TBD

### 6.2 WebSocket Message Contracts

**Client -> Server:**

```json
{ "type": "user_message", "conversation_id": "uuid", "content": "string" }
```

```json
{ "type": "stop_generation", "conversation_id": "uuid" }
```

**Server -> Client:**

```json
{ "type": "chat_text", "conversation_id": "uuid", "delta": "string" }
```

```json
{ "type": "chat_text_done", "conversation_id": "uuid", "message_id": "uuid" }
```

```json
{
  "type": "strategy_update",
  "conversation_id": "uuid",
  "version": 3,
  "mode": "dsl | code",
  "strategy": {},
  "summary": "string"
}
```

```json
{
  "type": "backtest_result",
  "conversation_id": "uuid",
  "version": 3,
  "metrics": {},
  "error": "string | null"
}
```

```json
{ "type": "error", "conversation_id": "uuid", "code": "string", "message": "string" }
```

### 6.3 REST Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/conversations` | List all conversations for the authenticated user (paginated, sorted by updated_at desc). Returns summary: id, state, strategy name, last message preview, updated_at. |
| POST | `/conversations` | Create new conversation |
| GET | `/conversations/:id` | Get conversation with message history |
| GET | `/conversations/:id/versions` | List all strategy versions |
| GET | `/conversations/:id/versions/:v` | Get specific version with full strategy JSON |
| POST | `/conversations/:id/deploy` | Deploy current version to execution account. Locks conversation (v1). |
| DELETE | `/conversations/:id` | Archive conversation |

WebSocket handles the hot path (chat + streaming). REST handles everything else.

## 7. Open Questions

- **Post-deploy modification:** Should users be able to modify a strategy after it's been deployed for live trading? This has significant implications:
  - **Option A -- Lock strategy modifications.** Once deployed, the AI will not generate new strategy versions. The user can still chat (ask questions, discuss performance, learn about indicators) -- only strategy modification is locked. To modify, the user must stop the live strategy first, which returns the conversation to ITERATING state. Simplest and safest -- no risk of accidentally modifying a live strategy.
  - **Option B -- Draft versions alongside live.** Conversation stays open. New versions are "drafts" that don't affect the running version. User explicitly re-deploys when ready. More flexible, but adds complexity: the system needs to track "deployed version" vs "latest draft version" separately, and the UI must clearly distinguish them.
  - **Option C -- New conversation from deployed.** The deployed conversation locks. To modify, the user creates a new conversation that forks from the deployed strategy as its starting point (v1 of the new conversation = copy of the deployed version). Each conversation is one lifecycle.
  - V1 recommendation: **Option A** for simplicity. Lock the conversation on deploy. User stops the strategy to resume editing. This avoids draft/live version confusion entirely.
- **Model selection:** Should users choose LLM models? BYOK support? Per-account or per-strategy? (Deferred -- v1 uses platform-selected model.)
- **Context window optimization:** When to implement sliding window + compressed summary? Threshold of ~40-50 turns suggested, but needs real-world data. Clean upgrade path from full history (Approach A) to summary approach (Approach C).
- **Backtest error recovery:** When a code-mode strategy fails during backtest, should the AI auto-attempt a fix, or always ask the user? (V1: show error to user, let them ask AI to fix.)
- **Strategy naming:** Should the AI auto-name strategies, or ask the user? (Suggestion: AI auto-names based on the strategy logic, user can rename.)
