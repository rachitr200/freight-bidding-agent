from uuid import uuid4
from src.graph.state import AgentState
from src.types.freight import FreightRequest, NormalizedFreightRequest

def _derive_urgency(days: int) -> str:
    if days <= 1: return "critical"
    if days <= 2: return "urgent"
    return "standard"

def normalize_request(state: AgentState) -> AgentState:
    request    = FreightRequest.model_validate(state["input"])
    normalized = NormalizedFreightRequest(
        **request.model_dump(),
        request_id    = str(uuid4()),
        lane          = f"{request.origin} -> {request.destination}",
        is_domestic   = ("Canada" in request.origin and "Canada" in 
request.destination),
        urgency_level = _derive_urgency(request.timeline_days),
    )
    return {
        **state,
        "normalized_request": normalized.model_dump(),
        "status":             "normalized",
        "audit_trail":        state.get("audit_trail", []) + 
["request_normalized"],
    }
