# Architecture Document - Freight Bidding Agent MVP

## Goal
Build a freight bidding agent that cuts quote turnaround from 3-24 hours to seconds by automating intake, rate collection, LLM-powered analysis, and markup application.

## Agent Loop

This solution uses a bounded LangGraph workflow with a real LLM reasoning node.

### Flow
1. validate_request - Pydantic validation. Reject bad input immediately before any carrier calls.
2. normalize_request - Assign request_id, derive lane string, detect domestic vs international, classify urgency from timeline_days.
3. collect_rates - Query 5 mock Canadian carriers. Filter each by timeout, weight limit, cargo type, and transit time.
4. llm_analyze_quotes - Pass all valid quotes and shipment context to OpenAI. LLM returns recommended carrier, natural language reasoning, risk flags, and confidence score. This is the key differentiator.
5. select_best_quote - Use LLM recommendation. Fallback to cheapest if LLM fails.
6. finalize_quote - Apply markup, set 24hr expiry timestamp, attach LLM reasoning to output.

## State Management

The graph shares a single AgentState TypedDict across all nodes. Each node receives the full state and returns a partial update.

State fields: input, normalized_request, carrier_quotes, invalid_quotes, llm_analysis, selected_quote, final_quote, status, errors, audit_trail.

For MVP state lives in memory per request. In production I would use Redis for short-lived quote state and Postgres for persistent quote history and audit logs.

## Why LangGraph

LangGraph keeps orchestration separate from business logic. Each node is independently testable. Conditional edges handle fail-fast on bad input and skip finalize if no valid quotes exist - without nested if/else chains.

## What I Would Swap In For Production

| Component | MVP | Production |
|---|---|---|
| Carrier data | Mock Python dicts | Real carrier REST APIs (Purolator, Day & Ross, XTL) |
| LLM | OpenAI gpt-4o-mini | Configurable - swap to Claude, Gemini, or local model |
| State store | In-memory | Redis (active quotes) + Postgres (history + audit) |
| LLM fallback | Cheapest rate | Retry with cached rates + alert ops team |
| Quote delivery | JSON response | Webhook to customer + email notification |
| Auth | None | JWT per customer, API key per integration |
| Observability | Python logging | Structured logs + LangSmith tracing for LLM calls |

## Failure Modes and Handling

1. Invalid request input
Example: missing destination, negative weight, unsupported cargo type.
Handling: Pydantic validation fails fast and returns structured error before any carrier calls.

2. Carrier timeout
Example: carrier API is slow or unavailable.
Handling: Each carrier is checked against CARRIER_TIMEOUT_SECONDS. Timed-out carriers move to invalid_quotes with a reason. Workflow continues with remaining carriers.

3. No valid quotes
Example: all carriers reject the shipment.
Handling: select_best_quote returns status failed with structured rejection reasons. Graph terminates cleanly via conditional edge.

4. LLM failure
Example: OpenAI is down or rate-limited.
Handling: llm_analyze_quotes catches all exceptions and falls back to cheapest valid rate. The workflow always produces a quote and never fails silently.

5. Business rule drift
Example: markup percentages change.
Handling: All business rules are environment-variable driven via AppConfig. No code changes needed.

## What I Would Build Next

1. Parallel carrier calls using asyncio to query all carriers simultaneously - cuts latency from O(n) to O(1)
2. Quote caching - cache carrier rates for 15 minutes to reduce API calls on repeat lanes
3. Human-in-the-loop - flag expensive quotes for manual approval before sending to customer
4. Historical lane pricing - feed past quotes into LLM prompt so it can detect anomalously high rates
5. Streaming API - return partial results as each carrier responds instead of waiting for all
