from src.graph.state import AgentState
from src.types.freight import FreightRequest

def validate_request(state: AgentState) -> AgentState:
    try:
        payload = FreightRequest.model_validate(state["input"])
        return {
            **state,
            "input":       payload.model_dump(),
            "status":      "validated",
            "errors":      state.get("errors", []),
            "audit_trail": state.get("audit_trail", []) + 
["request_validated"],
        }
    except Exception as exc:
        return {
            **state,
            "status":      "failed",
            "errors":      state.get("errors", []) + [str(exc)],
            "audit_trail": state.get("audit_trail", []) + 
["request_validation_failed"],
        }
