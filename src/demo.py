import json
from src.services.quote_service import run_quote_workflow
from src.types.freight import FreightRequest

def main():
    print("=" * 65)
    print("  AMZ Prep — Freight Bidding Agent MVP")
    print("  Stack: Python + LangGraph + OpenAI + FastAPI")
    print("=" * 65)

    request = FreightRequest(
        origin="Toronto, ON, Canada",
        destination="Vancouver, BC, Canada",
        weight_kg=420,
        cargo_type="general",
        timeline_days=3,
        customer_tier="preferred",
        currency="CAD",
        notes="Fragile electronics",
    )

    print("\n📦 Inbound Freight Request:")
    print(json.dumps(request.model_dump(), indent=2))
    print("\n🤖 Running LangGraph agent...\n")

    result = run_quote_workflow(request)

    sq = result.get("selected_quote", {})
    print("✅ Quote Generated:")
    print(f"   Carrier   : {sq.get('selected_carrier')}")
    print(f"   Base rate : {sq.get('currency')} {sq.get('base_rate')}")
    print(f"   Markup    : {sq.get('markup_percent')}%")
    print(f"   Final rate: {sq.get('currency')} {sq.get('final_rate')}")
    print(f"   Transit   : {sq.get('estimated_transit_days')} day(s)")
    print(f"   Expires   : {sq.get('quote_expires_at')}")
    print(f"   Confidence: {sq.get('confidence')}")
    print(f"\n🧠 LLM Reasoning:\n   {sq.get('llm_reasoning')}")

    invalid = result.get("invalid_quotes", [])
    if invalid:
        print(f"\n✗  {len(invalid)} carrier(s) rejected:")
        for q in invalid:
            print(f"   ✗ {q['carrier']}: {q['reason']}")

    print(f"\n📋 Audit trail:")
    for step in result.get("audit_trail", []):
        print(f"   ✓ {step}")

if __name__ == "__main__":
    main()
