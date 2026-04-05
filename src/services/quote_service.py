from src.graph.freight_agent import build_freight_agent
from src.types.freight import FreightRequest

agent = build_freight_agent()

def run_quote_workflow(request: FreightRequest) -> dict:
    state = {
        "input":          request.model_dump(),
        "carrier_quotes": [],
        "invalid_quotes": [],
        "errors":         [],
        "audit_trail":    ["request_received"],
        "status":         "received",
    }
    result = agent.invoke(state)
    return {
        "request_id":      result.get("normalized_request", 
{}).get("request_id"),
        "shipment":        result.get("normalized_request"),
        "quotes_received": len(result.get("carrier_quotes", [])),
        "valid_quotes":    len(result.get("carrier_quotes", [])),
        "invalid_quotes":  result.get("invalid_quotes", []),
        "selected_quote":  result.get("final_quote"),
        "status":          result.get("status"),
        "errors":          result.get("errors", []),
        "audit_trail":     result.get("audit_trail", []),
    }
