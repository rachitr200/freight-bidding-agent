from __future__ import annotations
from src.data.mock_carriers import MOCK_CARRIERS
from src.types.freight import CarrierQuote, InvalidQuote, NormalizedFreightRequest
from src.services.config import get_config

def get_mock_quotes(request: NormalizedFreightRequest):
    config = get_config()
    valid = []
    invalid = []

    lane_factor = 1.0 if request.is_domestic else 1.40
    urgency_factor = {"standard": 1.0, "urgent": 1.15, "critical": 1.30}[request.urgency_level]
    base_cost = 200 + (request.weight_kg * 1.6) * urgency_factor

    for c in MOCK_CARRIERS:
        if c["timeout_prone"] and c["latency_seconds"] > config.carrier_timeout_seconds:
            invalid.append(InvalidQuote(carrier=c["name"], reason=f"carrier timed out after {config.carrier_timeout_seconds}s"))
            continue
        if request.weight_kg > c["max_weight_kg"]:
            invalid.append(InvalidQuote(carrier=c["name"], reason=f"weight {request.weight_kg}kg exceeds limit {c['max_weight_kg']}kg"))
            continue
        if request.cargo_type not in c["supported_cargo_types"]:
            invalid.append(InvalidQuote(carrier=c["name"], reason=f"cargo type not supported"))
            continue
        if c["transit_days"] > request.timeline_days:
            invalid.append(InvalidQuote(carrier=c["name"], reason=f"transit {c['transit_days']} days exceeds requested {request.timeline_days} days"))
            continue
        valid.append(CarrierQuote(
            carrier=c["name"],
            base_rate=round(base_cost * lane_factor * c["base_rate_multiplier"], 2),
            currency=request.currency,
            estimated_transit_days=c["transit_days"],
            valid=True,
            reliability_score=c["reliability_score"]
        ))

    return valid, invalid
