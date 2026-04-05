import json
import os
from openai import OpenAI
from src.graph.state import AgentState
from src.utils.logger import get_logger

logger = get_logger(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def llm_analyze_quotes(state):
    quotes = state.get("carrier_quotes", [])
    req = state.get("normalized_request", {})
    invalid = state.get("invalid_quotes", [])
    if not quotes:
        return {**state, "llm_analysis": {"recommended_carrier": None, "reasoning": "No quotes.", "risk_flags": ["no quotes"], "confidence": 0.0}, "audit_trail": state.get("audit_trail", []) + ["llm_skipped"]}
    try:
        p = "Analyze freight quotes. Shipment:" + json.dumps(req) + " Quotes:" + json.dumps(quotes)
        p += " Return ONLY JSON: {recommended_carrier, reasoning, risk_flags, confidence}"
        r = client.chat.completions.create(model=os.getenv("LLM_MODEL","gpt-4o-mini"), messages=[{"role":"user","content":p}], max_tokens=400, temperature=0.2)
        raw = r.choices[0].message.content.strip().replace("```json","").replace("```","").strip()
        analysis = json.loads(raw)
    except Exception as e:
        cheapest = min(quotes, key=lambda q: q["base_rate"])
        analysis = {"recommended_carrier": cheapest["carrier"], "reasoning": "LLM unavailable.", "risk_flags": [str(e)], "confidence": 0.6}
    return {**state, "llm_analysis": analysis, "audit_trail": state.get("audit_trail", []) + ["llm_quotes_analyzed"]}
