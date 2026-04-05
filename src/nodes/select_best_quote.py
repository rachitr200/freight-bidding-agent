import os
from src.graph.state import AgentState

def select_best_quote(state):
    quotes = state.get("carrier_quotes", [])
    analysis = state.get("llm_analysis", {})

    if not quotes:
        return {
            **state,
            "status": "failed",
            "errors": state.get("errors", []) + ["no valid quotes available"],
            "audit_trail": state.get("audit_trail", []) + ["quote_selection_failed"],
        }

    recommended = analysis.get("recommended_carrier") if analysis else None
    selected = None

    if recommended:
        selected = next((q for q in quotes if q["carrier"] == recommended), None)

    if not selected:
        selected = min(quotes, key=lambda q: q["base_rate"])

    return {
        **state,
        "selected_quote": selected,
        "status": "quote_selected",
        "audit_trail": state.get("audit_trail", []) + ["best_quote_selected"],
    }
