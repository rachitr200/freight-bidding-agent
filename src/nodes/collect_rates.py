from src.graph.state import AgentState
from src.services.carrier_service import get_mock_quotes
from src.types.freight import NormalizedFreightRequest

def collect_rates(state: AgentState) -> AgentState:
    request = NormalizedFreightRequest.model_validate(state["normalized_request"])
    quotes, invalid = get_mock_quotes(request)
    return {
        **state,
        "carrier_quotes": [q.model_dump() for q in quotes],
        "invalid_quotes": [q.model_dump() for q in invalid],
        "status": "rates_collected",
        "audit_trail": state.get("audit_trail", []) + ["carrier_rates_collected"],
    }
