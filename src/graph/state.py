from __future__ import annotations
from typing import Any, Dict, List, Optional
from typing_extensions import TypedDict

class AgentState(TypedDict, total=False):
    input:              Dict[str, Any]
    normalized_request: Dict[str, Any]
    carrier_quotes:     List[Dict[str, Any]]
    invalid_quotes:     List[Dict[str, Any]]
    llm_analysis:       Optional[Dict[str, Any]]
    selected_quote:     Optional[Dict[str, Any]]
    final_quote:        Optional[Dict[str, Any]]
    status:             str
    errors:             List[str]
    audit_trail:        List[str]
