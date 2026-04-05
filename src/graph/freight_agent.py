from langgraph.graph import END, START, StateGraph
from src.graph.state import AgentState
from src.nodes.validate_request import validate_request
from src.nodes.normalize_request import normalize_request
from src.nodes.collect_rates import collect_rates
from src.nodes.llm_analyze_quotes import llm_analyze_quotes
from src.nodes.select_best_quote import select_best_quote
from src.nodes.finalize_quote import finalize_quote

def route_after_validation(state: AgentState) -> str:
    return "normalize_request" if state.get("status") != "failed" else END

def route_after_selection(state: AgentState) -> str:
    return "finalize_quote" if state.get("status") != "failed" else END

def build_freight_agent():
    graph = StateGraph(AgentState)
    graph.add_node("validate_request",   validate_request)
    graph.add_node("normalize_request",  normalize_request)
    graph.add_node("collect_rates",      collect_rates)
    graph.add_node("llm_analyze_quotes", llm_analyze_quotes)
    graph.add_node("select_best_quote",  select_best_quote)
    graph.add_node("finalize_quote",     finalize_quote)
    graph.add_edge(START, "validate_request")
    graph.add_conditional_edges("validate_request", 
route_after_validation, {"normalize_request": "normalize_request", END: 
END})
    graph.add_edge("normalize_request",  "collect_rates")
    graph.add_edge("collect_rates",      "llm_analyze_quotes")
    graph.add_edge("llm_analyze_quotes", "select_best_quote")
    graph.add_conditional_edges("select_best_quote", 
route_after_selection, {"finalize_quote": "finalize_quote", END: END})
    graph.add_edge("finalize_quote", END)
    return graph.compile()
