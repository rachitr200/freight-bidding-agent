from datetime import datetime, timezone, timedelta
from src.graph.state import AgentState
from src.services.config import get_config
from src.types.freight import FinalQuote, NormalizedFreightRequest

def finalize_quote(state):
    config = get_config()
    request = NormalizedFreightRequest.model_validate(state["normalized_request"])
    selected = state["selected_quote"]
    analysis = state.get("llm_analysis", {})

    if request.customer_tier == "preferred":
        markup_percent = config.preferred_markup_percent
    else:
        markup_percent = config.default_markup_percent

    now = datetime.now(timezone.utc)
    expiry = now + timedelta(hours=config.quote_validity_hours)

    final = FinalQuote(
        request_id=request.request_id,
        selected_carrier=selected["carrier"],
        base_rate=selected["base_rate"],
        markup_percent=markup_percent,
        final_rate=round(selected["base_rate"] * (1 + markup_percent / 100), 2),
        currency=selected["currency"],
        estimated_transit_days=selected["estimated_transit_days"],
        quote_expires_at=expiry.isoformat(),
        llm_reasoning=analysis.get("reasoning", "N/A"),
        risk_flags=analysis.get("risk_flags", []),
        confidence=analysis.get("confidence", 0.0),
    )

    return {
        **state,
        "final_quote": final.model_dump(),
        "status": "quoted",
        "audit_trail": state.get("audit_trail", []) + ["final_quote_ready"],
    }
